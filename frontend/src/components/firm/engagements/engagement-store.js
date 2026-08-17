import { create } from "zustand"

import { mockEngagements } from "./engagement-variants"

export const engagementStore = create((set) => ({
  engagements: mockEngagements,
  addEngagement: (engagement) =>
    set((state) => ({
      engagements: [engagement, ...state.engagements],
    })),
  setEngagementStatus: (id, status) =>
    set((state) => ({
      engagements: state.engagements.map((engagement) =>
        engagement.id === id ? { ...engagement, status } : engagement
      ),
    })),
  addNote: (engagementId, note) =>
    set((state) => ({
      engagements: state.engagements.map((engagement) =>
        engagement.id === engagementId
          ? { ...engagement, notes: [...(engagement.notes ?? []), note] }
          : engagement
      ),
    })),
  updateDocumentStatus: (engagementId, documentId, newStatus) =>
    set((state) => ({
      engagements: state.engagements.map((engagement) => {
        if (engagement.id !== engagementId) return engagement
        const docs = engagement.documents ?? []
        const updated = docs.map((doc) =>
          doc.id === documentId ? { ...doc, status: newStatus } : doc
        )
        return { ...engagement, documents: updated }
      }),
    })),
  addReviewHistoryEntry: (engagementId, entry) =>
    set((state) => ({
      engagements: state.engagements.map((engagement) => {
        if (engagement.id !== engagementId) return engagement
        return { ...engagement, reviewHistory: [...(engagement.reviewHistory ?? []), entry] }
      }),
    })),
}))
