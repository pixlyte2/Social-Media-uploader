const checkPermission = (permission) => {
    return (req, res, next) => {
        try {
            // 🔥 SuperAdmin full access
            if (req.user.role === "SUPERADMIN") {
                return next();
            }

            // 🔥 Admin full access (optional)
            if (req.user.role === "ADMIN") {
                return next();
            }

            // 🔥 User permission check
            if (!req.user.permissions?.includes(permission)) {
                return res.status(403).json({
                    msg: "Access denied: No permission"
                });
            }

            next();
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    };
};

module.exports = checkPermission;