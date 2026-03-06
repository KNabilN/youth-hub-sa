
-- 1. Drop duplicate triggers (old naming without _on_)
DROP TRIGGER IF EXISTS trg_notify_bid_change ON public.bids;
DROP TRIGGER IF EXISTS trg_notify_contract_change ON public.contracts;
DROP TRIGGER IF EXISTS trg_notify_escrow_change ON public.escrow_transactions;
DROP TRIGGER IF EXISTS trg_notify_bank_transfer_change ON public.bank_transfers;
DROP TRIGGER IF EXISTS trg_notify_project_status ON public.projects;
DROP TRIGGER IF EXISTS trg_notify_dispute_change ON public.disputes;
DROP TRIGGER IF EXISTS trg_notify_timelog_approval ON public.time_logs;
DROP TRIGGER IF EXISTS trg_notify_withdrawal_change ON public.withdrawal_requests;
DROP TRIGGER IF EXISTS trg_notify_new_message ON public.messages;
DROP TRIGGER IF EXISTS trg_notify_deliverable_change ON public.project_deliverables;
DROP TRIGGER IF EXISTS trg_notify_service_approval ON public.micro_services;
DROP TRIGGER IF EXISTS trg_notify_service_purchase ON public.escrow_transactions;
DROP TRIGGER IF EXISTS trg_notify_grant_request ON public.grant_requests;
DROP TRIGGER IF EXISTS trg_notify_grant_request_change ON public.grant_requests;

-- 2. Add entity_id and entity_type columns to notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS entity_id uuid;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS entity_type text;

-- 3. Update all trigger functions to include entity_id and entity_type

CREATE OR REPLACE FUNCTION public.notify_on_bid_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _project_title text;
  _provider_name text;
  _assoc_id uuid;
BEGIN
  SELECT title, association_id INTO _project_title, _assoc_id FROM projects WHERE id = NEW.project_id;
  SELECT full_name INTO _provider_name FROM profiles WHERE id = NEW.provider_id;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
    VALUES (_assoc_id, 'تم استلام عرض سعر جديد من ' || _provider_name || ' على مشروع "' || _project_title || '"', 'bid_received', NEW.project_id, 'project');
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'accepted' THEN
      INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
      VALUES (NEW.provider_id, 'تم قبول عرضك على مشروع "' || _project_title || '"', 'bid_accepted', NEW.project_id, 'project');
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
      VALUES (NEW.provider_id, 'تم رفض عرضك على مشروع "' || _project_title || '"', 'bid_rejected', NEW.project_id, 'project');
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_on_contract_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _project_title text;
BEGIN
  SELECT title INTO _project_title FROM projects WHERE id = NEW.project_id;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
    VALUES (NEW.provider_id, 'تم إنشاء عقد جديد لمشروع "' || _project_title || '"', 'contract_created', NEW.project_id, 'project');
    INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
    VALUES (NEW.association_id, 'تم إنشاء عقد جديد لمشروع "' || _project_title || '"', 'contract_created', NEW.project_id, 'project');
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.provider_signed_at IS NULL AND NEW.provider_signed_at IS NOT NULL THEN
      INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
      VALUES (NEW.association_id, 'قام مقدم الخدمة بتوقيع عقد مشروع "' || _project_title || '"', 'contract_signed', NEW.project_id, 'project');
    END IF;
    IF OLD.association_signed_at IS NULL AND NEW.association_signed_at IS NOT NULL THEN
      INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
      VALUES (NEW.provider_id, 'قامت الجمعية بتوقيع عقد مشروع "' || _project_title || '"', 'contract_signed', NEW.project_id, 'project');
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_on_escrow_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
    VALUES (NEW.payee_id, 'تم إنشاء ضمان مالي بمبلغ ' || NEW.amount || ' ر.س', 'escrow_created', COALESCE(NEW.project_id, NEW.service_id), CASE WHEN NEW.project_id IS NOT NULL THEN 'project' WHEN NEW.service_id IS NOT NULL THEN 'service' ELSE 'escrow' END);
    INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
    VALUES (NEW.payer_id, 'تم تأكيد الضمان المالي بمبلغ ' || NEW.amount || ' ر.س', 'escrow_created', COALESCE(NEW.project_id, NEW.service_id), CASE WHEN NEW.project_id IS NOT NULL THEN 'project' WHEN NEW.service_id IS NOT NULL THEN 'service' ELSE 'escrow' END);
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'released' THEN
      INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
      VALUES (NEW.payee_id, 'تم تحرير الضمان المالي بمبلغ ' || NEW.amount || ' ر.س إلى حسابك', 'escrow_released', COALESCE(NEW.project_id, NEW.service_id), CASE WHEN NEW.project_id IS NOT NULL THEN 'project' ELSE 'escrow' END);
      INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
      VALUES (NEW.payer_id, 'تم تحرير الضمان المالي بمبلغ ' || NEW.amount || ' ر.س', 'escrow_released', COALESCE(NEW.project_id, NEW.service_id), CASE WHEN NEW.project_id IS NOT NULL THEN 'project' ELSE 'escrow' END);
    ELSIF NEW.status = 'refunded' THEN
      INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
      VALUES (NEW.payer_id, 'تم استرداد الضمان المالي بمبلغ ' || NEW.amount || ' ر.س', 'escrow_refunded', COALESCE(NEW.project_id, NEW.service_id), CASE WHEN NEW.project_id IS NOT NULL THEN 'project' ELSE 'escrow' END);
      INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
      VALUES (NEW.payee_id, 'تم استرداد الضمان المالي للمشروع', 'escrow_refunded', COALESCE(NEW.project_id, NEW.service_id), CASE WHEN NEW.project_id IS NOT NULL THEN 'project' ELSE 'escrow' END);
    ELSIF NEW.status = 'frozen' THEN
      INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
      VALUES (NEW.payee_id, 'تم تجميد الضمان المالي بسبب نزاع قائم', 'escrow_frozen', COALESCE(NEW.project_id, NEW.service_id), CASE WHEN NEW.project_id IS NOT NULL THEN 'project' ELSE 'escrow' END);
      INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
      VALUES (NEW.payer_id, 'تم تجميد الضمان المالي بسبب نزاع قائم', 'escrow_frozen', COALESCE(NEW.project_id, NEW.service_id), CASE WHEN NEW.project_id IS NOT NULL THEN 'project' ELSE 'escrow' END);
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_on_bank_transfer_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _admin record;
  _escrow_project_id uuid;
