import { useEffect } from 'react';
import { supabase } from '@/config/supabase';
import { authStore } from '@/store/authStore';
import { setUserRole } from '../services/api/userAPI';

/**
 * Applies a session to the app's auth state, or clears it when there is no
 * session. A deactivated account is signed out, because the firm admin has
 * revoked its access.
 */
const applySession = (session) => {
  if (session) return setUserRole(session.user);
  authStore.getState().clearAuth();
}

export function useAuth() {
  useEffect(() => {
    let active = true;
    let sessionUpdates = Promise.resolve();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      // The recovery flow owns this session until the new password is set.
      if (event === 'PASSWORD_RECOVERY') return;

      // Do not call Supabase APIs while its auth-state callback holds the auth
      // lock. Queue updates to preserve event order and avoid stale sessions
      // overwriting a newer sign-in or sign-out.
      setTimeout(() => {
        if (!active) return;
        sessionUpdates = sessionUpdates
          .then(() => {
            if (active) return applySession(session);
          })
          .catch((error) => {
            console.error('Could not synchronize the authentication session:', error);
            if (active) authStore.getState().clearAuth();
          });
      }, 0);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);
}