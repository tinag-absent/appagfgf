// Auto-generated inline script for entity-detail
(async function() {
    if (!ProgressSystem.checkPageAccess('entity-detail.html')) {
      ModalSystem.warning('このページにアクセスするには LEVEL 2 が必要です。', 'ACCESS DENIED')
        .then(() => { Router.navigate('#/dashboard'); });
      return;
    }
    await Promise.all([
      window.CatalogData.whenReady(),
      window.MissionData.whenReady()
    ]);

    const id = new URLSearchParams(window.__getHashSearch ? window.__getHashSearch() : window.location.search).get('id');
    const entity = window.CatalogData.entities.find(e => e.id === id || e.code === id);

    if (!entity) {
      ModalSystem.error('指定された実体が見つかりません。', 'NOT FOUND')
        .then(() => { Router.navigate('#/entities'); });
      return;
    }

    document.title = `${entity.name} - 海蝕機関`;
    ViewHistory.record('entity', entity.id, entity.name);


    const CLASS_LABEL = { safe:'SAFE', caution:'CAUTION', danger:'DANGER', classified:'CLASSIFIED' };
    const THREAT_CLASS = { '高':'threat-high', '中':'threat-mid', '低':'threat-low' };
    const STATUS_LABEL = { active:'対応中', monitoring:'監視中', completed:'収束済み', failed:'失敗' };
    const PRIORITY_LABEL = { critical:'重大', warning:'警戒', safe:'観察' };

    // Find related missions
    const relatedMissions = window.MissionData.missions.filter(m =>
      m.entity && (m.entity.includes(entity.code) || m.entity.includes(entity.name))
    );

    const container = document.getElementById('entityDetail');
    container.innerHTML = `
      <div class="entity-header cls-${entity.classification}">
        <div class="entity-header-inner">
          <div class="entity-code-line">
            <span>${entity.id} / ${entity.code}</span>
            <span class="cls-badge cls-${entity.classification}">${CLASS_LABEL[entity.classification]}</span>
          </div>
          <div class="entity-name">${entity.name}</div>
          <div class="entity-origin">起源: ${entity.origin}</div>
          <div class="stat-chips">
            <div class="stat-chip">
              <div class="stat-chip-label">脅威度</div>
              <div class="stat-chip-value ${THREAT_CLASS[entity.threat] || ''}">${entity.threat}</div>
            </div>
            <div class="stat-chip">
              <div class="stat-chip-label">知性</div>
              <div class="stat-chip-value">${entity.intelligence}</div>
            </div>
            <div class="stat-chip">
              <div class="stat-chip-label">関連案件</div>
              <div class="stat-chip-value" style="color:var(--primary);">${relatedMissions.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="tab-nav">
        <button class="tab-btn active" data-tab="overview">概要</button>
        <button class="tab-btn" data-tab="behavior">行動パターン</button>
        <button class="tab-btn" data-tab="containment">収束プロトコル</button>
        <button class="tab-btn" data-tab="missions">関連案件 <span style="font-size:0.65rem;opacity:0.7;">(${relatedMissions.length})</span></button>
      </div>

      <!-- Overview -->
      <div class="tab-content active" id="overview">
        <div class="detail-block">
          <div class="block-title">基本情報</div>
          <div class="detail-text">${entity.description}</div>
        </div>
        <div class="detail-block">
          <div class="block-title">外見</div>
          <div class="detail-text">${entity.appearance}</div>
        </div>
      </div>

      <!-- Behavior -->
      <div class="tab-content" id="behavior">
        <div class="detail-block">
          <div class="block-title">行動パターン</div>
          <div class="detail-text">${entity.behavior}</div>
        </div>
      </div>

      <!-- Containment -->
      <div class="tab-content" id="containment">
        <div class="containment-block">
          <div class="containment-label">⚠ 収束プロトコル / CONTAINMENT PROCEDURE</div>
          <div class="detail-text">${entity.containment}</div>
        </div>
      </div>

      <!-- Related Missions -->
      <div class="tab-content" id="missions">
        ${relatedMissions.length === 0
          ? `

    // ブックマークボタンを挿入
    (function() {
      var btn = BookmarkSystem.render('entity', entity.id, entity.name);
      var titleEl = document.querySelector('.entity-name');
      if (titleEl && titleEl.parentElement) {
        var wrap = document.createElement('div');
        wrap.style.cssText = 'display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-bottom:0.5rem;';
        titleEl.parentElement.insertBefore(wrap, titleEl);
        wrap.appendChild(titleEl);
        wrap.appendChild(btn);
      }
    })();<div class="no-related">記録された関連案件はありません</div>`
          : relatedMissions.map(m => `
            <a class="mission-ref-card" href="#/mission-detail?id=${m.id}">
              <div class="mission-ref-id">${m.id}</div>
              <div class="mission-ref-title">${m.title}</div>
              <div class="mission-ref-badges">
                <span class="mini-badge mb-${m.status}">${STATUS_LABEL[m.status]||m.status}</span>
                <span class="mini-badge mb-${m.priority}">${PRIORITY_LABEL[m.priority]||m.priority}</span>
              </div>
            </a>`).join('')
        }
      </div>
    `;

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        document.getElementById(this.dataset.tab).classList.add('active');
      });
    });

    ProgressSystem.trackActivity('phenomenon_view');
  })();