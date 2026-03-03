

## Plan: Add Image Dimension Guidelines to All Upload Points

### Problem
Users upload images without knowing the recommended dimensions, resulting in unexpected cropping.

### Approach
Add a small helper text (hint) below or near each image upload area showing the recommended dimensions. This will be done across all upload points in the system.

### Recommended Dimensions

| Upload Point | Dimensions | Aspect Ratio |
|---|---|---|
| Profile Avatar | 200×200 px | 1:1 (مربع) |
| Cover Image | 1200×400 px | 3:1 |
| Company Logo (Donor) | 300×300 px | 1:1 (مربع) |
| Service Main Image | 800×500 px | 16:10 |
| Service Gallery | 800×500 px | 16:10 |
| Portfolio Item | 800×450 px | 16:9 |

### Files to Modify

1. **`src/pages/Profile.tsx`** — Add dimension hints to:
   - Cover image upload area (line ~265: "تغيير صورة الغلاف" → add "1200×400 بكسل")
   - Avatar upload hover overlay (line ~286: add "200×200 بكسل")
   - Company logo upload area (add "300×300 بكسل")

2. **`src/components/services/ServiceForm.tsx`** — Add hints to:
   - Main service image upload (line ~126: add "800×500 بكسل")
   - Gallery images upload (line ~146: add hint)

3. **`src/components/portfolio/PortfolioManager.tsx`** — Add hint near the image select button (line ~76: add "800×450 بكسل")

4. **`src/components/admin/AdminDirectEditDialog.tsx`** — If admin uploads avatar/cover for users, add hints there too.

5. **`src/components/attachments/FileUploader.tsx`** — This is for documents/files, not images specifically, so no dimension hint needed.

### Implementation Details
- Each hint will be a `<p className="text-xs text-muted-foreground">` element showing the recommended dimensions in Arabic
- Format: `الأبعاد المُوصى بها: العرض × الارتفاع بكسل`
- Non-intrusive, placed as helper text below the upload trigger

