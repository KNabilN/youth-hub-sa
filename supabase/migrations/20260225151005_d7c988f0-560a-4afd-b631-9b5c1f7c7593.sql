
-- ============================================================
-- Comprehensive notification trigger function
-- Sends notifications automatically for all major transactions
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_on_bid_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _project_title text;
  _provider_name text;
  _assoc_id uuid;
BEGIN
  SELECT title, association_id INTO _project_title, _assoc_id FROM projects WHERE id = NEW.project_id;
  SELECT full_name INTO _provider_name FROM profiles WHERE id = NEW.provider_id;

  IF TG_OP = 'INSERT' THEN
    -- Notify association about new bid
    INSERT INTO notifications (user_id, message, type)
    VALUES (_assoc_id, 'تم استلام عرض سعر جديد من ' || _provider_name || ' على مشروع "' || _project_title || '"', 'bid_received');
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'accepted' THEN
      INSERT INTO notifications (user_id, message, type)
      VALUES (NEW.provider_id, 'تم قبول عرضك على مشروع "' || _project_title || '"', 'bid_accepted');
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO notifications (user_id, message, type)
      VALUES (NEW.provider_id, 'تم رفض عرضك على مشروع "' || _project_title || '"', 'bid_rejected');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_bid
AFTER INSERT OR UPDATE ON public.bids
FOR EACH ROW EXECUTE FUNCTION public.notify_on_bid_change();

-- ============================================================
-- Contract notifications
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_on_contract_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _project_title text;
BEGIN
  SELECT title INTO _project_title FROM projects WHERE id = NEW.project_id;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO notifications (user_id, message, type)
    VALUES (NEW.provider_id, 'تم إنشاء عقد جديد لمشروع "' || _project_title || '"', 'contract_created');
    INSERT INTO notifications (user_id, message, type)
    VALUES (NEW.association_id, 'تم إنشاء عقد جديد لمشروع "' || _project_title || '"', 'contract_created');
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.provider_signed_at IS NULL AND NEW.provider_signed_at IS NOT NULL THEN
      INSERT INTO notifications (user_id, message, type)
      VALUES (NEW.association_id, 'قام مقدم الخدمة بتوقيع عقد مشروع "' || _project_title || '"', 'contract_signed');
    END IF;
    IF OLD.association_signed_at IS NULL AND NEW.association_signed_at IS NOT NULL THEN
      INSERT INTO notifications (user_id, message, type)
      VALUES (NEW.provider_id, 'قامت الجمعية بتوقيع عقد مشروع "' || _project_title || '"', 'contract_signed');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_contract
AFTER INSERT OR UPDATE ON public.contracts
FOR EACH ROW EXECUTE FUNCTION public.notify_on_contract_change();

-- ============================================================
-- Escrow notifications
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_on_escrow_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO notifications (user_id, message, type)
    VALUES (NEW.payee_id, 'تم إنشاء ضمان مالي بمبلغ ' || NEW.amount || ' ر.س', 'escrow_created');
    INSERT INTO notifications (user_id, message, type)
    VALUES (NEW.payer_id, 'تم تأكيد الضمان المالي بمبلغ ' || NEW.amount || ' ر.س', 'escrow_created');
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'released' THEN
      INSERT INTO notifications (user_id, message, type)
      VALUES (NEW.payee_id, 'تم تحرير الضمان المالي بمبلغ ' || NEW.amount || ' ر.س إلى حسابك', 'escrow_released');
      INSERT INTO notifications (user_id, message, type)
      VALUES (NEW.payer_id, 'تم تحرير الضمان المالي بمبلغ ' || NEW.amount || ' ر.س', 'escrow_released');
    ELSIF NEW.status = 'refunded' THEN
      INSERT INTO notifications (user_id, message, type)
      VALUES (NEW.payer_id, 'تم استرداد الضمان المالي بمبلغ ' || NEW.amount || ' ر.س', 'escrow_refunded');
      INSERT INTO notifications (user_id, message, type)
      VALUES (NEW.payee_id, 'تم استرداد الضمان المالي للمشروع', 'escrow_refunded');
    ELSIF NEW.status = 'frozen' THEN
      INSERT INTO notifications (user_id, message, type)
      VALUES (NEW.payee_id, 'تم تجميد الضمان المالي بسبب نزاع قائم', 'escrow_frozen');
      INSERT INTO notifications (user_id, message, type)
      VALUES (NEW.payer_id, 'تم تجميد الضمان المالي بسبب نزاع قائم', 'escrow_frozen');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_escrow
AFTER INSERT OR UPDATE ON public.escrow_transactions
FOR EACH ROW EXECUTE FUNCTION public.notify_on_escrow_change();

