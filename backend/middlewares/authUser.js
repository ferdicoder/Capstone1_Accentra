import { supabase } from "../config/supabase.js";

const authUser = async (req, res, next) => {
  
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      status: "fail",
      message: "Missing or invalid authorization header",
    });
  }

  try {
    const token = authHeader.split(" ")[1]; 
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({
        status: "fail",
        message: "Unauthorized",
      });
    }

    req.user = data.user;
    next();
  } catch (error) {
    next(error);
  }
};

export { authUser };