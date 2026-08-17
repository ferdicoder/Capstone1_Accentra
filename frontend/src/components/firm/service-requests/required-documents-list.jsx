import { useState } from "react"
import { FileText, Plus, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

/**
 * Modern on/off toggle switch for Required / Optional state.
 * Clean sliding thumb, no text inside — label sits outside the button.
 */
function RequiredToggle({ required, onChange, disabled }) {
  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={required}
        disabled={disabled}
        onClick={() => onChange(!required)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200 ease-in-out",
          required
            ? "border-[#02353C]/40 bg-[#02353C]"
            : "border-border bg-muted"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block size-[20px] rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out",
            required ? "translate-x-[20px]" : "translate-x-[2px]"
          )}
        />
      </button>
      <span
        className={cn(
          "text-xs font-medium select-none",
          required ? "text-[#02353C]" : "text-muted-foreground"
        )}
      >
        {required ? "Required" : "Optional"}
      </span>
    </div>
  )
}

/**
 * Single document row: icon · name · required toggle · delete.
 */
function DocumentRow({ document, onUpdate, onRemove, disabled }) {
  return (
    <div
      data-slot="required-document-row"
      className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#02353C]/10 text-[#02353C]">
        <FileText className="size-4" />
      </div>

      <div className="min-w-0 flex-1">
        <Input
          value={document.name}
          onChange={(event) => onUpdate({ name: event.target.value })}
          placeholder="Document name"
          disabled={disabled}
          className="h-8 border-0 bg-transparent px-0 text-sm font-medium shadow-none focus-visible:ring-0"
        />
      </div>

      <RequiredToggle
        required={document.required}
        onChange={(value) => onUpdate({ required: value })}
        disabled={disabled}
      />

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={disabled}
        onClick={onRemove}
        aria-label="Remove document"
        className="shrink-0 rounded-lg text-muted-foreground hover:text-destructive"
      >
        <X className="size-4" />
      </Button>
    </div>
  )
}

/**
 * Reusable list of required documents with add/remove/toggle handling.
 *
 * @param {Array}    documents - [{ id, name, required }]
 * @param {Function} onChange  - (nextDocuments) => void
 * @param {boolean}  disabled  - Disables all interactions
 */
export function RequiredDocumentsList({ documents = [], onChange, disabled = false }) {
  const [newDocName, setNewDocName] = useState("")

  const updateDocument = (id, patch) =>
    onChange?.(documents.map((doc) => (doc.id === id ? { ...doc, ...patch } : doc)))

  const removeDocument = (id) => onChange?.(documents.filter((doc) => doc.id !== id))

  const addDocument = () => {
    const name = newDocName.trim()
    if (!name) return
    onChange?.([...documents, { id: Date.now().toString(), name, required: true }])
    setNewDocName("")
  }

  const handleAddKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault()
      addDocument()
    }
  }

  return (
    <div data-slot="required-documents-list" className="flex flex-col gap-3">
      {documents.length === 0 && (
        <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            No documents added yet. Add documents the client must submit.
          </p>
        </div>
      )}

      {documents.map((doc) => (
        <DocumentRow
          key={doc.id}
          document={doc}
          onUpdate={(patch) => updateDocument(doc.id, patch)}
          onRemove={() => removeDocument(doc.id)}
          disabled={disabled}
        />
      ))}

      <div className="flex items-center gap-2">
        <Input
          value={newDocName}
          onChange={(e) => setNewDocName(e.target.value)}
          onKeyDown={handleAddKeyDown}
          placeholder="Enter document name…"
          disabled={disabled}
          className="h-8 flex-1"
        />
        <Button
          type="button"
          size="sm"
          disabled={disabled || !newDocName.trim()}
          onClick={addDocument}
          className="shrink-0 gap-1.5 rounded-lg bg-[#02353C] text-white hover:opacity-90"
        >
          <Plus className="size-3.5" />
          Add
        </Button>
      </div>
    </div>
  )
}
