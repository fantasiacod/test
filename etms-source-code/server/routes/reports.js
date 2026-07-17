/**
 * Report Routes
 * Fixed: All authenticated non-admin users with view_reports permission OR manager/employee defaults can access
 */
const router = require('express').Router();
const { supabaseAdmin } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { authorize, departmentScope } = require('../middleware/rbac');

router.use(authenticate);
router.use(departmentScope);

// All report routes require view_reports OR being a manager/admin
// But since view_reports might not be in defaults, we use a soft check:

// GET /api/reports/tasks
router.get('/tasks', authorize('view_reports', 'view_tasks'), async (req, res) => {
    try {
        const { date_from, date_to, status, priority, department_id, assigned_to } = req.query;
        let query = supabaseAdmin.from('tasks')
            .select(`*, assigned_user:users!tasks_assigned_to_fkey(id, full_name, employee_id), departments(id, name)`);

        if (req.userScope) query = query.eq('assigned_to', req.userScope);
        else if (req.departmentScope) query = query.eq('department_id', req.departmentScope);

        if (date_from) query = query.gte('start_date', date_from);
        if (date_to) query = query.lte('start_date', date_to);
        if (status) query = query.eq('status', status);
        if (priority) query = query.eq('priority', priority);
        if (department_id && !req.departmentScope) query = query.eq('department_id', department_id);
        if (assigned_to) query = query.eq('assigned_to', assigned_to);

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        const formatted = data.map(t => ({
            taskNumber: t.task_number, title: t.title, assignedTo: t.assigned_user?.full_name || 'N/A',
            department: t.departments?.name || 'N/A', priority: t.priority, status: t.status,
            progress: t.progress, startDate: t.start_date, endDate: t.end_date, closeDate: t.close_date
        }));

        // Summary stats
        const summary = {
            total: data.length,
            completed: data.filter(t => t.status === 'completed' || t.status === 'archived').length,
            inProgress: data.filter(t => t.status === 'in_progress').length,
            delayed: data.filter(t => t.status === 'delayed').length,
            suspended: data.filter(t => t.status === 'suspended').length,
            completionRate: data.length > 0 ? Math.round((data.filter(t => t.status === 'completed' || t.status === 'archived').length / data.length) * 100) : 0
        };

        res.json({ success: true, data: formatted, summary });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to generate report.' });
    }
});

