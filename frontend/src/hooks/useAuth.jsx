// useAuthBootstrap.js
import { useEffect } from 'react';
import { supabase } from '@/config/supabase';
import { authStore } from '@/store/authStore';
import { setUserRole } from '../../../backend/services/api/userAPI';

export function useAuth() {
  useEffect(() => {
    const getSession = async () =>{
      await supabase.auth.getSession()
      .then(({ data: { session } }) => {
        session ? setUserRole(session.user) : authStore.getState().clearAuth();
      });
    }; 
    getSession(); 

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      session ? setUserRole(session.user) : authStore.getState().clearAuth();
    });

    return () => listener.subscription.unsubscribe();
  }, []);
}