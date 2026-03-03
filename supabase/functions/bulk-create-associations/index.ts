import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AssociationData {
  organization_name: string;
  license_number: string;
  email: string;
  phone: string;
  contact_officer_name: string;
  contact_officer_phone: string;
  contact_officer_email: string;
  contact_officer_title: string;
  password: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Check admin role
    const { data: roleData } = await anonClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "super_admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role client for admin operations
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { associations } = await req.json() as { associations: AssociationData[] };

    if (!associations?.length) {
      return new Response(JSON.stringify({ error: "No associations provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const assoc of associations) {
      try {
        // Create auth user
        const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
          email: assoc.email,
          password: assoc.password,
          email_confirm: true,
          user_metadata: {
            full_name: assoc.contact_officer_name,
            role: "youth_association",
            phone: assoc.phone,
          },
        });

        if (createError) {
          results.push({ email: assoc.email, success: false, error: createError.message });
          continue;
        }

        if (userData.user) {
          // Update profile with additional fields
          const { error: updateError } = await adminClient
            .from("profiles")
            .update({
              organization_name: assoc.organization_name,
              license_number: assoc.license_number,
              contact_officer_name: assoc.contact_officer_name,
              contact_officer_phone: assoc.contact_officer_phone,
              contact_officer_email: assoc.contact_officer_email,
              contact_officer_title: assoc.contact_officer_title,
              is_verified: true,
            })
            .eq("id", userData.user.id);

          if (updateError) {
            results.push({
              email: assoc.email,
              success: false,
              error: `User created but profile update failed: ${updateError.message}`,
            });
            continue;
          }
        }

        results.push({ email: assoc.email, success: true });
      } catch (err: any) {
        results.push({ email: assoc.email, success: false, error: err.message });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return new Response(
      JSON.stringify({
        summary: { total: associations.length, success: successCount, failed: failCount },
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Bulk create error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
