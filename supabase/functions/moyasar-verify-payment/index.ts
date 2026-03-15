import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateInvoiceNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${date}-${rand}`;
}

const VAT_RATE = 0.15;

async function getCommissionRate(adminClient: any): Promise<number> {
  const { data: config } = await adminClient
    .from("commission_config")
    .select("rate")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return config?.rate ?? 0.05;
}

async function createInvoiceAndNotifyAdmin(
  adminClient: any,
  escrowId: string,
  issuedTo: string,
  baseAmount: number,
  commissionRate: number
) {
  const commissionAmount = Math.round(baseAmount * commissionRate * 100) / 100;
  const vatAmount = Math.round(baseAmount * VAT_RATE * 100) / 100;

  const { error: invErr } = await adminClient.from("invoices").insert({
    invoice_number: generateInvoiceNumber(),
    amount: baseAmount,
    commission_amount: commissionAmount,
    issued_to: issuedTo,
    escrow_id: escrowId,
    notes: `ضريبة القيمة المضافة: ${vatAmount} ر.س`,
  });
  if (invErr) {
    console.error("Invoice creation error:", invErr);
    return;
  }

  const { data: admins } = await adminClient
    .from("user_roles")
    .select("user_id")
    .eq("role", "super_admin");

  if (admins?.length) {
    const notifications = admins.map((a: any) => ({
      user_id: a.user_id,
      message: `فاتورة إلكترونية جديدة بمبلغ ${baseAmount} ر.س تم إنشاؤها تلقائياً بعد دفع إلكتروني`,
      type: "payment",
      entity_id: escrowId,
      entity_type: "escrow",
    }));
    await adminClient.from("notifications").insert(notifications);
  }
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
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

    const verifyRes = await fetch(`https://api.moyasar.com/v1/payments/${payment_id}`, {
      headers: {
        Authorization: `Basic ${btoa(MOYASAR_SECRET_KEY + ":")}`,
      },
    });

    const paymentData = await verifyRes.json();
    const traceId = paymentData?.metadata?.trace_id || "no-trace";
    console.log(`[verify] payment_id=${payment_id} trace_id=${traceId} status=${paymentData?.status}`);
    if (!verifyRes.ok) {
      console.error("Moyasar verify error:", paymentData);
      return new Response(
        JSON.stringify({ error: "Payment verification failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    const amountSAR = paymentData.amount / 100;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const commissionRate = await getCommissionRate(adminClient);

    // --- Global Idempotency Check: prevent replay attacks ---
    // Check if this payment_id was already processed by looking at receipt_url field
    const { data: existingByPaymentId } = await adminClient
      .from("escrow_transactions")
      .select("id")
      .eq("receipt_url", `moyasar:${payment_id}`)
      .maybeSingle();

    if (existingByPaymentId) {
      console.log("Idempotency: payment_id already processed:", payment_id);
      return new Response(
        JSON.stringify({ verified: true, status: "paid", amount: amountSAR, payment_id: paymentData.id, duplicate: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const paymentContext = context || paymentData.metadata || {};
    const contextType = paymentContext.type;

    if (contextType === "checkout") {
      await processCheckout(adminClient, userId, paymentContext, commissionRate, payment_id);
    } else if (contextType === "donation") {
      const donationBaseAmount = paymentContext.subtotal || amountSAR;
      await processDonation(adminClient, userId, paymentContext, donationBaseAmount, commissionRate, payment_id);
    } else if (contextType === "project_payment") {
      await processProjectPayment(adminClient, userId, paymentContext, commissionRate, payment_id);
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

async function processCheckout(adminClient: any, userId: string, ctx: any, commissionRate: number, paymentId?: string) {
  const items = ctx.items || [];
  const beneficiaryId = ctx.beneficiary_id || null;
  const skipProjectCreation = ctx.skip_project_creation === true;

  // Check if buyer is a youth_association
  const { data: buyerRole } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .single();
  const isAssociation = buyerRole?.role === "youth_association";

  for (const item of items) {
    let projectId: string | null = item.project_id || null;

    if (skipProjectCreation) {
      console.log("Skipping project/contract/bid creation as requested by context (hybrid payment)");
    } else if (beneficiaryId) {
      // Donor buying for a beneficiary association
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
          entity_id: project.id,
          entity_type: "project",
        });
      }
    } else if (isAssociation) {
      // Association buying directly — auto-create project + contract
      const title = item.title || "خدمة من السوق";
      const hoursNote = item.hours ? ` (${item.hours} ساعة)` : "";
      const { data: project, error: projErr } = await adminClient
        .from("projects")
        .insert({
          title: title + hoursNote,
          description: `شراء مباشر من السوق — ${title}${hoursNote}`,
          association_id: userId,
          assigned_provider_id: item.provider_id,
          status: "in_progress",
          budget: item.price,
          is_private: true,
        })
        .select("id")
        .single();
      if (projErr) {
        console.error("Project creation error (association):", projErr);
      } else {
        projectId = project.id;
        // Create contract WITHOUT auto-signing — association must review and sign
        const contractTerms = `نطاق العمل:\n${title}${hoursNote}\n\nشراء مباشر من السوق — يلتزم مقدم الخدمة بتنفيذ الخدمة وفق الوصف المتفق عليه.`;
        await adminClient.from("contracts").insert({
          project_id: project.id,
          association_id: userId,
          provider_id: item.provider_id,
          terms: contractTerms,
        });

        // Create auto-accepted bid so provider appears in bids tab
        await adminClient.from("bids").insert({
          project_id: project.id,
          provider_id: item.provider_id,
          price: item.price,
          timeline_days: 30,
          cover_letter: "عرض تلقائي — شراء خدمة من السوق",
          status: "accepted",
        });

        // Notify provider about the purchase and assignment
        await adminClient.from("notifications").insert({
          user_id: item.provider_id,
          message: `تم شراء خدمتك "${title}" وتعيينك على مشروع جديد — يرجى مراجعة العقد وتوقيعه`,
          type: "service_purchased_assigned",
          entity_id: project.id,
          entity_type: "project",
        });
      }
    }

    const { data: escrow, error: escrowErr } = await adminClient
      .from("escrow_transactions")
      .insert({
        service_id: item.service_id,
        payer_id: userId,
        payee_id: item.provider_id,
        amount: item.price,
        status: "held",
        project_id: projectId,
        beneficiary_id: beneficiaryId,
        receipt_url: paymentId ? `moyasar:${paymentId}` : null,
      })
      .select("id")
      .single();

    if (escrowErr) {
      console.error("Escrow creation error:", escrowErr);
    } else {
      await createInvoiceAndNotifyAdmin(adminClient, escrow.id, userId, item.price, commissionRate);
    }

    // Only create donor_contributions for donors, not associations
    if (!isAssociation) {
      await adminClient.from("donor_contributions").insert({
        donor_id: userId,
        service_id: item.service_id,
        association_id: beneficiaryId,
        amount: item.price,
      });
    }
  }

  await adminClient.from("cart_items").delete().eq("user_id", userId);
}

async function processDonation(adminClient: any, userId: string, ctx: any, amountSAR: number, commissionRate: number, paymentId?: string) {
  const targetType = ctx.target_type;
  const associationId = ctx.association_id;
  const projectId = ctx.project_id || null;
  const grantRequestId = ctx.grant_request_id || null;

  let escrowData: any = null;

  if (targetType === "association") {
    const { data, error } = await adminClient.from("escrow_transactions").insert({
      payer_id: userId,
      payee_id: associationId,
      beneficiary_id: associationId,
      amount: amountSAR,
      status: "held",
      grant_request_id: grantRequestId,
      receipt_url: paymentId ? `moyasar:${paymentId}` : null,
    }).select("id").single();
    if (error) console.error("Escrow error:", error);
    else escrowData = data;
  } else {
    const { data: project } = await adminClient
      .from("projects")
      .select("assigned_provider_id")
      .eq("id", projectId)
      .single();

    const payeeId = project?.assigned_provider_id || associationId;

    const { data, error } = await adminClient.from("escrow_transactions").insert({
      payer_id: userId,
      payee_id: payeeId,
      beneficiary_id: associationId,
      amount: amountSAR,
      status: "held",
      project_id: projectId,
      grant_request_id: grantRequestId,
      receipt_url: paymentId ? `moyasar:${paymentId}` : null,
    }).select("id").single();
    if (error) console.error("Escrow error:", error);
    else escrowData = data;
  }

  if (escrowData) {
    await createInvoiceAndNotifyAdmin(adminClient, escrowData.id, userId, amountSAR, commissionRate);
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

async function processProjectPayment(adminClient: any, userId: string, ctx: any, commissionRate: number, paymentId?: string) {
  const projectId = ctx.project_id;
  const providerId = ctx.provider_id;
  const baseAmount = ctx.subtotal || 0;

  if (!projectId || !providerId) {
    console.error("Missing project_id or provider_id in project_payment context");
    return;
  }

  // Idempotency: check if an active escrow already exists for this project
  const { data: existingEscrow } = await adminClient
    .from("escrow_transactions")
    .select("id")
    .eq("project_id", projectId)
    .in("status", ["held", "pending_payment"])
    .maybeSingle();

  if (existingEscrow) {
    console.log("Idempotency: active escrow already exists for project", projectId);
    return;
  }

  // 1. Create escrow with status 'held' (payment already completed)
  const { data: escrow, error: escrowErr } = await adminClient
    .from("escrow_transactions")
    .insert({
      project_id: projectId,
      payer_id: userId,
      payee_id: providerId,
      amount: baseAmount,
      status: "held",
      receipt_url: paymentId ? `moyasar:${paymentId}` : null,
    })
    .select("id")
    .single();

  if (escrowErr) {
    console.error("Escrow creation error:", escrowErr);
    return;
  }

  // 2. Create contract WITHOUT auto-signing — association must review and sign
  const { data: projData } = await adminClient.from("projects").select("title, description").eq("id", projectId).single();
  const contractTerms = `نطاق العمل:\n${projData?.title || "طلب"}\n\n${projData?.description || "يلتزم مقدم الخدمة بتنفيذ العمل وفق الوصف المتفق عليه."}`;
  const { error: contractErr } = await adminClient.from("contracts").insert({
    project_id: projectId,
    association_id: userId,
    provider_id: providerId,
    terms: contractTerms,
  });
  if (contractErr) {
    console.error("Contract creation error:", contractErr);
  }

  // 3. Create auto-accepted bid so provider appears in bids tab
  const { data: existingBid } = await adminClient
    .from("bids")
    .select("id")
    .eq("project_id", projectId)
    .eq("provider_id", providerId)
    .maybeSingle();

  if (!existingBid) {
    await adminClient.from("bids").insert({
      project_id: projectId,
      provider_id: providerId,
      price: baseAmount,
      timeline_days: 30,
      cover_letter: "عرض تلقائي — دفع مشروع",
      status: "accepted",
    });
  }

  // 4. Update project status to in_progress
  const { error: projErr } = await adminClient.from("projects").update({
    status: "in_progress",
  }).eq("id", projectId);
  if (projErr) {
    console.error("Project status update error:", projErr);
  }

  // 5. Auto-generate invoice
  await createInvoiceAndNotifyAdmin(adminClient, escrow.id, userId, baseAmount, commissionRate);
}
