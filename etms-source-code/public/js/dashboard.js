/**
 * Dashboard Module — Charts and stats
 */
const Dashboard = {
    charts: {},
    async init() {
        try {
            App.showLoading();
            const [statsRes, chartsRes] = await Promise.all([
                API.get('/dashboard/stats'), API.get('/dashboard/charts')
            ]);
            if (statsRes.success) this.renderStats(statsRes.data);
            if (chartsRes.success) this.renderCharts(chartsRes.data);
            await this.loadRecentActivity();
        } catch (err) { console.error('Dashboard error:', err); }
        finally { App.hideLoading(); }
    },
    renderStats(data) {
        const s = data.tasksByStatus || {};
        this.animateCounter('statTotalTasks', data.totalTasks || 0);
        this.animateCounter('statCompleted', s.completed || 0);
        this.animateCounter('statInProgress', s.in_progress || 0);
        this.animateCounter('statDelayed', s.delayed || 0);
    },
    animateCounter(id, target) {
        const el = document.getElementById(id); if (!el) return;
        let current = 0; const step = Math.ceil(target / 30);
        const timer = setInterval(() => {
            current += step; if (current >= target) { current = target; clearInterval(timer); }
            el.textContent = current;
        }, 30);
    },
    renderCharts(data) {
        // Status Distribution (Doughnut)
        const statusCtx = document.getElementById('statusChart')?.getContext('2d');
        if (statusCtx) {
            const sd = data.statusDistribution || {};
            this.charts.status = new Chart(statusCtx, {
                type: 'doughnut', data: {
                    labels: ['New', 'In Progress', 'Completed', 'Suspended', 'Delayed'],
                    datasets: [{ data: [sd.new||0, sd.in_progress||0, sd.completed||0, sd.suspended||0, sd.delayed||0],
                        backgroundColor: ['#FFC107','#1E88E5','#43A047','#9E9E9E','#E53935'],
                        borderWidth: 0, hoverOffset: 8 }]
                }, options: { responsive: true, plugins: { legend: { position: 'bottom' } }, cutout: '65%' }
            });
        }
        // Timeline (Line)
        const timeCtx = document.getElementById('timelineChart')?.getContext('2d');
        if (timeCtx) {
            const td = data.tasksOverTime || [];
            const gradient = timeCtx.createLinearGradient(0, 0, 0, 250);
            gradient.addColorStop(0, 'rgba(76,175,80,0.3)'); gradient.addColorStop(1, 'rgba(76,175,80,0)');
            this.charts.timeline = new Chart(timeCtx, {
                type: 'line', data: {
                    labels: td.map(d => d.date.slice(5)), datasets: [{ label: 'Tasks Created', data: td.map(d => d.count),
                        borderColor: '#4CAF50', backgroundColor: gradient, fill: true, tension: 0.4, pointRadius: 4,
                        pointBackgroundColor: '#4CAF50', pointBorderColor: '#fff', pointBorderWidth: 2 }]
                }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
            });
        }
        // Priority (Bar)
        const priCtx = document.getElementById('priorityChart')?.getContext('2d');
        if (priCtx) {
            const pd = data.priorityDistribution || {};
            this.charts.priority = new Chart(priCtx, {
                type: 'bar', data: {
                    labels: ['Low','Medium','High','Urgent'], datasets: [{ label: 'Tasks',
                        data: [pd.low||0, pd.medium||0, pd.high||0, pd.urgent||0],
                        backgroundColor: ['#43A047','#FFC107','#FF9800','#E53935'], borderRadius: 6, maxBarThickness: 50 }]
                }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
            });
        }
        // Department (Horizontal Bar)
        const deptCtx = document.getElementById('departmentChart')?.getContext('2d');
        if (deptCtx && data.departmentComparison?.length > 0) {
            this.charts.dept = new Chart(deptCtx, {
                type: 'bar', data: {
                    labels: data.departmentComparison.map(d => d.name), datasets: [{ label: 'Tasks',
                        data: data.departmentComparison.map(d => d.count),
                        backgroundColor: ['#2E7D32','#FFD700','#1E88E5','#E53935'], borderRadius: 6, maxBarThickness: 40 }]
                }, options: { responsive: true, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } } }
            });
        } else { document.getElementById('deptChartCard')?.style.setProperty('display','none'); }
    },
    async loadRecentActivity() {
        try {
            const res = await API.get('/dashboard/recent-activity');
            const body = document.getElementById('activityBody');
            if (!body) return;
            if (!res.success || !res.data?.length) { body.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No recent activity</td></tr>'; return; }
            body.innerHTML = res.data.map(a => `<tr>
                <td>${App.timeAgo(a.created_at)}</td><td>${a.username || '—'}</td>
                <td><span class="badge bg-secondary">${a.action}</span></td>
                <td>${a.entity_type || '—'}</td><td class="small text-muted">${a.ip_address || '—'}</td>
            </tr>`).join('');
        } catch { }
    }
};
document.addEventListener('DOMContentLoaded', () => Dashboard.init());
