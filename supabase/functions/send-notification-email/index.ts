import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RELAY_URL = "https://api.sharedservices.solutions/send-email.php";

/* ─── defaults per notification type ─── */
const DEFAULT_ENABLED: Record<string, boolean> = {
  bid_accepted: true,
  bid_rejected: true,
  project_completed: true,
  project_cancelled: true,
  project_disputed: true,
  contract_created: true,
  contract_signed: true,
  escrow_released: true,
  escrow_refunded: true,
  withdrawal_approved: true,
  withdrawal_rejected: true,
  withdrawal_processed: true,
  service_approved: true,
  service_rejected: true,
  bank_transfer_approved: true,
  bank_transfer_rejected: true,
  invoice_created: true,
  dispute_opened: true,
  dispute_resolved: true,
  grant_request_approved: true,
  grant_request_rejected: true,
  grant_request_funded: true,
  grant_request_received: true,
  bank_transfer_pending: true,
  deliverable_accepted: true,
  deliverable_revision: true,
  message_received: false,
  bid_received: false,
  escrow_created: false,
  escrow_frozen: false,
  timelog_approved: false,
  timelog_rejected: false,
  timelog_submitted: false,
  project_in_progress: false,
  project_open: false,
  project_suspended: false,
  service_purchased: false,
  service_suspended: false,
  deliverable_submitted: false,
  bid_comment: false,
  contact_message: false,
  donation_received: false,
};

