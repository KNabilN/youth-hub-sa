

## Plan: Refactor to PHP Relay + Error Handling + Cleanup

### 1. Refactor `supabase/functions/send-notification-email/index.ts`
- Remove `denomailer` import and all SMTP code (lines 3, 242-269)
- Replace with `fetch()` POST to `https://api.sharedservices.solutions/send-email.php`
- Send JSON payload: `{ to, subject, body }` with `Authorization: Bearer ${RELAY_API_KEY}`
- On non-200 response or fetch error: update `delivery_status` to `'failed'` in notifications table and log error
- On success: keep existing `delivery_status = 'email_sent'` update
- Need to add `RELAY_API_KEY` secret

### 2. Cleanup `src/lib/notification-preferences.ts`
- Remove `isNotificationEnabled` function (lines 169-177) — confirmed dead code, zero imports

### 3. Secret Required
- `RELAY_API_KEY` — the Bearer token your PHP relay validates

### Files Changed
| File | Change |
|---|---|
| `supabase/functions/send-notification-email/index.ts` | Replace SMTP with fetch to PHP relay + error handling |
| `src/lib/notification-preferences.ts` | Remove dead `isNotificationEnabled` function |

