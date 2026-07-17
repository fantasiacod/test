/**
 * Task Detail Module
 */
const TaskDetail = {
    taskId: null, task: null,
    async init() {
        const pathParts = window.location.pathname.split('/');
        this.taskId = pathParts[pathParts.length - 1];
        if (!this.taskId || this.taskId === 'task') { App.showError('No task ID'); return; }
        await this.loadTask();
        document.getElementById('addNoteForm')?.addEventListener('submit', (e) => { e.preventDefault(); this.addNote(); });
    },
    async loadTask() {
        try { App.showLoading();
            const r = await API.get('/tasks/'+this.taskId);
            if (!r.success) { App.showError('Task not found'); return; }
            this.task = r.data; this.renderTaskInfo(this.task); this.renderNotes(this.task.notes||[]); this.renderActions(this.task);
        } catch(e) { App.showError('Failed to load task'); } finally { App.hideLoading(); }
    },
    renderTaskInfo(t) {
        document.getElementById('taskDetailTitle').textContent = `Task #${t.taskNumber}`;
        document.getElementById('detailTaskNumber').textContent = '#'+t.taskNumber;
        document.getElementById('detailTitle').textContent = t.title;
        document.getElementById('detailDescription').textContent = t.description||'No description';
        document.getElementById('detailPriority').innerHTML = App.priorityBadge(t.priority);
        document.getElementById('taskStatusBadge').innerHTML = App.statusBadge(t.status);
        document.getElementById('detailAssignedTo').textContent = t.assignedTo?.full_name||'—';
        document.getElementById('detailCreatedBy').textContent = t.createdBy?.full_name||'—';
        document.getElementById('detailStartDate').textContent = App.formatDate(t.startDate);
        document.getElementById('detailEndDate').textContent = App.formatDate(t.endDate);
        document.getElementById('detailCloseDate').textContent = App.formatDate(t.closeDate);
        document.getElementById('detailDepartment').textContent = t.department?.name||'—';
        document.getElementById('detailWorkDays').textContent = t.workDays + ' days';
        const pBar = document.getElementById('detailProgressBar');
        const p = Number(t.progress);
        
        pBar.style.width = p + '%';
        
        if (t.status === 'delayed') pBar.className = 'progress-bar bg-danger';
        else if (t.status === 'suspended') pBar.className = 'progress-bar bg-secondary';
        else if (p === 0) pBar.className = 'progress-bar bg-light border-end';
        else if (p < 100) pBar.className = 'progress-bar bg-warning';
        else pBar.className = 'progress-bar bg-success';
        
        document.getElementById('detailProgressText').textContent = p+'%';
        if (t.suspendReason) { document.getElementById('suspendReasonSection').style.display='block'; document.getElementById('detailSuspendReason').textContent=t.suspendReason; }
        if (t.delayReason) { document.getElementById('delayReasonSection').style.display='block'; document.getElementById('detailDelayReason').textContent=t.delayReason; }
    },
    renderNotes(notes) {
        const el = document.getElementById('notesTimeline');
        if (!notes.length) {
            el.innerHTML = '<div class="empty-state"><i class="fas fa-comment-slash"></i><h5>لا توجد ملاحظات بعد</h5><p>أضف أول ملاحظة أدناه</p></div>';
            return;
        }
        el.innerHTML = notes.map(n => `<div class="timeline-item">
            <div class="timeline-meta">
                <strong>${n.user?.fullName || 'غير معروف'}</strong> ${App.roleBadge(n.user?.role || 'employee')}
                <span>${App.formatDateTime(n.createdAt)}</span>
            </div>
            <div class="timeline-content">${n.content}</div>
            ${n.imageUrl ? `<div class="mt-2">
                <img src="${n.imageUrl}" class="note-image-preview" alt="صورة الملاحظة"
                    onclick="TaskDetail.openImageModal('${n.imageUrl}')"
                    style="max-height:180px;border-radius:8px;cursor:zoom-in;border:1px solid var(--border-color)">
            </div>` : ''}
        </div>`).join('');
    },
    renderActions(t) {
        const el = document.getElementById('taskActions'); let html = '';
        const role = App.getUserRole(); const isAssigned = t.assignedTo?.id === App.getUser()?.id;
        
        // Allow ANY assigned user (Admin, Manager, or Employee) to update the task status
        if (isAssigned) {
            var isOverdue = false;
            if (t.status === 'delayed') isOverdue = true;
            else if (t.endDate && new Date(t.endDate) < new Date() && t.status === 'in_progress') isOverdue = true;

            if (t.status==='new') html += `<button class="btn btn-primary-custom w-100 mb-2" onclick="TaskDetail.changeStatus('in_progress')"><i class="fas fa-play me-1"></i>Start Task</button>`;
            if (t.status==='in_progress' || t.status==='delayed') {
                if (isOverdue && !t.delayReason) {
                    html += `<div class="alert alert-danger py-2 small text-center"><i class="fas fa-exclamation-triangle"></i> المهمة متأخرة! يجب تقديم تبرير للمدير.</div>`;
                    html += `<button class="btn btn-danger w-100 mb-2" onclick="TaskDetail.submitDelayJustification()"><i class="fas fa-exclamation-triangle me-1"></i>تقديم تبرير للتأخير</button>`;
                } else if (!isOverdue) {
                    html += `<button class="btn btn-success w-100 mb-2" onclick="TaskDetail.changeStatus('completed')"><i class="fas fa-check me-1"></i>Complete</button>`;
                    html += `<button class="btn btn-warning w-100 mb-2" onclick="TaskDetail.changeStatus('pending_suspension')"><i class="fas fa-pause me-1"></i>تعليق (طلب)</button>`;
                    html += `<button class="btn btn-danger w-100 mb-2" onclick="TaskDetail.changeStatus('pending_delay')"><i class="fas fa-exclamation me-1"></i>تأخير (طلب)</button>`;
                }
            }
            if (t.status==='suspended') html += `<button class="btn btn-primary-custom w-100 mb-2" onclick="TaskDetail.changeStatus('in_progress')"><i class="fas fa-play me-1"></i>Resume</button>`;
        }

        // Manager Approval Buttons for Pending Requests or Justified Delayed Tasks
        const needsManagerApproval = t.status === 'pending_suspension' || t.status === 'pending_delay' || (t.status === 'delayed' && t.delayReason);
        if ((role === 'manager' || role === 'admin') && needsManagerApproval) {
            html += `<hr class="my-2">`;
            html += `<p class="small text-muted mb-2 text-center fw-bold">بانتظار موافقة المدير</p>`;
            html += `<button class="btn btn-success w-100 mb-2" onclick="TaskDetail.approveStatus('approve')"><i class="fas fa-check-circle me-1"></i>موافقة على الطلب</button>`;
            html += `<button class="btn btn-danger w-100 mb-2" onclick="TaskDetail.approveStatus('reject')"><i class="fas fa-times-circle me-1"></i>رفض الطلب</button>`;
        } else if (needsManagerApproval) {
            // Show employee that it's waiting for approval
            html += `<hr class="my-2">`;
            html += `<div class="alert alert-info py-2 small text-center"><i class="fas fa-hourglass-half me-1"></i> بانتظار موافقة المدير على التبرير/الطلب</div>`;
        }

        if (role==='manager'||role==='admin') { html += `<button class="btn btn-gold w-100 mb-2" onclick="window.location.href='/tasks'"><i class="fas fa-arrow-left me-1"></i>العودة للمهام</button>`; }
        if (!html) html = '<p class="text-muted small">لا توجد إجراءات متاحة لهذه الحالة.</p>';
        el.innerHTML = html;
    },
    async changeStatus(status) {
        let reason = null;
        if (status === 'pending_suspension') {
            const {value} = await Swal.fire({title:'سبب التعليق', text:'سيتم إرسال هذا الطلب للمدير للموافقة.', input:'textarea',inputPlaceholder:'لماذا تريد تعليق هذه المهمة؟',showCancelButton:true,inputValidator:v=>{if(!v)return 'يرجى كتابة التبرير أولاً'}});
            if (!value) return; reason = value;
        }
        if (status === 'pending_delay') {
            const {value} = await Swal.fire({title:'سبب التأخير', text:'سيتم إرسال هذا الطلب للمدير للموافقة.', input:'textarea',inputPlaceholder:'لماذا تريد تأخير هذه المهمة؟',showCancelButton:true,inputValidator:v=>{if(!v)return 'يرجى كتابة التبرير أولاً'}});
            if (!value) return; reason = value;
        }
        try { App.showLoading();
            const data = { status }; if (reason && status==='pending_suspension') data.suspend_reason=reason; if (reason && status==='pending_delay') data.delay_reason=reason;
            await API.patch('/tasks/'+this.taskId+'/status', data);
            App.showSuccess('تم إرسال الطلب بنجاح'); await this.loadTask();
        } catch(e) { App.showError(e.message||'حدث خطأ غير متوقع'); } finally { App.hideLoading(); }
    },
    async submitDelayJustification() {
        const {value} = await Swal.fire({
            title: 'تبرير التأخير', 
            text: 'المهمة متأخرة عن موعدها. يرجى تقديم مبرر واضح لسبب التأخير ليطلع عليه المدير.', 
            input: 'textarea',
            inputPlaceholder: 'السبب الحقيقي وراء تأخر إنجاز المهمة...',
            showCancelButton: true,
            inputValidator: v => { if(!v) return 'يرجى كتابة التبرير أولاً' }
        });
        if (!value) return;
        
        try { 
            App.showLoading();
            await API.post('/tasks/'+this.taskId+'/justification', { delay_reason: value });
            App.showSuccess('تم إرسال التبرير بنجاح'); 
            await this.loadTask();
        } catch(e) { 
            App.showError(e.message || 'حدث خطأ أثناء الإرسال'); 
        } finally { 
            App.hideLoading(); 
        }
    },
    async approveStatus(action) {
        let extraDays = 0;
        if (action === 'approve' && this.task.status === 'pending_delay') {
            const {value} = await Swal.fire({
                title: 'تأكيد الموافقة',
                text: 'هل ترغب في إضافة أيام إضافية للمهمة لتمديد فترة الإنجاز؟',
                input: 'select',
                inputOptions: {
                    '0': 'بدون إضافة (0)',
                    '1': 'يوم',
                    '2': 'يومين',
                    '3': 'ثلاثة أيام',
                    '4': 'أربعة أيام',
                    '5': 'خمسة أيام',
                    '6': 'ستة أيام',
                    '7': 'أسبوع',
                    '14': 'أسبوعين',
                    '21': 'ثلاثة أسابيع',
                    '30': 'شهر'
                },
                inputValue: '0',
                showCancelButton: true,
                confirmButtonText: 'موافق',
                cancelButtonText: 'إلغاء'
            });
            if (value === undefined) return; // cancelled
            extraDays = parseInt(value) || 0;
        } else if (action === 'approve' && this.task.status === 'pending_suspension') {
            const confirmed = await App.confirmAction('هل أنت متأكد من الموافقة على تعليق المهمة؟');
            if (!confirmed) return;
        } else if (action === 'reject') {
            const confirmed = await App.confirmAction('هل أنت متأكد من رفض هذا الطلب؟');
            if (!confirmed) return;
        }

        try {
            App.showLoading();
            await API.patch('/tasks/'+this.taskId+'/approve-status', { action, extraDays });
            App.showSuccess(action === 'approve' ? 'تمت الموافقة على الطلب بنجاح' : 'تم رفض الطلب بنجاح');
            await this.loadTask();
        } catch(e) { App.showError(e.message||'حدث خطأ غير متوقع'); } finally { App.hideLoading(); }
    },
    async addNote() {
        const content = document.getElementById('noteContent').value.trim();
        if (!content) { App.showError('يرجى كتابة ملاحظة أولاً'); return; }
        
        // Get image if attached
        const imgEl = document.getElementById('noteImagePreview');
        const imageUrl = (imgEl && imgEl.src && imgEl.src !== window.location.href) ? imgEl.src : null;
        
        try {
            await API.post('/task-notes/task/' + this.taskId, { content, image_url: imageUrl });
            // Reset form
            document.getElementById('noteContent').value = '';
            this.clearNoteImage();
            await this.loadTask();
            App.showSuccess('تمت إضافة الملاحظة بنجاح');
        } catch (e) {
            App.showError(e.message || 'حدث خطأ غير متوقع');
        }
    },
    previewNoteImage(input) {
        const file = input.files[0];
        if (!file) return;
        // Validate size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            App.showError('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
            input.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('noteImagePreview');
            const wrap = document.getElementById('noteImagePreviewWrap');
            preview.src = e.target.result;
            wrap.style.display = 'inline-block';
        };
        reader.readAsDataURL(file);
    },
    clearNoteImage() {
        const preview = document.getElementById('noteImagePreview');
        const wrap = document.getElementById('noteImagePreviewWrap');
        const input = document.getElementById('noteImageInput');
        if (preview) preview.src = '';
        if (wrap) wrap.style.display = 'none';
        if (input) input.value = '';
    },
    openImageModal(src) {
        Swal.fire({
            imageUrl: src,
            imageAlt: 'صورة الملاحظة',
            showConfirmButton: false,
            showCloseButton: true,
            width: 'auto',
            padding: '8px'
        });
    }
};
document.addEventListener('DOMContentLoaded', () => TaskDetail.init());
