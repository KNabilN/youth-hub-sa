import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RELAY_URL = "https://api.sharedservices.solutions/send-email.php";

function buildConfirmationHTML(actionLink: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Tahoma,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:30px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <tr>
      <td style="background:linear-gradient(135deg,#0f766e,#14b8a6);padding:24px 30px;text-align:center;">
        <h1 style="margin:0;color:#fff;font-size:22px;">منصة الشباب</h1>
        <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Youth Hub SA</p>
      </td>
    </tr>
    <tr>
      <td style="padding:30px;">
        <p style="margin:0 0 16px;color:#1e293b;font-size:15px;">مرحباً،</p>
        <div style="background:#f8fafc;border-right:4px solid #14b8a6;padding:16px 20px;border-radius:8px;margin:16px 0;">
          <p style="margin:0;color:#334155;font-size:15px;line-height:1.7;">يرجى تأكيد حسابك في منصة الشباب بالضغط على الزر أدناه للدخول إلى حسابك.</p>
        </div>
        <a href="${actionLink}" style="display:inline-block;margin-top:20px;padding:12px 32px;background:#0f766e;color:#fff;border-radius:8px;text-decoration:none;font-size:15px;font-weight:bold;">
          تأكيد الحساب
        </a>
        <p style="margin:20px 0 0;color:#94a3b8;font-size:12px;">إذا لم تطلب هذا البريد، يمكنك تجاهله.</p>
      </td>
    </tr>
    <tr>
      <td style="background:#f8fafc;padding:16px 30px;text-align:center;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:11px;">هذا البريد تم إرساله تلقائياً من منصة الشباب.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: callerUser }, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !callerUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check caller is super_admin
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerUser.id)
      .eq("role", "super_admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: "Missing user_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user email
    const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(user_id);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = userData.user.email;
    if (!email) {
      return new Response(JSON.stringify({ error: "User has no email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate magic link
    console.log("Generating magic link for:", email);
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    if (linkError) {
      console.error("generateLink error:", linkError.message);
      return new Response(JSON.stringify({ error: linkError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const actionLink = linkData.properties.action_link;
    console.log("Magic link generated, sending via relay to:", email);

    // Send via PHP Relay
    const relayApiKey = Deno.env.get("RELAY_API_KEY");
    if (!relayApiKey) {
      throw new Error("RELAY_API_KEY secret is not configured");
    }

    const relayResponse = await fetch(RELAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": relayApiKey,
      },
      body: JSON.stringify({
        to: email,
        subject: "تأكيد حسابك — منصة الشباب",
        html: buildConfirmationHTML(actionLink),
        text: `استخدم هذا الرابط للدخول: ${actionLink}`,
      }),
    });

    const relayResult = await relayResponse.text();
    console.log("Relay response:", relayResponse.status, relayResult);

    if (!relayResponse.ok) {
      throw new Error(`Relay returned ${relayResponse.status}: ${relayResult}`);
    }

    console.log("Confirmation email sent successfully to:", email);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
