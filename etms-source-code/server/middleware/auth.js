/**
 * Authentication Middleware
 * Fixed: Comprehensive default permissions for all non-admin roles
 */
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const { supabaseAdmin } = require('../config/database');

// Default permissions logic was moved to database

async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, jwtConfig.secret);

        // Fetch user with role info
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select(`
                id, full_name, email, phone, job_title, employee_id,
                username, department_id, status, avatar_url,
                departments!users_department_id_fkey(id, name),
                user_roles(
                    roles(id, name)
                )
            `)
            .eq('id', decoded.userId)
            .single();

        if (error || !user) {
            return res.status(401).json({ success: false, message: 'Invalid token. User not found.' });
        }

        if (user.status === 'suspended') {
            return res.status(403).json({ success: false, message: 'Account is suspended. Contact administrator.' });
        }

        if (user.status === 'deleted') {
            return res.status(401).json({ success: false, message: 'Invalid token.' });
        }

        // Flatten role info
        const role = user.user_roles && user.user_roles.length > 0
            ? user.user_roles[0].roles
            : { id: null, name: 'employee' };

        let permissions = [];
        const roleLower = (role.name || 'employee').toLowerCase();

        if (roleLower === 'admin') {
            // admin فقط يحصل على صلاحية كاملة
            permissions = ['*'];
        } else {
            // Get role-specific permissions from DB
            if (role.id) {
                const { data: rolePerms } = await supabaseAdmin
                    .from('role_permissions')
                    .select('permissions(name)')
                    .eq('role_id', role.id);

                if (rolePerms) {
                    permissions = rolePerms
                        .map(rp => rp?.permissions?.name)
                        .filter(Boolean);
                }
            }
        }

        req.user = {
            id: user.id,
            fullName: user.full_name,
            email: user.email,
            phone: user.phone,
            jobTitle: user.job_title,
            employeeId: user.employee_id,
            username: user.username,
            departmentId: user.department_id,
            department: user.departments,
            status: user.status,
            avatarUrl: user.avatar_url,
            role: role,
            permissions: permissions
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Invalid token.' });
        }
        console.error('[Auth Middleware]', error);
        return res.status(500).json({ success: false, message: 'Authentication error.' });
    }
}

module.exports = { authenticate };
