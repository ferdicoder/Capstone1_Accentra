// useAuthBootstrap.js
import { useEffect } from 'react';
import { supabase } from '@/config/supabase';
import { authStore } from '@/store/authStore';
import { setUserRole } from '../services/api/userAPI';
import { getAccountStatus } from '@/lib/userAccount';

/**
 * Applies a session to the app's auth state, or clears it when there is no
 * session. A deactivated account is signed out, because the firm admin has
 * revoked its access.
 */
const applySession = async (session) => {
  if (!session) {
    authStore.getState().clearAuth();
    return;
  }

  const status = await getAccountStatus(session.user?.id);
  if (status === 'deactivated') {
    await supabase.auth.signOut();
    authStore.getState().clearAuth();
    return;
  }

  setUserRole(session.user);
};

export function useAuth() {
  useEffect(() => {
    const getSession = async () =>{
      await supabase.auth.getSession()
      .then(({ data: { session } }) => {
        applySession(session);
      });
    }; 
    getSession(); 

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      // A password-recovery session is deliberately NOT applied to the app's
      // auth state. The recovery flow owns that session until the new password
      // is set, and applying it here would sign the user in and redirect them
      // away from the recovery screen.
      if (event === 'PASSWORD_RECOVERY') return;
      applySession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);
}