// GET /api/reports/employees
router.get('/employees', authorize('view_reports', 'view_tasks'), async (req, res) => {
    try {
        let userQuery = supabaseAdmin
            .from('users')
            .select(`id, full_name, employee_id, department_id, departments(name),
                     user_roles(roles(name))`)
            .eq('status', 'active');

        if (req.departmentScope) userQuery = userQuery.eq('department_id', req.departmentScope);

        const { data: users, error: ue } = await userQuery;
        if (ue) throw ue;

        if (!users || users.length === 0) {
            return res.json({ success: true, data: [] });
        }

        // استبعاد مستخدمي super_user من تقرير الموظفين
        const filteredUsers = users.filter(u => {
            const roleName = (u.user_roles && u.user_roles[0] && u.user_roles[0].roles && u.user_roles[0].roles.name)
                ? u.user_roles[0].roles.name.toLowerCase()
                : '';
            return roleName !== 'super_user';
        });

        // جلب المهام لجميع المستخدمين دفعة واحدة
        const userIds = filteredUsers.map(u => u.id);
        const { data: allTasks } = await supabaseAdmin
            .from('tasks')
            .select('assigned_to, status, progress')
            .in('assigned_to', userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000']);

        const tasksByUser = {};
        (allTasks || []).forEach(t => {
            if (!tasksByUser[t.assigned_to]) tasksByUser[t.assigned_to] = [];
            tasksByUser[t.assigned_to].push(t);
        });

        const report = filteredUsers.map(user => {
            const tasks = tasksByUser[user.id] || [];
            const total = tasks.length;
            const completed = tasks.filter(t => t.status === 'completed' || t.status === 'archived').length;
            const delayed = tasks.filter(t => t.status === 'delayed').length;
            return {
                employeeId: user.employee_id || '—',
                fullName: user.full_name || '—',
                department: (user.departments && user.departments.name) ? user.departments.name : 'N/A',
                totalTasks: total,
                completed,
                delayed,
                completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
            };
        });

        res.json({ success: true, data: report });
    } catch (err) {
        console.error('[Reports] Employee report error:', err);
        res.status(500).json({ success: false, message: 'Failed to generate employee report.' });
    }
});

// GET /api/reports/departments
router.get('/departments', authorize('view_reports', 'view_tasks'), async (req, res) => {
    try {
        let deptsQuery = supabaseAdmin.from('departments').select('id, name').eq('is_active', true);
        if (req.departmentScope) {
            deptsQuery = deptsQuery.eq('id', req.departmentScope);
        }

        const { data: depts } = await deptsQuery;
        const report = [];
        for (const dept of (depts || [])) {
            const { data: tasks } = await supabaseAdmin.from('tasks').select('status').eq('department_id', dept.id);
            const { data: users } = await supabaseAdmin.from('users').select('id').eq('department_id', dept.id);
            const total = tasks?.length || 0;
            const completed = tasks?.filter(t => t.status === 'completed' || t.status === 'archived').length || 0;
            report.push({
                department: dept.name, employeeCount: users?.length || 0,
                totalTasks: total, completed,
                inProgress: tasks?.filter(t => t.status === 'in_progress').length || 0,
                delayed: tasks?.filter(t => t.status === 'delayed').length || 0,
                completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
            });
        }
        res.json({ success: true, data: report });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to generate department report.' });
    }
});

// GET /api/reports/delays
router.get('/delays', authorize('view_reports', 'view_tasks'), async (req, res) => {
    try {
        let query = supabaseAdmin.from('tasks')
            .select(`*, assigned_user:users!tasks_assigned_to_fkey(id, full_name, employee_id), departments(id, name)`)
            .eq('status', 'delayed');
        if (req.departmentScope) query = query.eq('department_id', req.departmentScope);
        if (req.userScope) query = query.eq('assigned_to', req.userScope);

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        const formatted = data.map(t => ({
            taskNumber: t.task_number, title: t.title, assignedTo: t.assigned_user?.full_name || 'N/A',
            department: t.departments?.name || 'N/A', priority: t.priority,
            startDate: t.start_date, endDate: t.end_date, delayReason: t.delay_reason || 'N/A'
        }));

        res.json({ success: true, data: formatted });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to generate delay report.' });
    }
});

// GET /api/reports/technical-issues
router.get('/technical-issues', authorize('view_reports', 'view_technical_issues'), async (req, res) => {
    try {
        const { date_from, date_to, status, priority, department_id } = req.query;
        let query = supabaseAdmin.from('technical_issues')
            .select(`*, sender:users!technical_issues_sender_id_fkey(full_name), departments(name)`);
        
        if (req.departmentScope) query = query.eq('department_id', req.departmentScope);

        if (date_from) query = query.gte('created_at', date_from);
        if (date_to) query = query.lte('created_at', date_to);
        if (status) query = query.eq('status', status);
        if (priority) query = query.eq('priority', priority);
        if (department_id && !req.departmentScope) query = query.eq('department_id', department_id);

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        const formatted = data.map(i => ({
            issueNumber: i.issue_number, title: i.title, sender: i.sender?.full_name || 'N/A',
            department: i.departments?.name || 'N/A', priority: i.priority, status: i.status,
            createdAt: i.created_at
        }));

        const summary = {
            total: data.length,
            completed: data.filter(t => t.status === 'resolved' || t.status === 'closed').length,
            inProgress: data.filter(t => t.status === 'in_progress').length,
            delayed: data.filter(t => t.status === 'open').length, // Using delayed slot for 'open' issues
            completionRate: data.length > 0 ? Math.round((data.filter(t => t.status === 'resolved' || t.status === 'closed').length / data.length) * 100) : 0
        };

        res.json({ success: true, data: formatted, summary });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to generate issues report.' });
    }
});

module.exports = router;
