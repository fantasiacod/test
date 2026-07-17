/**
 * App Settings Routes — Logo & Branding
 */
const router = require('express').Router();
const { supabaseAdmin } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { authorizeRole } = require('../middleware/rbac');

// GET /api/settings/public — Get public settings (login logo, theme color) without auth
router.get('/public', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('app_settings').select('key, value').in('key', ['login_logo_url', 'primary_color', 'sidebar_color', 'text_color', 'font_family', 'sidebar_text_color']);
        if (error) throw error;
        const settings = {};
        data.forEach(s => { settings[s.key] = s.value; });
        res.json({ success: true, data: settings });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch public settings.' });
    }
});

router.use(authenticate);

// GET /api/settings — Get all settings (public for sidebar logo)
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('app_settings').select('key, value').order('key');
        if (error) throw error;
        const settings = {};
        data.forEach(s => { settings[s.key] = s.value; });
        res.json({ success: true, data: settings });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch settings.' });
    }
});

// PUT /api/settings — Update settings (admin only)
router.put('/', authorizeRole('admin'), async (req, res) => {
    try {
        const updates = req.body; // { key: value, ... }
        for (const [key, value] of Object.entries(updates)) {
            await supabaseAdmin
                .from('app_settings')
                .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
        }
        res.json({ success: true, message: 'Settings updated.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to update settings.' });
    }
});

// GET /api/settings/email — Get email configuration
router.get('/email', authorizeRole('admin'), async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('app_settings').select('key, value')
            .in('key', ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_from', 'smtp_enabled']);
        if (error) throw error;
        const settings = {};
        data.forEach(s => { settings[s.key] = s.value; });
        // Never send password
        res.json({ success: true, data: settings });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch email settings.' });
    }
});

// PUT /api/settings/email — Update email configuration (admin only)
router.put('/email', authorizeRole('admin'), async (req, res) => {
    try {
        const { smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, smtp_enabled } = req.body;
        const updates = { smtp_host, smtp_port, smtp_user, smtp_from, smtp_enabled };
        
        for (const [key, value] of Object.entries(updates)) {
            if (value !== undefined) {
                await supabaseAdmin.from('app_settings')
                    .upsert({ key, value: String(value), updated_at: new Date().toISOString() }, { onConflict: 'key' });
            }
        }
        // Only update password if provided
        if (smtp_pass && smtp_pass.trim()) {
            await supabaseAdmin.from('app_settings')
                .upsert({ key: 'smtp_pass', value: smtp_pass, updated_at: new Date().toISOString() }, { onConflict: 'key' });
            // Also update process env for current session
            process.env.SMTP_PASS = smtp_pass;
        }
        if (smtp_user) process.env.SMTP_USER = smtp_user;
        if (smtp_host) process.env.SMTP_HOST = smtp_host;
        if (smtp_port) process.env.SMTP_PORT = smtp_port;
        if (smtp_from) process.env.SMTP_FROM = smtp_from;

        res.json({ success: true, message: 'Email settings updated.' });
    } catch (err) {
        console.error('[Settings] Email update error:', err);
        res.status(500).json({ success: false, message: 'Failed to update email settings.' });
    }
});

// POST /api/settings/test-email — Send a test email
router.post('/test-email', authorizeRole('admin'), async (req, res) => {
    try {
        const { sendEmail } = require('../config/email');
        const user = req.user;
        if (!user.email) return res.status(400).json({ success: false, message: 'No email configured for your account.' });
        
        await sendEmail(user.email, 'اختبار إعدادات البريد الإلكتروني — نظام إدارة المهام',
            `<h3>اختبار ناجح ✅</h3><p>إذا وصل هذا البريد فإن إعدادات SMTP تعمل بشكل صحيح.</p><br><small>تم الإرسال من: نظام إدارة المهام</small>`
        );
        res.json({ success: true, message: 'تم إرسال بريد اختباري إلى ' + user.email });
    } catch (err) {
        console.error('[Settings] Test email error:', err);
        res.status(500).json({ success: false, message: 'فشل إرسال البريد: ' + err.message });
    }
});

// GET /api/settings/n8n — Get n8n configuration
router.get('/n8n', authorizeRole('admin'), async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('app_settings').select('key, value')
            .in('key', ['n8n_enabled', 'n8n_webhook_url']);
        if (error) throw error;
        const settings = { n8n_enabled: 'false', n8n_webhook_url: '' };
        if (data) data.forEach(s => { settings[s.key] = s.value; });
        res.json({ success: true, data: settings });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch n8n settings.' });
    }
});

// PUT /api/settings/n8n — Update n8n configuration
router.put('/n8n', authorizeRole('admin'), async (req, res) => {
    try {
        const { n8n_enabled, n8n_webhook_url } = req.body;
        const updates = { n8n_enabled, n8n_webhook_url };
        
        for (const [key, value] of Object.entries(updates)) {
            if (value !== undefined) {
                await supabaseAdmin.from('app_settings')
                    .upsert({ key, value: String(value), updated_at: new Date().toISOString() }, { onConflict: 'key' });
            }
        }
        res.json({ success: true, message: 'n8n settings updated.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to update n8n settings.' });
    }
});

// POST /api/settings/test-n8n — Send a test webhook
router.post('/test-n8n', authorizeRole('admin'), async (req, res) => {
    try {
        const { sendTaskToN8n } = require('../services/n8nService');
        // Send a dummy test task
        await sendTaskToN8n({
            id: 'TEST-12345',
            taskNumber: 'TSK-TEST-001',
            title: 'مهمة تجريبية (Test Task)',
            description: 'هذه مهمة تجريبية للتحقق من ربط n8n بنجاح.',
            priority: 'medium',
            status: 'new',
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
            workDays: 1,
            assignedTo: {
                full_name: 'موظف تجريبي',
                email: 'test@example.com',
                phone: '00966500000000',
                employee_id: 'EMP-001'
            },
            createdBy: req.user,
            department: { name: 'الإدارة (Test)' }
        }, 'test_connection');
        
        res.json({ success: true, message: 'تم إرسال الطلب التجريبي إلى n8n بنجاح.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'فشل إرسال الطلب التجريبي: ' + (err.message || 'خطأ غير معروف') });
    }
});

module.exports = router;

