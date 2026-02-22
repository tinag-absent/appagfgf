// Statistics Page
(function() {
  if (!ProgressSystem.checkPageAccess('statistics.html')) {
    ModalSystem.warning('このページにアクセスするには LEVEL 2 が必要です。', 'ACCESS DENIED')
      .then(() => Router.navigate('#/dashboard'));
    return;
  }

  const SEVERITY_COLOR = { critical: '#ef4444', warning: '#f59e0b', safe: '#10b981', standby: '#6b7280' };
  const STATUS_LABEL = { active: '対応中', completed: '収束済み', failed: '失敗', standby: '待機中' };
  const PRIORITY_LABEL = { critical: '重大', warning: '警戒', safe: '観察' };

  async function init() {
    await Promise.all([
      window.MissionData.whenReady(),
      window.CatalogData.whenReady(),
      window.PersonnelDatabase.whenReady()
    ]);

    const missions = window.MissionData.missions;
    const entities = window.CatalogData.entities;
    const personnel = window.PersonnelDatabase.personnel;

    renderKPIs(missions, entities, personnel);
    renderMissionStatusChart(missions);
    renderEntityClassChart(entities);
    renderGSITimeline(missions);
    renderLocationHeatmap(missions);
    renderTopEntities(missions, entities);
    renderActiveAgents(personnel, missions);
  }

  function renderKPIs(missions, entities, personnel) {
    const active = missions.filter(m => m.status === 'active').length;
    const completed = missions.filter(m => m.status === 'completed').length;
    const critical = missions.filter(m => m.priority === 'critical').length;
    const totalEvac = missions.reduce((s, m) => s + (m.civilianEvacuation || 0), 0);
    const avgGSI = (missions.reduce((s, m) => s + (m.gsi || 0), 0) / missions.length).toFixed(1);
    const casualtiesTotal = missions.reduce((s, m) => s + (m.casualties || 0), 0);

    const kpiEl = document.getElementById('stats-kpis');
    if (!kpiEl) return;

    kpiEl.innerHTML = [
      { label: '総案件数', value: missions.length, sub: `完了: ${completed}`, color: 'var(--primary)' },
      { label: '対応中', value: active, sub: `重大: ${critical}`, color: '#ef4444' },
      { label: '避難民総数', value: totalEvac.toLocaleString(), sub: '名', color: '#f59e0b' },
      { label: '平均GSI', value: avgGSI + '%', sub: `最高: ${Math.max(...missions.map(m => m.gsi || 0)).toFixed(1)}%`, color: '#8b5cf6' },
      { label: '登録実体数', value: entities.length, sub: `機密: ${entities.filter(e => e.classification === 'classified').length}`, color: '#ef4444' },
      { label: '在籍機関員', value: personnel.length, sub: `稼働中: ${personnel.filter(p => p.status === '任務遂行中').length}`, color: '#10b981' },
    ].map(k => `
      <div class="stat-kpi-card">
        <div class="stat-kpi-value" style="color:${k.color}">${k.value}</div>
        <div class="stat-kpi-label">${k.label}</div>
        <div class="stat-kpi-sub">${k.sub}</div>
      </div>
    `).join('');
  }

  function renderMissionStatusChart(missions) {
    const el = document.getElementById('mission-status-chart');
    if (!el) return;

    const counts = {};
    missions.forEach(m => { counts[m.status] = (counts[m.status] || 0) + 1; });

    const total = missions.length;
    const bars = Object.entries(counts).map(([status, count]) => {
      const pct = ((count / total) * 100).toFixed(1);
      const color = { active: '#ef4444', completed: '#10b981', failed: '#f59e0b', standby: '#6b7280' }[status] || '#6b7280';
      return `
        <div class="chart-bar-row">
          <div class="chart-bar-label">${STATUS_LABEL[status] || status}</div>
          <div class="chart-bar-track">
            <div class="chart-bar-fill" style="width:${pct}%;background:${color};"></div>
          </div>
          <div class="chart-bar-value">${count}件 (${pct}%)</div>
        </div>
      `;
    });

    el.innerHTML = bars.join('');
  }

  function renderEntityClassChart(entities) {
    const el = document.getElementById('entity-class-chart');
    if (!el) return;

    const counts = {};
    entities.forEach(e => { counts[e.classification] = (counts[e.classification] || 0) + 1; });

    const total = entities.length;
    const CLASS_LABELS = { safe: 'SAFE', caution: 'CAUTION', danger: 'DANGER', classified: 'CLASSIFIED' };
    const CLASS_COLORS = { safe: '#10b981', caution: '#f59e0b', danger: '#ef4444', classified: '#8b5cf6' };

    const bars = Object.entries(counts).map(([cls, count]) => {
      const pct = ((count / total) * 100).toFixed(1);
      return `
        <div class="chart-bar-row">
          <div class="chart-bar-label">${CLASS_LABELS[cls] || cls}</div>
          <div class="chart-bar-track">
            <div class="chart-bar-fill" style="width:${pct}%;background:${CLASS_COLORS[cls] || '#6b7280'};"></div>
          </div>
          <div class="chart-bar-value">${count}種 (${pct}%)</div>
        </div>
      `;
    });

    el.innerHTML = bars.join('');
  }

  function renderGSITimeline(missions) {
    const el = document.getElementById('gsi-timeline');
    if (!el) return;

    // Sort missions by start date
    const sorted = [...missions]
      .filter(m => m.gsi)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    if (sorted.length === 0) { el.innerHTML = '<p class="text-muted">データなし</p>'; return; }

    const maxGSI = Math.max(...sorted.map(m => m.gsi));
    const chartH = 120;

    const points = sorted.map((m, i) => {
      const x = (i / (sorted.length - 1)) * 100;
      const y = 100 - (m.gsi / maxGSI) * 100;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    const dotsSVG = sorted.map((m, i) => {
      const x = (i / (sorted.length - 1)) * 100;
      const y = 100 - (m.gsi / maxGSI) * 100;
      const color = m.gsi > 15 ? '#ef4444' : m.gsi > 7 ? '#f59e0b' : '#10b981';
      return `<circle cx="${x.toFixed(1)}%" cy="${y.toFixed(1)}%" r="3" fill="${color}" stroke="none">
        <title>${m.title}: GSI ${m.gsi}%</title>
      </circle>`;
    }).join('');

    el.innerHTML = `
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width:100%;height:${chartH}px;overflow:visible;">
        <defs>
          <linearGradient id="gsiGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="var(--primary)" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <polyline points="${points}" fill="none" stroke="var(--primary)" stroke-width="0.8" vector-effect="non-scaling-stroke"/>
        <polygon points="0,100 ${points} 100,100" fill="url(#gsiGrad)"/>
        ${dotsSVG}
      </svg>
      <div style="display:flex;justify-content:space-between;font-size:0.65rem;color:var(--muted-foreground);margin-top:0.25rem;">
        <span>${new Date(sorted[0].startDate).toLocaleDateString('ja-JP')}</span>
        <span>GSI推移</span>
        <span>${new Date(sorted[sorted.length-1].startDate).toLocaleDateString('ja-JP')}</span>
      </div>
    `;
  }

  function renderLocationHeatmap(missions) {
    const el = document.getElementById('location-stats');
    if (!el) return;

    const locationCount = {};
    missions.forEach(m => {
      const loc = m.location ? m.location.split(' ')[0].replace('区', '').replace('市', '') : '不明';
      locationCount[loc] = (locationCount[loc] || 0) + 1;
    });

    const sorted = Object.entries(locationCount).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const max = sorted[0]?.[1] || 1;

    el.innerHTML = sorted.map(([loc, count]) => {
      const w = (count / max * 100).toFixed(0);
      return `
        <div class="chart-bar-row">
          <div class="chart-bar-label">${loc}</div>
          <div class="chart-bar-track">
            <div class="chart-bar-fill" style="width:${w}%;background:var(--primary);opacity:${0.4 + count/max * 0.6};"></div>
          </div>
          <div class="chart-bar-value">${count}件</div>
        </div>
      `;
    }).join('');
  }

  function renderTopEntities(missions, entities) {
    const el = document.getElementById('top-entities');
    if (!el) return;

    const entityCount = {};
    missions.forEach(m => {
      if (m.entity) {
        const code = m.entity.match(/E-\d+/)?.[0];
        if (code) entityCount[code] = (entityCount[code] || 0) + 1;
      }
    });

    const sorted = Object.entries(entityCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

    el.innerHTML = `<table class="stats-table">
      <thead><tr><th>実体コード</th><th>実体名</th><th>案件数</th><th>脅威度</th></tr></thead>
      <tbody>
      ${sorted.map(([code, cnt]) => {
        const e = entities.find(e => e.code === code);
        const tcolor = { '高': '#ef4444', '中': '#f59e0b', '低': '#10b981' }[e?.threat] || '#6b7280';
        return `<tr>
          <td style="font-family:'JetBrains Mono',monospace;color:var(--primary)">${code}</td>
          <td>${e?.name || '不明'}</td>
          <td style="text-align:center">${cnt}</td>
          <td style="color:${tcolor};text-align:center">${e?.threat || '不明'}</td>
        </tr>`;
      }).join('')}
      </tbody>
    </table>`;
  }

  function renderActiveAgents(personnel, missions) {
    const el = document.getElementById('agent-division-chart');
    if (!el) return;

    const divCount = {};
    personnel.forEach(p => {
      const div = p.division?.split(' ')[0] || '不明';
      divCount[div] = (divCount[div] || 0) + 1;
    });

    const sorted = Object.entries(divCount).sort((a, b) => b[1] - a[1]);
    const max = sorted[0]?.[1] || 1;

    const divColors = {
      '収束部門': '#ef4444',
      '支援部門': '#10b981',
      '工作部門': '#3b82f6',
      '外縁部門': '#f59e0b',
    };

    el.innerHTML = sorted.map(([div, cnt]) => {
      const color = divColors[div] || 'var(--primary)';
      return `
        <div class="chart-bar-row">
          <div class="chart-bar-label">${div}</div>
          <div class="chart-bar-track">
            <div class="chart-bar-fill" style="width:${(cnt/max*100).toFixed(0)}%;background:${color};"></div>
          </div>
          <div class="chart-bar-value">${cnt}名</div>
        </div>
      `;
    }).join('');
  }

  // Kick off
  init();
})();
