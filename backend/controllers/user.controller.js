import { supabaseAdmin } from "../config/supabaseAdmin.js";
import { toISODateString } from "../utils/formatDate.js";
import { createClient } from "@supabase/supabase-js";

const FIRM_ROLES = ["admin", "staff", "billing_officer"];

function getErrorMessage(error, fallback = "Unexpected server error") {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  if (error?.message) return error.message;
  if (error?.details) return error.details;
  if (error?.hint) return error.hint;
  return fallback;
}

async function createStaff(req, res) {
  const {
    email, password, role, firstName, middleName, lastName,
    extension, contactNumber, birthdate,
  } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({
      message: "Email, password, first name and last name are required.",
    });
  }

  try {
    const { data: roleRecord, error: roleError } = await supabaseAdmin
      .from("roles")
      .select("role_id")
      .eq("role_id", role)
      .in("role_id", FIRM_ROLES)
      .maybeSingle();

    if (roleError) {
      throw new Error(`Could not validate the requested role: ${getErrorMessage(roleError)}`);
    }
    if (!roleRecord) {
      return res.status(400).json({ message: "Invalid firm user role" });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      // created_by lets the user_created audit trigger attribute the actor.
      app_metadata: { role, created_by: req.user?.id },
      user_metadata: {
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        extension: extension || null,
        contact_no: contactNumber,
        birth_date: birthdate ? toISODateString(birthdate) : null,
      },
      email_confirm: true,
    });

    if (error) {
      const status =
        error.code === "email_exists" ? 409 :
        error.code === "weak_password" ? 400 : 500;
      return res.status(status).json({ message: error.message });
    }

    const { error: userRoleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: data.user.id, role }, { onConflict: "user_id" });

    if (userRoleError) {
      await supabaseAdmin.auth.admin.deleteUser(data.user.id);
      throw new Error(`Could not assign the new user's role: ${getErrorMessage(userRoleError)}`);
    }

    // NEW: firm accounts start as "inactive" (pending first login).
    const { data: statusRows, error: statusError } = await supabaseAdmin
      .from("users")
      .update({ status: "inactive" })
      .eq("user_id", data.user.id)
      .select("user_id");

    if (statusError || !statusRows?.length) {
      await supabaseAdmin.auth.admin.deleteUser(data.user.id);
      throw new Error(
        `Could not set initial account status: ${getErrorMessage(
          statusError,
          "the profile row was not created"
        )}`
      );
    }

    // Audit ("user_created") is written by the trg_log_user_created
    // DB trigger; actor comes from app_metadata.created_by set above.

    return res.status(201).json(data);
  } catch (err) {
    const message = getErrorMessage(err, "Staff creation failed.");
    console.error("Staff creation failed:", {
      message,
      code: err?.code,
      details: err?.details,
      hint: err?.hint,
    });
    return res.status(500).json({ message });
  }
}

async function updateUserRole(req, res) {
  const { userId } = req.params;
  const { role } = req.body;
  const actorId = req.user?.id;

  try {
    const { data: roleRecord, error: roleError } = await supabaseAdmin
      .from("roles")
      .select("role_id")
      .eq("role_id", role)
      .in("role_id", FIRM_ROLES)
      .maybeSingle();
    if (roleError) throw roleError;
    if (!roleRecord) return res.status(400).json({ message: "Invalid firm user role" });

    if (String(userId) === String(actorId)) {
      return res.status(403).json({ message: "You cannot change your own role." });
    }

    const { data: current, error: currentError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    if (currentError) throw currentError;
    if (!current || !FIRM_ROLES.includes(current.role)) {
      return res.status(404).json({ message: "Firm user not found" });
    }
    if (current.role === role) return res.status(200).json({ userId, role });

    // Last active admin guard
    if (current.role === "admin") {
      const { data: adminRows, error: adminError } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      if (adminError) throw adminError;

      const { data: activeAdmins, error: activeError } = await supabaseAdmin
        .from("users")
        .select("user_id")
        .in("user_id", adminRows.map((r) => r.user_id))
        .neq("status", "deactivated");
      if (activeError) throw activeError;

      if (activeAdmins.length <= 1) {
        return res.status(409).json({
          message: "This is the only active firm administrator, so its role cannot be changed.",
        });
      }
    }

    // Audit ("user_role_changed") is written by the trg_log_user_role_changed
    // DB trigger. Service-role requests have auth.uid() IS NULL, so pass the
    // acting admin via x-actor-id; pgrst_pre_request() stores it in the
    // transaction-local GUC app.actor_id (trusted only for service_role).
    const adminWithActor = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY,
      {
        global: { headers: { "x-actor-id": String(actorId ?? "") } },
        auth: { persistSession: false, autoRefreshToken: false },
      }
    );

    const { error } = await adminWithActor
      .from("user_roles")
      .update({ role })
      .eq("user_id", userId);
    if (error) throw error;

    const { error: metaError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      app_metadata: { role },
    });
    if (metaError) console.error("app_metadata sync failed:", metaError.message);

    return res.status(200).json({ userId, role });
  } catch (err) {
    const message = getErrorMessage(err);
    console.error("User role update failed:", {
      message,
      code: err?.code,
      details: err?.details,
      hint: err?.hint,
    });
    return res.status(500).json({ message });
  }
}

// GET /auth/me
async function getMe(req, res) {
  return res.status(200).json({
    id: req.user.id,
    email: req.user.email,
    role: req.userRole,
    status: req.userStatus,
  });
}

// PATCH /auth/password
async function changeOwnPassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  if (!FIRM_ROLES.includes(req.userRole)) {
    return res.status(403).json({ message: "Not allowed." });
  }
  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return res.status(400).json({
      message: "Current password and a new password of at least 8 characters are required.",
    });
  }
  if (currentPassword === newPassword) {
    return res.status(400).json({
      message: "New password must be different from the current password.",
    });
  }

  try {
    // Throwaway client so the admin client's session is never touched.
    const verifier = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: verifyError } = await verifier.auth.signInWithPassword({
      email: req.user.email,
      password: currentPassword,
    });
    if (verifyError) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(req.user.id, {
      password: newPassword,
    });
    if (pwError) {
      return res
        .status(pwError.code === "weak_password" ? 400 : 500)
        .json({ message: pwError.message });
    }

    // Flip status only after the password actually changed.
    const { error: statusError } = await supabaseAdmin
      .from("users")
      .update({ status: "active" })
      .eq("user_id", req.user.id)
      .eq("status", "inactive");
    if (statusError) throw statusError;

    // Audit ("password_changed") is written by the trg_log_password_changed
    // DB trigger on auth.users; it fires during the password update above,
    // while status is still 'inactive', so first_login stays accurate.

    return res.status(200).json({ message: "Password updated.", status: "active" });
  } catch (err) {
    const message = getErrorMessage(err);
    console.error("Password change failed:", {
      message,
      code: err?.code,
      details: err?.details,
      hint: err?.hint,
    });
    return res.status(500).json({ message });
  }
}

export { createStaff, updateUserRole, getMe, changeOwnPassword };
