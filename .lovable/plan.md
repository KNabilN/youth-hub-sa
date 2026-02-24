

# Seed Data and Form Scrolling Fix

## 1. Seed Saudi Arabia Regions

The regions table is currently empty. Will insert all 13 administrative regions of Saudi Arabia:

- الرياض
- مكة المكرمة
- المدينة المنورة
- القصيم
- المنطقة الشرقية
- عسير
- تبوك
- حائل
- الحدود الشمالية
- جازان
- نجران
- الباحة
- الجوف

## 2. Seed Categories

The categories table has one junk entry ("ddd"). Will delete it and insert meaningful service/project categories:

- تقنية المعلومات
- التصميم والجرافيك
- التسويق الرقمي
- التعليم والتدريب
- الاستشارات الإدارية
- المحاسبة والمالية
- الترجمة
- البناء والمقاولات
- الصحة والرعاية
- البيئة والاستدامة

## 3. Dialog Scrolling Fix

The `DialogContent` component currently has no max-height or overflow handling, so long forms (like the service form with image upload) get cut off on smaller screens.

### Changes to `src/components/ui/dialog.tsx`
- Add `max-h-[90vh] overflow-y-auto` to the `DialogContent` base classes so all dialogs become scrollable when content exceeds viewport height

## Summary

| Change | Type |
|--------|------|
| Insert 13 Saudi regions | Database migration |
| Delete junk + insert 10 categories | Database migration |
| Add scroll to DialogContent | Code change (1 file) |