function isTypeEnabled(
  preferences: Record<string, boolean> | null,
  type: string
): boolean {
  if (preferences && type in preferences) return preferences[type];
  return DEFAULT_ENABLED[type] ?? true;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const typeLabels: Record<string, string> = {
  info: "إشعار",
  bid_received: "عرض سعر جديد",
  bid_accepted: "تم قبول عرضك",
  bid_rejected: "تم رفض عرضك",
  bid_comment: "تعليق على عرض",
  contract_created: "عقد جديد",
  contract_signed: "توقيع عقد",
  escrow_created: "ضمان مالي",
  escrow_released: "تحرير ضمان مالي",
  escrow_refunded: "استرداد ضمان مالي",
  escrow_frozen: "تجميد ضمان مالي",
  project_open: "مشروع مفتوح",
  project_in_progress: "بدء العمل",
  project_completed: "إكمال مشروع",
  project_cancelled: "إلغاء مشروع",
  project_disputed: "نزاع على مشروع",
  project_suspended: "تعليق مشروع",
  dispute_opened: "نزاع جديد",
  dispute_resolved: "تسوية نزاع",
  service_approved: "الموافقة على خدمة",
  service_rejected: "رفض خدمة",
  service_suspended: "تعليق خدمة",
  service_purchased: "شراء خدمة",
  withdrawal_approved: "الموافقة على سحب",
  withdrawal_rejected: "رفض سحب",
  withdrawal_processed: "تحويل سحب",
  bank_transfer_pending: "تحويل بنكي جديد",
  bank_transfer_approved: "الموافقة على تحويل",
  bank_transfer_rejected: "رفض تحويل",
  invoice_created: "فاتورة جديدة",
  timelog_submitted: "تسجيل ساعات",
  timelog_approved: "الموافقة على ساعات",
  timelog_rejected: "رفض ساعات",
  deliverable_submitted: "تسليم ملفات",
  deliverable_accepted: "قبول تسليمات",
  deliverable_revision: "طلب تعديلات",
  message_received: "رسالة جديدة",
  grant_request_received: "طلب منحة",
  grant_request_approved: "الموافقة على منحة",
  grant_request_rejected: "رفض منحة",
  grant_request_funded: "تمويل منحة",
  contact_message: "رسالة تواصل",
  donation_received: "تبرع جديد",
};

function buildEmailHTML(toName: string, message: string, type: string): string {
  const label = typeLabels[type] || "إشعار";
  const safeName = escapeHtml(toName);
  const safeMessage = escapeHtml(message);
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
        <p style="margin:0 0 8px;color:#64748b;font-size:13px;">${label}</p>
        <p style="margin:0 0 16px;color:#1e293b;font-size:15px;">مرحباً ${safeName || ""},</p>
        <div style="background:#f8fafc;border-right:4px solid #14b8a6;padding:16px 20px;border-radius:8px;margin:16px 0;">
          <p style="margin:0;color:#334155;font-size:15px;line-height:1.7;">${safeMessage}</p>
        </div>
        <a href="https://youth-hub-sa.lovable.app/notifications" style="display:inline-block;margin-top:20px;padding:10px 28px;background:#0f766e;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;">
          عرض الإشعارات
        </a>
      </td>
    </tr>
    <tr>
      <td style="background:#f8fafc;padding:16px 30px;text-align:center;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:11px;">هذا البريد تم إرساله تلقائياً من منصة الشباب. يمكنك إيقاف إشعارات البريد من إعدادات حسابك.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let notificationId: string | undefined;

  try {
    const { notification_id } = await req.json();
    notificationId = notification_id;

    if (!notification_id) {
      return new Response(JSON.stringify({ error: "Missing notification_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the notification
    const { data: notification, error: nErr } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("id", notification_id)
      .single();

    if (nErr || !notification) {
      console.error("Notification not found:", nErr);
      return new Response(JSON.stringify({ error: "Notification not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user profile
    const { data: profile, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email_notifications, notification_preferences")
      .eq("id", notification.user_id)
      .single();

    if (pErr || !profile) {
      console.error("Profile not found:", pErr);
      return new Response(JSON.stringify({ skipped: true, reason: "profile_not_found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check master toggle
    if (!profile.email_notifications) {
      console.log(`⏭️ Skipped: email_notifications disabled for user ${notification.user_id}`);
      return new Response(JSON.stringify({ skipped: true, reason: "master_disabled" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check per-type preference
    const prefs = (profile.notification_preferences as Record<string, boolean>) || {};
    if (!isTypeEnabled(prefs, notification.type)) {
      console.log(`⏭️ Skipped: type "${notification.type}" disabled for user ${notification.user_id}`);
      return new Response(JSON.stringify({ skipped: true, reason: "type_disabled" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user email from auth
    const { data: authUser, error: aErr } = await supabaseAdmin.auth.admin.getUserById(
      notification.user_id
    );
    if (aErr || !authUser?.user?.email) {
      console.error("Auth user not found or no email:", aErr);
      return new Response(JSON.stringify({ skipped: true, reason: "no_email" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userEmail = authUser.user.email;
    const userName = profile.full_name || "";

    // Build email
    const subject = `${typeLabels[notification.type] || "إشعار"} - منصة الشباب`;
    const html = buildEmailHTML(userName, notification.message, notification.type);

    // Send via PHP relay
    const relayApiKey = Deno.env.get("RELAY_API_KEY");
    if (!relayApiKey) {
      throw new Error("RELAY_API_KEY secret is not configured");
    }

    const relayResponse = await fetch(RELAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${relayApiKey}`,
      },
      body: JSON.stringify({
        to: userEmail,
        subject,
        body: html,
      }),
    });

    if (!relayResponse.ok) {
      const errorText = await relayResponse.text();
      throw new Error(`Relay returned ${relayResponse.status}: ${errorText}`);
    }

    // Consume response body
    const relayResult = await relayResponse.text();
    console.log(`📧 Relay response: ${relayResult}`);

    // Update delivery_status to sent
    await supabaseAdmin
      .from("notifications")
      .update({ delivery_status: "email_sent" })
      .eq("id", notification_id);

    console.log(`📧 Email sent to ${userEmail} for type "${notification.type}"`);

    return new Response(
      JSON.stringify({ success: true, to: userEmail, type: notification.type }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-notification-email:", error);

    // Mark as failed in DB
    if (notificationId) {
      try {
        await supabaseAdmin
          .from("notifications")
          .update({ delivery_status: "failed" })
          .eq("id", notificationId);
        console.log(`❌ Marked notification ${notificationId} as failed`);
      } catch (dbErr) {
        console.error("Failed to update delivery_status:", dbErr);
      }
    }

    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
