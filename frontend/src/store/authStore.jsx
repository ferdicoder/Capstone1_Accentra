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
  loading: true,
  setAuth: (user, role) => set({ user: normalizeUser(user), role, loading: false }),
  clearAuth: () => set({ user: null, role: null, loading: false }),
}));