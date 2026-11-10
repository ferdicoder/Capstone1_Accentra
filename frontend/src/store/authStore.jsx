import { create } from 'zustand';

function normalizeUser(user) {
  if (!user) return null;

  const metadata = user.user_metadata ?? {};

  return {
    ...user,
    firstName: user.firstName ?? metadata.first_name ?? "",
    middleName: user.middleName ?? metadata.middle_name ?? "",
    lastName: user.lastName ?? metadata.last_name ?? "",
    birthDate: user.birthDate ?? metadata.birth_date ?? "",
    contactNumber: user.contactNumber ?? metadata.contact_no ?? "",
    name:
      user.name ??
      [metadata.first_name, metadata.middle_name, metadata.last_name]
        .filter(Boolean)
        .join(" "),
  };
}

export const authStore = create((set) => ({
  user: null,
  role: null,
  status: null,
  loading: true,
  setAuth: (user, role, status = null) =>
    set({ user: normalizeUser(user), role, status, loading: false }),
  setStatus: (status) => set({ status }),
  clearAuth: () => set({ user: null, role: null, status: null, loading: false }),
}))