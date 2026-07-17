-- ════════════════════════════════════════════════════════════════
--  ⭐ SQL Script: إضافة دور Super User في Supabase
--  📌 super_user: أعلى من الموظف، أقل من المشرف والمدير
-- ════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════
-- STEP 1: التأكد من وجود دور super_user
-- ══════════════════════════════════════
INSERT INTO roles (name, description, is_system)
VALUES ('super_user', 'مستخدم متميز - أعلى من الموظف العادي', true)
ON CONFLICT (name) DO UPDATE
    SET description = EXCLUDED.description;

-- ══════════════════════════════════════════════════════════════════
-- STEP 2: منح super_user صلاحيات محددة
-- (أعلى من الموظف — لكن ليست كاملة مثل المدير)
-- ══════════════════════════════════════════════════════════════════

-- أولاً: حذف الصلاحيات القديمة لإعادة تعيينها
DELETE FROM role_permissions
WHERE role_id = (SELECT id FROM roles WHERE name = 'super_user');

-- ثانياً: منح الصلاحيات المناسبة لـ super_user
-- يشمل: عرض وإنشاء وتعديل المهام، عرض التقارير، عرض المستخدمين
-- لا يشمل: حذف المستخدمين، إدارة الأدوار، حذف الأقسام
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'super_user'),
    p.id
FROM permissions p
WHERE p.name IN (
    -- صلاحيات المهام (بدون حذف)
    'view_tasks',
    'create_tasks',
    'edit_tasks',
    'archive_tasks',
    -- صلاحيات التقارير
    'view_reports',
    -- صلاحيات الإشكاليات التقنية
    'view_issues',
    'create_issues',
    'resolve_issues',
    -- عرض المستخدمين فقط (بدون إنشاء أو حذف)
    'view_users',
    -- عرض الأقسام
    'view_departments',
    -- الإشعارات
    'view_notifications'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ══════════════════════════════════════════════════════════════════
-- STEP 3: تعيين الدور لمستخدم
-- 🔴 غيّر البريد الإلكتروني أدناه إلى بريد المستخدم الصحيح
-- ══════════════════════════════════════════════════════════════════
DO $$
DECLARE
    v_user_email TEXT := 'بريدك@هنا.com';  -- 🔴 غيّر هذا
    v_user_id    UUID;
    v_role_id    UUID;
BEGIN
    SELECT id INTO v_user_id FROM users WHERE email = v_user_email;
    SELECT id INTO v_role_id FROM roles WHERE name  = 'super_user';

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '❌ المستخدم غير موجود: %', v_user_email;
    END IF;

    -- إزالة الدور القديم وتعيين الجديد
    DELETE FROM user_roles WHERE user_id = v_user_id;
    INSERT INTO user_roles (user_id, role_id) VALUES (v_user_id, v_role_id);

    RAISE NOTICE '✅ تم! المستخدم أصبح super_user: %', v_user_email;
END $$;

-- ══════════════════════════════════════════════════════════════════
-- STEP 4: التحقق من الصلاحيات الممنوحة
-- ══════════════════════════════════════════════════════════════════
SELECT
    r.name        AS "الدور",
    p.name        AS "الصلاحية",
    p.description AS "الوصف",
    p.category    AS "الفئة"
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p       ON rp.permission_id = p.id
WHERE r.name = 'super_user'
ORDER BY p.category, p.name;