BEGIN
  SELECT project_id INTO _escrow_project_id FROM escrow_transactions WHERE id = NEW.escrow_id;

  IF TG_OP = 'INSERT' THEN
    FOR _admin IN SELECT user_id FROM public.user_roles WHERE role = 'super_admin'
    LOOP
      INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
      VALUES (_admin.user_id, 'تحويل بنكي جديد بمبلغ ' || NEW.amount || ' ر.س بانتظار المراجعة', 'bank_transfer_pending', _escrow_project_id, 'project');
    END LOOP;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'approved' THEN
      INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
      VALUES (NEW.user_id, 'تمت الموافقة على التحويل البنكي بمبلغ ' || NEW.amount || ' ر.س', 'bank_transfer_approved', _escrow_project_id, 'project');
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
      VALUES (NEW.user_id, 'تم رفض التحويل البنكي بمبلغ ' || NEW.amount || ' ر.س' || CASE WHEN NEW.admin_note <> '' THEN '. السبب: ' || NEW.admin_note ELSE '' END, 'bank_transfer_rejected', _escrow_project_id, 'project');
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_on_project_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
    VALUES (NEW.association_id,
      CASE NEW.status
        WHEN 'open' THEN 'تمت الموافقة على مشروعك "' || NEW.title || '" وهو الآن مفتوح للعروض'
        WHEN 'in_progress' THEN 'بدأ العمل على مشروع "' || NEW.title || '"'
        WHEN 'completed' THEN 'تم إكمال مشروع "' || NEW.title || '" بنجاح'
        WHEN 'cancelled' THEN 'تم إلغاء مشروع "' || NEW.title || '"'
        WHEN 'disputed' THEN 'تم فتح نزاع على مشروع "' || NEW.title || '"'
        WHEN 'suspended' THEN 'تم تعليق مشروع "' || NEW.title || '"'
        ELSE 'تم تحديث حالة مشروع "' || NEW.title || '"'
      END,
      'project_' || NEW.status, NEW.id, 'project');

    IF NEW.assigned_provider_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
      VALUES (NEW.assigned_provider_id,
        CASE NEW.status
          WHEN 'in_progress' THEN 'تم تعيينك على مشروع "' || NEW.title || '"'
          WHEN 'completed' THEN 'تم إكمال مشروع "' || NEW.title || '" بنجاح'
          WHEN 'cancelled' THEN 'تم إلغاء مشروع "' || NEW.title || '"'
          WHEN 'disputed' THEN 'تم فتح نزاع على مشروع "' || NEW.title || '"'
          ELSE 'تم تحديث حالة مشروع "' || NEW.title || '"'
        END,
        'project_' || NEW.status, NEW.id, 'project');
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_on_dispute_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _assoc_id uuid;
  _provider_id uuid;
  _project_title text;
