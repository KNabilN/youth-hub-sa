import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const typeLabels: Record<string, string> = {
  deliverable_submitted: "تسليم جديد",
  deliverable_accepted: "قبول التسليمات",
  deliverable_revision: "طلب تعديلات",
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
        <p style="margin:0;color:#94a3b8;font-size:11px;">هذا البريد تم إرساله تلقائياً من منصة الشباب.</p>
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create admin client to look up emails
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { project_id, action } = await req.json();
    // action: "submitted" | "accepted" | "revision_requested"

    if (!project_id || !action) {
      return new Response(JSON.stringify({ error: "Missing project_id or action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get project info
    const { data: project, error: projErr } = await adminClient
      .from("projects")
      .select("title, association_id, assigned_provider_id")
      .eq("id", project_id)
      .single();
    if (projErr || !project) {
      console.error("Project not found:", projErr);
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine recipient
    let recipientId: string;
    let emailType: string;
    let emailMessage: string;

    if (action === "submitted") {
      // Provider submitted → notify association
      recipientId = project.association_id;
      emailType = "deliverable_submitted";
      const { data: provider } = await adminClient
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      emailMessage = `قام ${provider?.full_name || "مقدم الخدمة"} بتقديم تسليمات جديدة لمشروع "${project.title}" للمراجعة.`;
    } else if (action === "accepted") {
      // Association accepted → notify provider
      recipientId = project.assigned_provider_id;
      emailType = "deliverable_accepted";
      emailMessage = `تم قبول تسليماتك في مشروع "${project.title}". أحسنت!`;
    } else if (action === "revision_requested") {
      // Association requested revisions → notify provider
      recipientId = project.assigned_provider_id;
      emailType = "deliverable_revision";
      emailMessage = `تم طلب تعديلات على تسليماتك في مشروع "${project.title}". يرجى مراجعة الملاحظات وإعادة التقديم.`;
    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!recipientId) {
      return new Response(JSON.stringify({ success: true, message: "No recipient" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check recipient notification preferences
    const { data: recipientProfile } = await adminClient
      .from("profiles")
      .select("full_name, email_notifications, notification_preferences")
      .eq("id", recipientId)
      .single();

    if (!recipientProfile?.email_notifications) {
      console.log("📧 Email notifications disabled for recipient");
      return new Response(JSON.stringify({ success: true, message: "Email disabled by user" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check specific preference
    const prefs = (recipientProfile.notification_preferences as Record<string, boolean>) || {};
    if (prefs[emailType] === false) {
      console.log(`📧 Notification type ${emailType} disabled by user`);
      return new Response(JSON.stringify({ success: true, message: "Type disabled" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get recipient email from auth
    const { data: { user: recipientUser }, error: recipientErr } =
      await adminClient.auth.admin.getUserById(recipientId);
    if (recipientErr || !recipientUser?.email) {
      console.error("Recipient email not found:", recipientErr);
      return new Response(JSON.stringify({ success: true, message: "No email" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailHTML = buildEmailHTML(
      recipientProfile.full_name || "",
      emailMessage,
      emailType
    );

    const emailSubject = `${typeLabels[emailType] || "إشعار"} - ${project.title} - منصة الشباب`;

    console.log(`📧 Deliverable email: to=${recipientUser.email}, type=${emailType}, subject=${emailSubject}`);
    console.log(`📧 HTML length: ${emailHTML.length} chars`);

    // Future: integrate with Resend, SendGrid, or AWS SES here

    return new Response(
      JSON.stringify({ success: true, to: recipientUser.email, type: emailType }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in notify-deliverable:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
