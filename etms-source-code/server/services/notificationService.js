/**
 * Notification Service
 * Handles in-app notifications, email, and WhatsApp
 */
const { supabaseAdmin } = require('../config/database');
const { sendEmail } = require('../config/email');

/**
 * Create an in-app notification
 */
async function createNotification(userId, title, message, type = 'info', referenceType = null, referenceId = null) {
    try {
        const { data, error } = await supabaseAdmin.from('notifications').insert({
            user_id: userId,
            title,
            message,
            type,
            reference_type: referenceType,
            reference_id: referenceId
        }).select().single();
        if (error) console.error('[Notification]', error.message);
        return data;
    } catch (err) {
        console.error('[Notification] Failed:', err.message);
    }
}

/**
 * Send WhatsApp notification via webhook
 */
async function sendWhatsApp(phone, message) {
    const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL;
    if (!webhookUrl || !phone) return;
    try {
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, message })
        });
    } catch (err) {
        console.error('[WhatsApp] Failed:', err.message);
    }
}

/** Notify when a new task is created and assigned */
async function notifyTaskCreated(task, assignedUser, creatorName) {
    const title = 'مهمة جديدة';
    const msg = `تم تكليفك بالمهمة رقم #${task.task_number} "${task.title}" بواسطة ${creatorName}.`;
    await createNotification(assignedUser.id, title, msg, 'task', 'task', task.id);
    if (assignedUser.email) {
        await sendEmail(assignedUser.email, title, `<h3>${title}</h3><p>${msg}</p><p>الأولوية: <strong>${task.priority}</strong></p><p>تاريخ الانتهاء: ${task.end_date}</p>`);
    }
    if (assignedUser.phone) await sendWhatsApp(assignedUser.phone, msg);
}

/** Notify manager when task is completed */
async function notifyTaskCompleted(task, managerId, employeeName) {
    const title = 'مهمة مكتملة';
    const msg = `قام الموظف ${employeeName} بإكمال المهمة رقم #${task.task_number} "${task.title}".`;
    await createNotification(managerId, title, msg, 'success', 'task', task.id);
}

/** Notify manager when task is suspended */
async function notifyTaskSuspended(task, managerId, employeeName, reason) {
    const title = 'طلب تعليق مهمة';
    const msg = `طلب الموظف ${employeeName} تعليق المهمة رقم #${task.task_number} "${task.title}". السبب: ${reason}`;
    await createNotification(managerId, title, msg, 'warning', 'task', task.id);
}

/** Notify manager when task is delayed */
async function notifyTaskDelayed(task, managerId, employeeName, reason) {
    const title = 'طلب تأخير مهمة';
    const msg = `طلب الموظف ${employeeName} تأخير المهمة رقم #${task.task_number} "${task.title}". السبب: ${reason}`;
    await createNotification(managerId, title, msg, 'danger', 'task', task.id);
}

/** Notify about new user creation */
async function notifyUserCreated(user, adminName) {
    const title = 'تم إنشاء الحساب';
    const msg = `أهلاً بك! تم إنشاء حسابك بواسطة ${adminName}. اسم المستخدم: ${user.username}`;
    await createNotification(user.id, title, msg, 'info', 'user', user.id);
    if (user.email) {
        await sendEmail(user.email, title, `<h3>مرحباً بك في نظام إدارة المهام</h3><p>${msg}</p><p>يرجى تسجيل الدخول وتغيير كلمة المرور الخاصة بك.</p>`);
    }
}

/** Notify about permission changes */
async function notifyPermissionChange(userId, adminName, changes) {
    const title = 'تحديث الصلاحيات';
    const msg = `تم تحديث صلاحياتك بواسطة ${adminName}. ${changes}`;
    await createNotification(userId, title, msg, 'info', 'role', null);
}

module.exports = {
    createNotification,
    sendWhatsApp,
    notifyTaskCreated,
    notifyTaskCompleted,
    notifyTaskSuspended,
    notifyTaskDelayed,
    notifyUserCreated,
    notifyPermissionChange
};
