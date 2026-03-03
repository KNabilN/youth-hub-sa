

## Plan: Add Provider Name to Admin Services Search

### Change
In `src/pages/admin/AdminServices.tsx`, update the search filter to also match against the provider's full name (`s.profiles?.full_name`).

### File: `src/pages/admin/AdminServices.tsx`
- In the `filtered` logic (~line 68), add `s.profiles?.full_name` to the search condition:
  ```
  if (!s.title.toLowerCase().includes(q) 
      && !(s.service_number || "").toLowerCase().includes(q)
      && !(s.profiles?.full_name || "").toLowerCase().includes(q)) return false;
  ```
- Update the search input placeholder to indicate provider search is supported (e.g., "بحث بالعنوان أو مقدم الخدمة...")

One file, two-line change.

