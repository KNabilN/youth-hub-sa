

## Plan: Enable Folder & File Upload for Deliverables

### Problem
The current FileUploader only supports individual file selection with a restricted MIME type whitelist. Service providers need to upload entire project folders (source code, design assets, etc.) with their directory structure preserved.

### Changes

#### 1. Expand allowed file types in `useAttachments.ts`
- Add compressed archives (`.zip`, `.rar`, `.7z`), code files (`.html`, `.css`, `.js`, `.ts`, `.json`, `.xml`, `.txt`, `.svg`, `.psd`, `.ai`, `.fig`), and a catch-all for deliverable entity type that skips MIME validation (since project files can be anything).
- Increase max file size to 50MB for deliverable uploads specifically (project folders can be large).
- Preserve `webkitRelativePath` in the `file_name` field so the folder structure is visible.

#### 2. Update `FileUploader.tsx`
- Add a second button "رفع مجلد" (Upload Folder) that opens a folder picker using `webkitdirectory` attribute.
- Keep the existing drag-and-drop and file picker for individual files.
- Show the relative path for folder-uploaded files.
- Update the accept attribute and description text when used for deliverables.

#### 3. Update `DeliverablePanel.tsx`
- Pass a flag to `FileUploader` indicating it's a deliverable upload (to allow broader file types).
- Improve UX: allow file upload alongside notes before submission (stage files first).

#### 4. Update `AttachmentList.tsx`
- Display `file_name` with folder path prefix when present (e.g., `src/components/App.tsx` instead of just `App.tsx`).

### Files to modify
| File | Change |
|------|--------|
| `src/hooks/useAttachments.ts` | Skip MIME filter for deliverables, increase size limit, preserve relative path |
| `src/components/attachments/FileUploader.tsx` | Add folder upload button with `webkitdirectory`, update accept list |
| `src/components/deliverables/DeliverablePanel.tsx` | Pass `isDeliverable` flag, allow upload before submit |
| `src/components/attachments/AttachmentList.tsx` | Show folder path in file names |

