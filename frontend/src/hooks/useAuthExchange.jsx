import { useNavigate } from "react-router-dom";
import { setUserRole } from "../api/userAPI";

export function AuthExchange() {

  useEffect(() => {
    async function exchange() {
      const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.search);
      if (error) { navigate('/login'); return; }

      const role = await setUserRole(data.user);
      useNavigate(roleHome[role] ?? '/dashboard');
    }
    exchange();
  }, []);

  return <h1> loading </h1> //<Spinner />;
}