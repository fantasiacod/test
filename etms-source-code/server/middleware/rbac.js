/**
 * RBAC (Role-Based Access Control) Middleware
 * Fixed: Use req.user.permissions already set by auth middleware (no double DB query)
 */

// Permissions are managed by database now

/**
 * Authorize by permission names. User must have at least one of the listed permissions.
 * Admin always passes. Uses req.user.permissions set by authenticate middleware.
 * No extra DB query needed!
 */
function authorize(...requiredPermissions) {
    return (req, res, next) => {
        try {
            if (!req.user || !req.user.role) {
                return res.status(403).json({ success: false, message: 'Access denied. No role assigned.' });
            }

            const roleName = (req.user.role.name || '').toLowerCase();

            // Admin فقط له صلاحية كاملة تلقائياً
            if (roleName === 'admin') {
                return next();
            }

            // Use permissions already loaded by authenticate middleware
            const userPermissions = req.user.permissions || [];

            // Check if user has ANY of the required permissions
            const hasPermission = requiredPermissions.some(p =>
                userPermissions.includes(p) || userPermissions.includes('*')
            );

            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Insufficient permissions.',
                    required: requiredPermissions,
                    userPerms: userPermissions
                });
            }

            next();
        } catch (error) {
            console.error('[RBAC authorize]', error);
            return res.status(500).json({ success: false, message: 'Authorization error.' });
        }
    };
}

/**
 * Authorize by role names. User must have one of the listed roles.
 */
function authorizeRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }
        const roleName = (req.user.role.name || '').toLowerCase();
        if (!roles.map(r => r.toLowerCase()).includes(roleName)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${roles.join(' or ')}`
            });
        }
        next();
    };
}

/**
 * Department scope middleware.
 * Admin: sees all data
 * Manager: sees own department data
 * Employee: sees only own assigned tasks
 */
function departmentScope(req, res, next) {
    if (!req.user || !req.user.role) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    const roleName = (req.user.role.name || '').toLowerCase();
    if (roleName === 'admin') {
        // admin: يرى كل شيء بدون قيود
        req.departmentScope = null;
        req.userScope = null;
    } else if (roleName === 'manager') {
        // manager: يرى قسمه + جميع موظفي قسمه
        req.departmentScope = req.user.departmentId;
        req.userScope = null;
    } else if (roleName === 'super_user') {
        // super_user: يرى قسمه + جميع موظفي قسمه (مثل manager)
        // لكن صلاحياته محدودة من قاعدة البيانات
        req.departmentScope = req.user.departmentId;
        req.userScope = null;
    } else {
        // employee: يرى مهامه هو فقط
        req.departmentScope = req.user.departmentId;
        req.userScope = req.user.id;
    }
    next();
}

module.exports = { authorize, authorizeRole, departmentScope };
