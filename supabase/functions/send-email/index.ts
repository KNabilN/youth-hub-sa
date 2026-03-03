import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const typeLabels: Record<string, string> = {
  info: "إشعار",
  bid_received: "عرض سعر جديد",
  bid_accepted: "تم قبول عرضك",
  bid_rejected: "تم رفض عرضك",
  contract_signed: "توقيع عقد",
  escrow_created: "ضمان مالي",
  project_update: "تحديث مشروع",
  dispute_opened: "نزاع جديد",
  dispute_resolved: "تمت تسوية النزاع",
  payment: "عملية دفع",
  warning: "تنبيه",
  success: "تمت العملية بنجاح",
};

function buildEmailHTML(toName: string, message: string, type: string): string {
  const label = typeLabels[type] || "إشعار";
  return `
<!DOCTYPE html>
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
        <p style="margin:0 0 16px;color:#1e293b;font-size:15px;">مرحباً ${toName || ""},</p>
        <div style="background:#f8fafc;border-right:4px solid #14b8a6;padding:16px 20px;border-radius:8px;margin:16px 0;">
          <p style="margin:0;color:#334155;font-size:15px;line-height:1.7;">${message}</p>
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

  try {
    // Verify JWT authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { to_email, to_name, subject, body, type } = await req.json();

    if (!to_email || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to_email, body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailSubject = subject || `${typeLabels[type] || "إشعار"} - منصة الشباب`;
    const emailHTML = buildEmailHTML(to_name || "", body, type || "info");

    // Log the email for audit (actual SMTP like Resend can be added here)
    console.log(`📧 Email: to=${to_email}, subject=${emailSubject}, type=${type}`);
    console.log(`📧 HTML length: ${emailHTML.length} chars`);

    // Future: integrate with Resend, SendGrid, or AWS SES here
    // For now, log successfully - the notification is already stored in DB

    return new Response(
      JSON.stringify({ success: true, message: "Email notification processed", to: to_email }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
