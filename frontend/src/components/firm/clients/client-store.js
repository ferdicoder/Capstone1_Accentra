import { create } from "zustand"
import { persist } from "zustand/middleware"

import { editableClientFields } from "./client-variants"

/**
 * Frontend-only store for Firm Admin client edits. Nothing is sent to the
 * backend: edited values are layered over the client records derived from the
 * existing engagement/service-request data and persisted to localStorage so
 * they survive a refresh. Only whitelisted fields can be stored.
 */
export const clientStore = create(
  persist(
    (set) => ({
      overrides: {},
      updateClient: (id, values) =>
        set((state) => {
          const next = {}
          editableClientFields.forEach((field) => {
            if (field in values) next[field] = values[field]
          })
          return {
            overrides: { ...state.overrides, [id]: { ...state.overrides[id], ...next } },
          }
        }),
    }),
    { name: "accentra-client-overrides" }
  )
)
