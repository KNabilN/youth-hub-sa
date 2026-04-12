

# إصلاح سجل المحادثات في التذاكر

## المشكلة
الاستعلام في `useTicketReplies.ts` يستخدم join مع جدول `profiles` عبر `author_id`:
```typescript
.select("*, profiles:author_id(full_name, avatar_url)")
```
لكن جدول `ticket_replies` لا يحتوي على أي مفتاح أجنبي (Foreign Key) — لا على `author_id` ولا على `ticket_id`. هذا يجعل PostgREST يرفض الاستعلام بخطأ 400، فلا تظهر أي رسائل.

## الحل — خطوتان

| الخطوة | التغيير |
|---|---|
| 1. Migration | إضافة مفاتيح أجنبية لجدول `ticket_replies`: `author_id → profiles(id)` و `ticket_id → support_tickets(id)` |
| 2. `src/hooks/useTicketReplies.ts` | لا تغيير مطلوب — الكود صحيح، فقط يحتاج المفاتيح الأجنبية في قاعدة البيانات |

### Migration SQL
```sql
ALTER TABLE public.ticket_replies
  ADD CONSTRAINT ticket_replies_author_id_fkey
    FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.ticket_replies
  ADD CONSTRAINT ticket_replies_ticket_id_fkey
    FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id) ON DELETE CASCADE;
```

هذا سيجعل PostgREST يتعرف على العلاقة ويسمح بالـ join، وبالتالي تظهر الرسائل بأسماء المرسلين بشكل صحيح من جهة الأدمن والمستخدم.

