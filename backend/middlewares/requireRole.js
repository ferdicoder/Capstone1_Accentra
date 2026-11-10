const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.userRole || !allowedRoles.includes(req.userRole)) {
    return res.status(403).json({
      status: "fail",
      message: "You do not have permission to perform this action",
    });
  }
  next();
};
export { requireRole };
