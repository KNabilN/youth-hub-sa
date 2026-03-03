

## Fix: Allow .rar and archive file uploads

### Problem
The `useAttachments.ts` hook still has the original strict MIME type whitelist that doesn't include archive formats (`.rar`, `.zip`, `.7z`). The previous plan to skip MIME validation for deliverables wasn't properly applied — line 65 still blocks any file not in `ALLOWED_TYPES`.

### Changes

#### `src/hooks/useAttachments.ts`
1. Add archive MIME types to `ALLOWED_TYPES`:
   - `application/x-rar-compressed` and `application/vnd.rar` (for .rar)
   - `application/zip` and `application/x-zip-compressed` (for .zip)  
   - `application/x-7z-compressed` (for .7z)
   - `application/x-compressed` (catch-all)
2. Also add common code/text types: `text/plain`, `text/html`, `text/css`, `application/javascript`, `application/json`, `image/svg+xml`
3. For `deliverable` entity type, skip MIME validation entirely (project files can be anything)
4. Accept the `entityType` parameter in the mutation to check if it's a deliverable before validating
5. Increase size limit to 50MB for deliverable uploads

#### `src/components/attachments/FileUploader.tsx`
- Update the `accept` attribute to include `.rar,.zip,.7z` extensions
- Update the description text to mention archives