BEGIN
  SELECT association_id, assigned_provider_id, title
  INTO _assoc_id, _provider_id, _project_title
  FROM projects WHERE id = NEW.project_id;

  IF TG_OP = 'INSERT' THEN
    IF NEW.raised_by <> _assoc_id THEN
      INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
      VALUES (_assoc_id, 'تم فتح نزاع جديد على مشروع "' || _project_title || '"', 'dispute_opened', NEW.id, 'dispute');
    END IF;
    IF _provider_id IS NOT NULL AND NEW.raised_by <> _provider_id THEN
      INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
      VALUES (_provider_id, 'تم فتح نزاع جديد على مشروع "' || _project_title || '"', 'dispute_opened', NEW.id, 'dispute');
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'resolved' OR NEW.status = 'closed' THEN
      INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
      VALUES (NEW.raised_by, 'تم ' || CASE WHEN NEW.status = 'resolved' THEN 'حل' ELSE 'إغلاق' END || ' النزاع على مشروع "' || _project_title || '"', 'dispute_resolved', NEW.id, 'dispute');
      IF _assoc_id <> NEW.raised_by THEN
        INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
        VALUES (_assoc_id, 'تم ' || CASE WHEN NEW.status = 'resolved' THEN 'حل' ELSE 'إغلاق' END || ' النزاع على مشروع "' || _project_title || '"', 'dispute_resolved', NEW.id, 'dispute');
      END IF;
      IF _provider_id IS NOT NULL AND _provider_id <> NEW.raised_by THEN
        INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
        VALUES (_provider_id, 'تم ' || CASE WHEN NEW.status = 'resolved' THEN 'حل' ELSE 'إغلاق' END || ' النزاع على مشروع "' || _project_title || '"', 'dispute_resolved', NEW.id, 'dispute');
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_on_timelog_approval()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _project_title text;
BEGIN
  IF OLD.approval IS DISTINCT FROM NEW.approval AND NEW.approval IN ('approved', 'rejected') THEN
    SELECT title INTO _project_title FROM projects WHERE id = NEW.project_id;
    INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
    VALUES (NEW.provider_id,
      CASE NEW.approval
        WHEN 'approved' THEN 'تمت الموافقة على سجل الوقت الخاص بك في مشروع "' || _project_title || '"'
        WHEN 'rejected' THEN 'تم رفض سجل الوقت الخاص بك في مشروع "' || _project_title || '"'
      END,
      'timelog_' || NEW.approval, NEW.project_id, 'project');
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_on_withdrawal_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
    VALUES (NEW.provider_id,
      CASE NEW.status
        WHEN 'approved' THEN 'تمت الموافقة على طلب السحب بمبلغ ' || NEW.amount || ' ر.س'
        WHEN 'rejected' THEN 'تم رفض طلب السحب بمبلغ ' || NEW.amount || ' ر.س' || CASE WHEN NEW.rejection_reason <> '' THEN '. السبب: ' || NEW.rejection_reason ELSE '' END
        WHEN 'processed' THEN 'تم تحويل مبلغ ' || NEW.amount || ' ر.س إلى حسابك'
        ELSE 'تم تحديث حالة طلب السحب'
      END,
      'withdrawal_' || NEW.status, NEW.id, 'withdrawal');
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_on_new_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _assoc_id uuid;
  _provider_id uuid;
  _project_title text;
  _sender_name text;
  _recipient_id uuid;
BEGIN
  SELECT association_id, assigned_provider_id, title
  INTO _assoc_id, _provider_id, _project_title
  FROM projects WHERE id = NEW.project_id;

  SELECT full_name INTO _sender_name FROM profiles WHERE id = NEW.sender_id;

  IF NEW.sender_id = _assoc_id THEN
    _recipient_id := _provider_id;
  ELSE
    _recipient_id := _assoc_id;
  END IF;

  IF _recipient_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
    VALUES (_recipient_id, 'رسالة جديدة من ' || _sender_name || ' في مشروع "' || _project_title || '"', 'message_received', NEW.project_id, 'message');
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_on_deliverable_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _assoc_id uuid;
  _project_title text;
  _provider_name text;
