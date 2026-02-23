// Auto-generated inline script for module-detail
(async function() {
    if (!ProgressSystem.checkPageAccess('module-detail.html')) {
      ModalSystem.warning('このページにアクセスするには LEVEL 2 が必要です。', 'ACCESS DENIED')
        .then(() => { Router.navigate('#/dashboard'); });
      return;
    }
    await Promise.all([
      window.CatalogData.whenReady(),
      window.MissionData.whenReady()
    ]);

    const id = new URLSearchParams(window.__getHashSearch ? window.__getHashSearch() : window.location.search).get('id');
    const mod = window.CatalogData.modules.find(m => m.id === id || m.code === id);

    if (!mod) {
      ModalSystem.error('指定されたモジュールが見つかりません。', 'NOT FOUND')
        .then(() => { Router.navigate('#/modules'); });
      return;
    }

    document.title = `${mod.name} - 海蝕機関`;
    ViewHistory.record('module', mod.id, mod.name);


    const CLASS_LABEL = { safe:'SAFE', caution:'CAUTION', danger:'DANGER', classified:'CLASSIFIED' };
    const STATUS_LABEL = { active:'対応中', monitoring:'監視中', completed:'収束済み', failed:'失敗' };
    const PRIORITY_LABEL = { critical:'重大', warning:'警戒', safe:'観察' };
    const ENERGY_CLASS = { '高':'energy-high', '中':'energy-mid', '低':'energy-low' };

    // Find related missions (by code match in modules array)
    const relatedMissions = window.MissionData.missions.filter(m =>
      m.modules && m.modules.some(mCode => mCode.startsWith(mod.code))
    );

    document.getElementById('moduleDetail').innerHTML = `
      <div class="module-header cls-${mod.classification}">
        <div class="module-header-inner">
          <div class="module-icon-wrap cls-${mod.classification}">
            <svg width="36" height="36" fill="none" stroke="white" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <div class="module-code-line">
            <span>${mod.id} / ${mod.code}</span>
            <span class="cls-badge cls-${mod.classification}">${CLASS_LABEL[mod.classification]}</span>
          </div>
          <div class="module-name">${mod.name}</div>
          <div class="module-developer">開発: ${mod.developer}</div>
          <div class="specs-grid">
            <div class="spec-item">
              <div class="spec-label">効果範囲</div>
              <div class="spec-value">${mod.range}</div>
            </div>
            <div class="spec-item">
              <div class="spec-label">持続時間</div>
              <div class="spec-value">${mod.duration}</div>
            </div>
            <div class="spec-item">
              <div class="spec-label">エネルギー消費</div>
              <div class="spec-value ${ENERGY_CLASS[mod.energy]||''}">${mod.energy}</div>
            </div>
            <div class="spec-item">
              <div class="spec-label">使用実績</div>
              <div class="spec-value">${relatedMissions.length} 件</div>
            </div>
          </div>
        </div>
      </div>

      <div class="tab-nav">
        <button class="tab-btn active" data-tab="overview">概要</button>
        <button class="tab-btn" data-tab="warning">警告・制限</button>
        <button class="tab-btn" data-tab="missions">使用実績 <span style="font-size:0.65rem;opacity:0.7;">(${relatedMissions.length})</span></button>
      </div>

      <div class="tab-content active" id="overview">
        <div class="detail-block">
          <div class="block-title">基本説明</div>
          <div class="detail-text">${mod.description}</div>
        </div>
        <div class="detail-block">
          <div class="block-title">技術詳細</div>
          <div class="detail-text">${mod.details}</div>
        </div>
      </div>

      <div class="tab-content" id="warning">
        <div class="warning-block">
          <div class="warning-label">⚠ 使用上の警告 / USAGE WARNING</div>
          <div class="detail-text">${mod.warning}</div>
        </div>
      </div>

      <div class="tab-content" id="missions">
        ${relatedMissions.length === 0
          ? `

    // ブックマークボタンを挿入
    (function() {
      var btn = BookmarkSystem.render('module', mod.id, mod.name);
      var titleEl = document.querySelector('.module-name');
      if (titleEl && titleEl.parentElement) {
        var wrap = document.createElement('div');
        wrap.style.cssText = 'display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-bottom:0.5rem;';
        titleEl.parentElement.insertBefore(wrap, titleEl);
        wrap.appendChild(titleEl);
        wrap.appendChild(btn);
      }
    })();<div class="no-related">記録された使用実績はありません</div>`
          : relatedMissions.map(m => `
            <a class="mission-ref-card" href="#/mission-detail?id=${m.id}">
              <div>
                <div class="mission-ref-id">${m.id}</div>
                <div class="mission-ref-title">${m.title}</div>
                <div class="mission-ref-sub">📍 ${m.location}</div>
              </div>
              <div class="mission-ref-badges">
                <span class="mini-badge mb-${m.status}">${STATUS_LABEL[m.status]||m.status}</span>
                <span class="mini-badge mb-${m.priority}">${PRIORITY_LABEL[m.priority]||m.priority}</span>
              </div>
            </a>`).join('')
        }
      </div>
    `;

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        document.getElementById(this.dataset.tab).classList.add('active');
      });
    });

    ProgressSystem.trackActivity('division_view');
  })();