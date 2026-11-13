import { supabaseAdmin } from "../config/supabaseAdmin.js";

const FIRM_ROLES = ["admin", "staff", "billing_officer"];

async function getAuthenticatedUser(token) {
  const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: process.env.SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${token}`,
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.id) {
    const error = new Error(body?.msg || body?.message || "Unauthorized");
    error.status = response.status;
    error.code = body?.code;
    throw error;
  }
  return body;
}

const buildAuth = ({ allowInactive = false } = {}) => async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      status: "fail",
      message: "Missing or invalid authorization header",
    });
  }

  try {
    const token = authHeader.slice("Bearer ".length).trim();
    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "Missing or invalid authorization token",
      });
    }

    let user;
    try {
      user = await getAuthenticatedUser(token);
    } catch (error) {
      console.error("Bearer token validation failed:", {
        hasToken: Boolean(token),
        tokenLength: token.length,
        code: error?.code,
        status: error?.status,
        message: error?.message,
      });
      return res.status(401).json({ status: "fail", message: "Unauthorized" });
    }

    const [
      { data: roleData, error: roleError },
      { data: profile, error: profileError },
    ] = await Promise.all([
      supabaseAdmin.from("user_roles").select("role").eq("user_id", user.id).maybeSingle(),
      supabaseAdmin.from("users").select("status").eq("user_id", user.id).maybeSingle(),
    ]);

    if (roleError || profileError) return next(roleError || profileError);

    if (!roleData?.role) {
      return res.status(403).json({ status: "fail", message: "No role assigned" });
    }

    if (profile?.status === "deactivated") {
      return res.status(403).json({ status: "fail", message: "Account is deactivated" });
    }

    if (
      profile?.status === "inactive" &&
      FIRM_ROLES.includes(roleData.role) &&
      !allowInactive
    ) {
      return res.status(403).json({
        status: "fail",
        code: "PASSWORD_CHANGE_REQUIRED",
        message: "You must set a new password before continuing.",
      });
    }

    req.user = user;
    req.userRole = roleData.role;
    req.userStatus = profile?.status;
    next();
  } catch (error) {
    next(error);
  }
};

const authUser = buildAuth();
const authUserAllowInactive = buildAuth({ allowInactive: true });

export { authUser, authUserAllowInactive };