BEGIN
  SELECT association_id, title INTO _assoc_id, _project_title
  FROM projects WHERE id = NEW.project_id;

  SELECT full_name INTO _provider_name FROM profiles WHERE id = NEW.provider_id;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
    VALUES (_assoc_id, 'قام ' || _provider_name || ' بتسليم ملفات مشروع "' || _project_title || '" للمراجعة', 'deliverable_submitted', NEW.project_id, 'project');
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'accepted' THEN
      INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
      VALUES (NEW.provider_id, 'تم قبول تسليمات مشروع "' || _project_title || '"', 'deliverable_accepted', NEW.project_id, 'project');
    ELSIF NEW.status = 'revision_requested' THEN
      INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
      VALUES (NEW.provider_id, 'تم طلب تعديلات على تسليمات مشروع "' || _project_title || '": ' || COALESCE(NEW.revision_note, ''), 'deliverable_revision', NEW.project_id, 'project');
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_on_service_approval()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.approval IS DISTINCT FROM NEW.approval THEN
    IF NEW.approval = 'approved' THEN
      INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
      VALUES (NEW.provider_id, 'تمت الموافقة على خدمتك "' || NEW.title || '" وهي الآن منشورة في السوق', 'service_approved', NEW.id, 'service');
    ELSIF NEW.approval = 'rejected' THEN
      INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
      VALUES (NEW.provider_id, 'تم رفض خدمتك "' || NEW.title || '"', 'service_rejected', NEW.id, 'service');
    ELSIF NEW.approval = 'suspended' THEN
      INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
      VALUES (NEW.provider_id, 'تم تعليق خدمتك "' || NEW.title || '"', 'service_suspended', NEW.id, 'service');
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_on_service_purchase()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _service_title text;
  _provider_id uuid;
BEGIN
  IF NEW.service_id IS NOT NULL THEN
    SELECT title, provider_id INTO _service_title, _provider_id
    FROM micro_services WHERE id = NEW.service_id;
    
    IF _provider_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
      VALUES (_provider_id, 'تم شراء خدمتك "' || _service_title || '" بمبلغ ' || NEW.amount || ' ر.س', 'service_purchased', NEW.service_id, 'service');
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_on_grant_request_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _assoc_name text;
BEGIN
  SELECT full_name INTO _assoc_name FROM profiles WHERE id = NEW.association_id;

  IF TG_OP = 'INSERT' THEN
    IF NEW.donor_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
      VALUES (NEW.donor_id, 'طلب منحة جديد من ' || _assoc_name || ' بمبلغ ' || NEW.amount || ' ر.س', 'grant_request_received', NEW.id, 'grant_request');
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'approved' THEN
      INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
      VALUES (NEW.association_id, 'تمت الموافقة على طلب المنحة بمبلغ ' || NEW.amount || ' ر.س', 'grant_request_approved', NEW.id, 'grant_request');
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
      VALUES (NEW.association_id, 'تم رفض طلب المنحة بمبلغ ' || NEW.amount || ' ر.س' || CASE WHEN NEW.admin_note <> '' THEN '. السبب: ' || NEW.admin_note ELSE '' END, 'grant_request_rejected', NEW.id, 'grant_request');
    ELSIF NEW.status = 'funded' THEN
      INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
      VALUES (NEW.association_id, 'تم تمويل طلب المنحة بمبلغ ' || NEW.amount || ' ر.س', 'grant_request_funded', NEW.id, 'grant_request');
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_ticket_from_contact()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  admin_id uuid;
  ticket_num text;
  new_ticket_id uuid;
BEGIN
  SELECT ur.user_id INTO admin_id
  FROM user_roles ur
  WHERE ur.role = 'super_admin'
  LIMIT 1;

  IF admin_id IS NULL THEN
    RETURN NEW;
  END IF;

  ticket_num := 'CT-' || to_char(now(), 'YYMMDD') || '-' || substr(NEW.id::text, 1, 4);

  INSERT INTO support_tickets (user_id, subject, description, ticket_number, priority, status)
  VALUES (
    admin_id,
    'رسالة تواصل: ' || left(NEW.name, 50),
    'الاسم: ' || NEW.name || E'\n' ||
    'البريد الإلكتروني: ' || NEW.email || E'\n' ||
    '---' || E'\n' ||
    NEW.message,
    ticket_num,
    'medium',
    'open'
  )
  RETURNING id INTO new_ticket_id;

  INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
  VALUES (admin_id, 'رسالة تواصل جديدة من ' || NEW.name, 'contact_message', new_ticket_id, 'ticket');

  RETURN NEW;
END;
$function$;
