// Helpers shared by document/file preview UIs (task guide files, uploaded
// documents, deliverables).

// One shape for every file shown in a preview dialog. A file can arrive as:
//   - a mapped API doc ({ id, name, mimeType, size, downloadUrl })
//   - a raw row from an endpoint ({ doc_id, file_name, mime_type, file_size })
//   - a task reference/guide doc ({ id, name, type, size, downloadUrl })
//   - a browser File that was just picked and has no download link yet
// Pass the original File as the second argument in the last case, so it can
// still be previewed before it has a download link.
export function normalizePreviewFile(source, file = null) {
  const raw = source ?? {}
  const downloadUrl = raw.downloadUrl ?? null
  return {
    id: raw.id ?? raw.doc_id ?? null,
    name: raw.name ?? raw.file_name ?? raw.fileName ?? file?.name ?? "Untitled file",
    mimeType: raw.mimeType ?? raw.mime_type ?? raw.fileType ?? raw.type ?? file?.type ?? null,
    size: raw.size ?? raw.fileSize ?? raw.file_size ?? file?.size ?? null,
    downloadUrl,
    file: downloadUrl ? null : file,
  }
}

export function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return null
  const kb = bytes / 1024
  return kb < 1024 ? `${kb.toFixed(0)} KB` : `${(kb / 1024).toFixed(1)} MB`
}
