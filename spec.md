# Dashboard Penyuluh KB

## Current State
The app has a full report form (ReportForm) with 11 fields per Permen 10. Reports can be saved as draft or submitted. No file attachment support exists yet.

## Requested Changes (Diff)

### Add
- File attachment section in ReportForm: upload PDF, Word (.doc/.docx), or image files (jpg, png, etc.)
- Display list of attached files with name, size, and remove button before submit
- Store blob IDs (from blob-storage) in the report record as `lampiranIds: [Text]`
- Show attached files in ReportHistory when viewing a report

### Modify
- Backend `LaporanRencanaKerja` type: add `lampiranIds : [Text]` field
- `createReport` and `updateReport` to accept and persist `lampiranIds`
- ReportForm: add file upload UI section below existing fields, before action buttons

### Remove
- Nothing removed

## Implementation Plan
1. Update Motoko backend: add `lampiranIds` field to `LaporanRencanaKerja`, update create/update handlers
2. Regenerate backend bindings
3. Update ReportForm: integrate blob-storage upload hook, show file list, pass lampiranIds on submit
4. Update ReportHistory: display attached file links if lampiranIds present
