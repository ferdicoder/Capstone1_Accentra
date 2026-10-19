const requireRole = (...allowedRoles) => (req, res, next) => {
  const role = req.user?.app_metadata?.role;

  if (!allowedRoles.includes(role)) {
    return res.status(403).json({
      status: "fail",
      message: "You do not have permission to perform this action",
    });
  }

  next();
};

export { requireRole };
