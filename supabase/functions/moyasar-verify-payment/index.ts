import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Use getClaims for local JWT verification (no network call)
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;
    const { payment_id, context } = await req.json();

    if (!payment_id) {
      return new Response(JSON.stringify({ error: "Missing payment_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const MOYASAR_SECRET_KEY = Deno.env.get("MOYASAR_SECRET_KEY");
    if (!MOYASAR_SECRET_KEY) {
      return new Response(JSON.stringify({ error: "Payment gateway not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify payment with Moyasar
    const verifyRes = await fetch(`https://api.moyasar.com/v1/payments/${payment_id}`, {
      headers: {
        Authorization: `Basic ${btoa(MOYASAR_SECRET_KEY + ":")}`,
      },
    });

    const paymentData = await verifyRes.json();

    if (!verifyRes.ok) {
      console.error("Moyasar verify error:", paymentData);
      return new Response(
        JSON.stringify({ error: "Payment verification failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify that the payment user matches
    if (paymentData.metadata?.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Payment user mismatch" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (paymentData.status !== "paid") {
      return new Response(
        JSON.stringify({
          verified: false,
          status: paymentData.status,
          message: "Payment not completed",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Payment is verified — amount is in halalas, convert to SAR
    const amountSAR = paymentData.amount / 100;

    // Use service role to create escrow records
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Context determines what type of payment this is
    const paymentContext = context || paymentData.metadata || {};
    const contextType = paymentContext.type;

    if (contextType === "checkout") {
      await processCheckout(adminClient, userId, paymentContext);
    } else if (contextType === "donation") {
      await processDonation(adminClient, userId, paymentContext, amountSAR);
    }

    return new Response(
      JSON.stringify({
        verified: true,
        status: "paid",
        amount: amountSAR,
        payment_id: paymentData.id,
      }),
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

async function processCheckout(adminClient: any, userId: string, ctx: any) {
  const items = ctx.items || [];
  const beneficiaryId = ctx.beneficiary_id || null;

  for (const item of items) {
    let projectId: string | null = null;

    if (beneficiaryId) {
      const title = item.title || "خدمة ممولة من مانح";
      const hoursNote = item.hours ? ` (${item.hours} ساعة)` : "";
      const { data: project, error: projErr } = await adminClient
        .from("projects")
        .insert({
          title: title + hoursNote,
          description: `خدمة ممولة تلقائياً من مانح — ${title}${hoursNote}`,
          association_id: beneficiaryId,
          assigned_provider_id: item.provider_id,
          status: "in_progress",
          budget: item.price,
          is_private: true,
        })
        .select("id")
        .single();
      if (projErr) {
        console.error("Project creation error:", projErr);
      } else {
        projectId = project.id;
        await adminClient.from("notifications").insert({
          user_id: beneficiaryId,
          message: `قام مانح بتمويل خدمة "${title}" لصالح جمعيتكم`,
          type: "donor_funded_service",
        });
      }
    }

    await adminClient.from("escrow_transactions").insert({
      service_id: item.service_id,
      payer_id: userId,
      payee_id: item.provider_id,
      amount: item.price,
      status: "held",
      project_id: projectId,
      beneficiary_id: beneficiaryId,
    });

    await adminClient.from("donor_contributions").insert({
      donor_id: userId,
      service_id: item.service_id,
      association_id: beneficiaryId,
      amount: item.price,
    });
  }

  await adminClient.from("cart_items").delete().eq("user_id", userId);
}

async function processDonation(adminClient: any, userId: string, ctx: any, amountSAR: number) {
  const targetType = ctx.target_type;
  const associationId = ctx.association_id;
  const projectId = ctx.project_id || null;
  const grantRequestId = ctx.grant_request_id || null;

  if (targetType === "association") {
    await adminClient.from("escrow_transactions").insert({
      payer_id: userId,
      payee_id: associationId,
      beneficiary_id: associationId,
      amount: amountSAR,
      status: "held",
      grant_request_id: grantRequestId,
    });
  } else {
    const { data: project } = await adminClient
      .from("projects")
      .select("assigned_provider_id")
      .eq("id", projectId)
      .single();

    const payeeId = project?.assigned_provider_id || associationId;

    await adminClient.from("escrow_transactions").insert({
      payer_id: userId,
      payee_id: payeeId,
      beneficiary_id: associationId,
      amount: amountSAR,
      status: "held",
      project_id: projectId,
      grant_request_id: grantRequestId,
    });
  }

  await adminClient.from("donor_contributions").insert({
    donor_id: userId,
    amount: amountSAR,
    project_id: projectId,
    association_id: associationId,
  });

  if (grantRequestId) {
    await adminClient
      .from("grant_requests")
      .update({ status: "funded" })
      .eq("id", grantRequestId);
  }
}
