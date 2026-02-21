// Incident Reports Page
(function() {
  if (!ProgressSystem.checkPageAccess('reports.html')) {
    ModalSystem.warning('このページにアクセスするには LEVEL 1 が必要です。', 'ACCESS DENIED')
      .then(() => Router.navigate('#/dashboard'));
    return;
  }

  const REPORTS_KEY = 'kaishoku_reports';
  let currentSeverity = 'warning';

  function getReports() {
    try { return JSON.parse(localStorage.getItem(REPORTS_KEY)) || []; } catch(e) { return []; }
  }

  function saveReport(report) {
    const reports = getReports();
    reports.unshift(report);
    if (reports.length > 50) reports.pop();
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  }

  function init() {
    const user = ProgressSystem.getUserData();
    if (!user) { Router.navigate('#/login'); return; }

    // Pre-fill author
    const authorEl = document.getElementById('report-author');
    if (authorEl) authorEl.value = user.name || '';

    // Severity buttons
    document.querySelectorAll('.severity-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.severity-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentSeverity = this.dataset.severity;
      });
    });

    // Form submit
    const form = document.getElementById('report-form');
    if (form) {
      form.addEventListener('submit', handleSubmit);
    }

    renderReports();
  }

  function handleSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('report-title')?.value?.trim();
    const location = document.getElementById('report-location')?.value?.trim();
    const desc = document.getElementById('report-desc')?.value?.trim();
    const author = document.getElementById('report-author')?.value?.trim();
    const entityDesc = document.getElementById('report-entity')?.value?.trim();

    if (!title || !desc) {
      ModalSystem.error('タイトルと内容は必須です。', '入力エラー');
      return;
    }

    const report = {
      id: 'RPT-' + Date.now(),
      title,
      location: location || '場所不明',
      desc,
      entityDesc: entityDesc || '不明',
      author: author || '匿名機関員',
      severity: currentSeverity,
      timestamp: new Date().toISOString(),
    };

    saveReport(report);
    ProgressSystem.trackActivity('chat_message');
    ModalSystem.success('報告書を提出しました。収束部門に転送されます。', '報告受理');

    // Reset form
    e.target.reset();
    const user = ProgressSystem.getUserData();
    if (user) {
      const authorEl = document.getElementById('report-author');
      if (authorEl) authorEl.value = user.name || '';
    }
    document.querySelectorAll('.severity-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.severity-btn.warning')?.classList.add('active');
    currentSeverity = 'warning';

    renderReports();
  }

  function renderReports() {
    const el = document.getElementById('reports-list-container');
    if (!el) return;

    const reports = getReports();
    
    if (reports.length === 0) {
      el.innerHTML = '<p class="text-muted" style="text-align:center;padding:2rem;">提出された報告書はありません</p>';
      return;
    }

    const SEVERITY_COLORS = { critical: '#ef4444', warning: '#f59e0b', safe: '#10b981' };
    const SEVERITY_LABELS = { critical: '重大', warning: '警戒', safe: '観察' };

    el.innerHTML = reports.map(r => {
      const color = SEVERITY_COLORS[r.severity] || '#6b7280';
      const dt = new Date(r.timestamp);
      const dateStr = dt.toLocaleString('ja-JP', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
      return `
        <div class="report-item" style="--item-color:${color}">
          <div class="report-item-header">
            <div>
              <div class="report-item-title">${r.title}</div>
              <div class="report-item-meta">${r.id} | ${r.author} | ${dateStr}</div>
            </div>
            <span class="badge" style="background:${color}20;color:${color};border:1px solid ${color}40;font-size:0.65rem;padding:0.2rem 0.5rem;">
              ${SEVERITY_LABELS[r.severity] || r.severity}
            </span>
          </div>
          <div class="report-item-desc">${r.desc}</div>
          ${r.location !== '場所不明' ? `<div style="margin-top:0.5rem;font-size:0.7rem;font-family:'JetBrains Mono',monospace;color:var(--muted-foreground);">📍 ${r.location}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  init();
})();