-- ============================================================
-- Project status notifications
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_on_project_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Notify association
    INSERT INTO notifications (user_id, message, type)
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
      'project_' || NEW.status);

    -- Notify assigned provider if exists
    IF NEW.assigned_provider_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, message, type)
      VALUES (NEW.assigned_provider_id,
        CASE NEW.status
          WHEN 'in_progress' THEN 'تم تعيينك على مشروع "' || NEW.title || '"'
          WHEN 'completed' THEN 'تم إكمال مشروع "' || NEW.title || '" بنجاح'
          WHEN 'cancelled' THEN 'تم إلغاء مشروع "' || NEW.title || '"'
          WHEN 'disputed' THEN 'تم فتح نزاع على مشروع "' || NEW.title || '"'
          ELSE 'تم تحديث حالة مشروع "' || NEW.title || '"'
        END,
        'project_' || NEW.status);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_project_status
AFTER UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.notify_on_project_status_change();

-- ============================================================
-- Dispute notifications
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_on_dispute_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _assoc_id uuid;
  _provider_id uuid;
  _project_title text;
BEGIN
  SELECT association_id, assigned_provider_id, title
  INTO _assoc_id, _provider_id, _project_title
  FROM projects WHERE id = NEW.project_id;

  IF TG_OP = 'INSERT' THEN
    -- Notify all involved parties except the one who raised it
    IF NEW.raised_by <> _assoc_id THEN
      INSERT INTO notifications (user_id, message, type)
      VALUES (_assoc_id, 'تم فتح نزاع جديد على مشروع "' || _project_title || '"', 'dispute_opened');
    END IF;
    IF _provider_id IS NOT NULL AND NEW.raised_by <> _provider_id THEN
      INSERT INTO notifications (user_id, message, type)
      VALUES (_provider_id, 'تم فتح نزاع جديد على مشروع "' || _project_title || '"', 'dispute_opened');
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'resolved' OR NEW.status = 'closed' THEN
      INSERT INTO notifications (user_id, message, type)
      VALUES (NEW.raised_by, 'تم ' || CASE WHEN NEW.status = 'resolved' THEN 'حل' ELSE 'إغلاق' END || ' النزاع على مشروع "' || _project_title || '"', 'dispute_resolved');
      IF _assoc_id <> NEW.raised_by THEN
        INSERT INTO notifications (user_id, message, type)
        VALUES (_assoc_id, 'تم ' || CASE WHEN NEW.status = 'resolved' THEN 'حل' ELSE 'إغلاق' END || ' النزاع على مشروع "' || _project_title || '"', 'dispute_resolved');
      END IF;
      IF _provider_id IS NOT NULL AND _provider_id <> NEW.raised_by THEN
        INSERT INTO notifications (user_id, message, type)
        VALUES (_provider_id, 'تم ' || CASE WHEN NEW.status = 'resolved' THEN 'حل' ELSE 'إغلاق' END || ' النزاع على مشروع "' || _project_title || '"', 'dispute_resolved');
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_dispute
AFTER INSERT OR UPDATE ON public.disputes
FOR EACH ROW EXECUTE FUNCTION public.notify_on_dispute_change();

-- ============================================================
-- Time log approval notifications
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_on_timelog_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _project_title text;
BEGIN
  IF OLD.approval IS DISTINCT FROM NEW.approval AND NEW.approval IN ('approved', 'rejected') THEN
    SELECT title INTO _project_title FROM projects WHERE id = NEW.project_id;
    INSERT INTO notifications (user_id, message, type)
    VALUES (NEW.provider_id,
      CASE NEW.approval
        WHEN 'approved' THEN 'تمت الموافقة على سجل الوقت الخاص بك في مشروع "' || _project_title || '"'
        WHEN 'rejected' THEN 'تم رفض سجل الوقت الخاص بك في مشروع "' || _project_title || '"'
      END,
      'timelog_' || NEW.approval);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_timelog
AFTER UPDATE ON public.time_logs
FOR EACH ROW EXECUTE FUNCTION public.notify_on_timelog_approval();

-- ============================================================
-- Withdrawal request notifications
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_on_withdrawal_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO notifications (user_id, message, type)
    VALUES (NEW.provider_id,
      CASE NEW.status
        WHEN 'approved' THEN 'تمت الموافقة على طلب السحب بمبلغ ' || NEW.amount || ' ر.س'
        WHEN 'rejected' THEN 'تم رفض طلب السحب بمبلغ ' || NEW.amount || ' ر.س'
        WHEN 'processed' THEN 'تم تحويل مبلغ ' || NEW.amount || ' ر.س إلى حسابك'
        ELSE 'تم تحديث حالة طلب السحب'
      END,
      'withdrawal_' || NEW.status);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_withdrawal
AFTER UPDATE ON public.withdrawal_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_on_withdrawal_change();
