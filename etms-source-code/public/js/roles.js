/**
 * Roles & Permissions Module — Glowing Toggles UI
 */
const Roles = {
    roles: [], permissions: {},
    async init() {
        await this.loadData();
        document.getElementById('roleForm')?.addEventListener('submit', (e) => { e.preventDefault(); this.createRole(); });
    },
    async loadData() {
        try {
            App.showLoading();
            const [rolesRes, permsRes] = await Promise.all([API.get('/roles'), API.get('/permissions')]);
            this.roles = rolesRes.data || [];
            this.permissions = permsRes.data || {};
            this.render();
        } catch (e) {
            App.showError('فشل تحميل الأدوار والصلاحيات');
        } finally {
            App.hideLoading();
        }
    },
    getCategoryLabel(cat) {
        const labels = {
            tasks: '📋 المهام', users: '👥 المستخدمون', reports: '📊 التقارير',
            technical_issues: '🔧 البلاغات التقنية', departments: '🏢 الأقسام',
            roles: '🛡️ الأدوار والصلاحيات', audit: '📜 سجلات المراقبة',
            notifications: '🔔 الإشعارات', archives: '🗄️ الأرشيف', notes: '📝 الملاحظات'
        };
        return labels[cat] || cat.replace(/_/g, ' ').toUpperCase();
    },
    render() {
        const container = document.getElementById('rolesContainer');
        if (!container) return;
        const currentUser = App.getUser();
        const currentIsSuperUser = App.isSuperUser ? App.isSuperUser() : false;

        container.innerHTML = this.roles.map(role => {
            const permIds = role.permissions?.filter(p => p != null).map(p => p.id) || [];
            const isAdmin = role.name === 'admin';
            const isSuperRole = role.name === 'super_user';
            let permHtml = '';

            Object.entries(this.permissions).forEach(([cat, perms]) => {
                permHtml += `<div class="perm-category">
                    <div class="perm-category-title">${this.getCategoryLabel(cat)}</div>
                    <div class="perm-toggles-grid">`;
                perms.forEach(p => {
                    const isActive = isAdmin || isSuperRole || permIds.includes(p.id);
                    const stateClass = isActive ? 'active' : 'inactive';
                    // admin العادي لا يمكنه تعديل صلاحيات super_user
                    const isLocked = isAdmin || isSuperRole;
                    const disabledAttr = isLocked ? 'disabled' : '';
                    const disabledClass = isLocked ? 'perm-disabled' : '';
                    permHtml += `
                    <label class="perm-toggle ${stateClass} ${disabledClass}" title="${p.name}">
                        <input type="checkbox" style="display:none"
                            data-role="${role.id}" data-perm="${p.id}"
                            ${isActive ? 'checked' : ''} ${disabledAttr}
                            onchange="Roles.toggleState(this)">
                        <span class="perm-toggle-icon">
                            <i class="fas ${isActive ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                        </span>
                        <span class="perm-toggle-label">${p.description || p.name}</span>
                    </label>`;
                });
                permHtml += `</div></div>`;
            });

            // تصميم بطاقة super_user مميز
            if (isSuperRole) {
                return `<div class="col-12 col-xl-4 col-lg-6 animate-fade-up">
                    <div class="role-card data-card" style="border: 2px solid #FFD700; background: linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,165,0,0.05));">
                        <div class="role-card-header" style="background: linear-gradient(135deg, #1a1a2e, #16213e); border-bottom: 2px solid #FFD700;">
                            <div class="role-card-title">
                                <span class="badge-role badge-super-user">&#11088; مستخدم متميز</span>
                                <span class="role-name-text" style="color:#FFD700;font-weight:bold;">${role.description || role.name}</span>
                            </div>
                            <span class="role-perm-count" style="color:#FFD700;">
                                <i class="fas fa-crown me-1"></i>صلاحيات كاملة
                            </span>
                        </div>
                        <div class="role-card-body">${permHtml}</div>
                        <div class="role-card-footer">
                            <div class="text-center small" style="color:#FFD700;">
                                <i class="fas fa-star me-1"></i>هذا الدور محمي ولا يمكن تعديله
                            </div>
                        </div>
                    </div>
                </div>`;
            }

            return `<div class="col-12 col-xl-4 col-lg-6 animate-fade-up">
                <div class="role-card data-card">
                    <div class="role-card-header">
                        <div class="role-card-title">
                            ${App.roleBadge(role.name)}
                            <span class="role-name-text">${role.description || role.name}</span>
                        </div>
                        <span class="role-perm-count">
                            <i class="fas fa-key me-1"></i>${isAdmin ? 'كل الصلاحيات' : permIds.length + ' صلاحية'}
                        </span>
                    </div>
                    <div class="role-card-body">${permHtml}</div>
                    <div class="role-card-footer">
                        ${!isAdmin
                            ? `<button type="button" class="btn btn-primary-custom btn-sm w-100" onclick="Roles.savePermissions('${role.id}')">
                                <i class="fas fa-save me-2"></i>حفظ الصلاحيات
                               </button>`
                            : `<div class="text-center text-muted small"><i class="fas fa-crown me-1 text-warning"></i>المدير يملك جميع الصلاحيات تلقائياً</div>`
                        }
                    </div>
                </div>
            </div>`;
        }).join('');
    },
    toggleState(cb) {
        const label = cb.closest('label');
        const icon = label.querySelector('.perm-toggle-icon i');
        if (cb.checked) {
            label.classList.remove('inactive'); label.classList.add('active');
            icon.classList.remove('fa-times-circle'); icon.classList.add('fa-check-circle');
        } else {
            label.classList.remove('active'); label.classList.add('inactive');
            icon.classList.remove('fa-check-circle'); icon.classList.add('fa-times-circle');
        }
    },
    async savePermissions(roleId) {
        const checkboxes = document.querySelectorAll(`input[data-role="${roleId}"]:checked`);
        const permIds = Array.from(checkboxes).map(cb => cb.dataset.perm);
        try {
            App.showLoading();
            await API.post('/roles/' + roleId + '/permissions', { permission_ids: permIds });
            App.showSuccess('تم حفظ الصلاحيات بنجاح');
            await this.loadData();
        } catch (e) {
            App.showError(e.message || 'فشل الحفظ');
        } finally {
            App.hideLoading();
        }
    },
    openCreateModal() {
        document.getElementById('roleForm').reset();
        new bootstrap.Modal(document.getElementById('roleModal')).show();
    },
    async createRole() {
        const name = document.getElementById('roleName').value.trim();
        const description = document.getElementById('roleDesc').value.trim();
        if (!name) return App.showError('اسم الدور مطلوب');
        try {
            App.showLoading();
            await API.post('/roles', { name, description });
            bootstrap.Modal.getInstance(document.getElementById('roleModal'))?.hide();
            App.showSuccess('تم إنشاء الدور بنجاح');
            await this.loadData();
        } catch (e) {
            App.showError(e.message || 'فشل الإنشاء');
        } finally {
            App.hideLoading();
        }
    }
};
document.addEventListener('DOMContentLoaded', () => Roles.init());
