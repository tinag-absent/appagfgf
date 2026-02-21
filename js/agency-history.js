// Agency History Page
(function () {
  'use strict';

  if (!ProgressSystem.checkPageAccess('agency-history.html')) {
    ModalSystem.warning('このページにアクセスするには LEVEL 1 が必要です。', 'ACCESS DENIED')
      .then(() => Router.navigate('#/dashboard'));
    return;
  }

  const userLevel = ProgressSystem.getUserData()?.level ?? 0;

  // ────────────────────────────────────────────
  // 歴史データ定義
  // ────────────────────────────────────────────
  const HISTORY = [
    {
      era: '設立前史',
      eraEn: 'PRE-HISTORY',
      eraColor: '#6b7280',
      entries: [
        {
          year: '1945',
          month: '終戦直後',
          title: '最初の記録',
          level: 0,
          tag: '発端',
          tagColor: '#6b7280',
          body: `終戦の混乱のなか、全国各地で「占領軍も憲兵隊も対処できない事案」が多発する。
                 帝国陸軍の旧研究者グループが非公式に調査を開始。
                 彼らの記録が後の機関創設の礎となった。`,
        },
        {
          year: '1952',
          month: '春',
          title: '大分地下研究班',
          level: 0,
          tag: '研究',
          tagColor: '#3b82f6',
          body: `物理学者・西堂 一郎（にしどう いちろう）を中心に、大分大学の地下室で
                 非公式な「次元異常研究班」が発足。当時は「幽霊現象の物理的解析」として
                 研究費を偽装していた。この研究班が後の工作部門の原型となる。`,
        },
        {
          year: '1961',
          month: '7月',
          title: '第一次 概念接触事案',
          level: 2,
          tag: '重大事案',
          tagColor: '#ef4444',
          body: `大分・中心部において、研究班メンバーが初めて「概念捕食者」と接触。
                 研究員2名が一時的な記憶喪失。この体験が「次元存在は研究対象ではなく
                 対処すべき脅威である」という認識を生み出した。
                 事案の詳細は現在も機密指定（解除年: 未定）。`,
          classified: true,
          classifiedLevel: 3,
        },
        {
          year: '1965',
          month: '2月',
          title: '政府への報告',
          level: 0,
          tag: '政治',
          tagColor: '#f59e0b',
          body: `西堂研究班が内閣官房に「特殊異常現象に関する極秘報告書」を提出。
                 当初は一笑に付されたが、同年11月に大分湾で大規模な次元異常が発生し、
                 政府は対応の必要性を認識。予算折衝が始まる。`,
        },
      ]
    },
    {
      era: '創設期',
      eraEn: 'FOUNDING ERA',
      eraColor: '#3b82f6',
      entries: [
        {
          year: '1968',
          month: '4月1日',
          title: '海蝕機関 創設',
          level: 0,
          tag: '創設',
          tagColor: '#10b981',
          highlight: true,
          body: `内閣官房直轄の極秘機関「特殊事案収束局」として正式発足。
                 初代局長・西堂 一郎が就任。職員数はわずか12名。
                 予算は「文化財保護特別費」に偽装された。
                 西堂局長の発言「海が岩を削るように、あれは静かに世界を喰う」が
                 機関名「海蝕機関」の由来となった。`,
        },
        {
          year: '1971',
          month: '秋',
          title: '初の収束作戦',
          level: 0,
          tag: '作戦',
          tagColor: '#ef4444',
          body: `北九州市小倉で発生した「影泳ぎ」の大量出現に対し、
                 機関が初めて組織的な収束作戦を実施。職員8名が参加し、
                 3日間の作戦の末に全個体の消滅を確認。
                 この作戦で得られた知見が現在の「近接収束プロトコル」の基礎となった。`,
        },
        {
          year: '1976',
          month: '3月',
          title: 'モジュール開発の始まり',
          level: 0,
          tag: '技術',
          tagColor: '#8b5cf6',
          body: `工作班（後の工作部門）が独自装備の開発に着手。
                 最初のモジュールは手製の「光波放射装置」——影泳ぎに有効な
                 強力光源装備で、現在のM-006の前身にあたる。
                 「敵を知り、道具を作れ」が工作班の初期モットーだった。`,
        },
      ]
    },
    {
      era: '拡張期',
      eraEn: 'EXPANSION',
      eraColor: '#8b5cf6',
      entries: [
        {
          year: '1984',
          month: '8月──',
          title: '桜川事件',
          level: 3,
          tag: '史上最大',
          tagColor: '#ef4444',
          highlight: true,
          classified: true,
          classifiedLevel: 3,
          body: `大分・中心部を舞台にした機関史上最初の「大規模概念災害」。
                 概念捕食者の個体が路線バス1台分の「記憶」を一括消費し、
                 乗客37名が同時に記憶喪失となった。
                 この事案を契機に機関は大幅増員され、専門部門体制が確立した。
                 「桜川事件収束プロトコル」は現在の標準対処マニュアルの根拠となっている。`,
        },
        {
          year: '1988',
          month: '──',
          title: '5部門体制の確立',
          level: 0,
          tag: '組織',
          tagColor: '#3b82f6',
          body: `それまで横断的だった組織を「収束・支援・工作・外縁・港湾」の5部門に再編。
                 各部門に専任部門長を置く現在の体制の原型が完成した。
                 職員数は約60名に増加。年間処理件数も20件を超えるようになった。`,
        },
        {
          year: '1995',
          month: '1月17日',
          title: '阪神淡路大震災と海蝕急増',
          level: 1,
          tag: '緊急対応',
          tagColor: '#f59e0b',
          body: `大地震に伴い次元境界の局所的薄化が多発。
                 機関は全職員を近畿地方に集中投入し、
                 通常の救助活動と並行して15件の海蝕事案を処理した。
                 「自然災害と次元異常の連動」が初めて公式に確認された事案として記録される。
                 外縁部門との警察・消防機関との情報共有プロトコルもこの時期に整備された。`,
        },
        {
          year: '1999',
          month: '大晦日',
          title: 'Y2K対応と次元共鳴事案',
          level: 2,
          tag: '特殊',
          tagColor: '#8b5cf6',
          classified: true,
          classifiedLevel: 3,
          body: `世紀末の「集合的不安」が次元境界を不安定化させた可能性が指摘される事案が
                 全国9ヶ所で同時発生。機関初の広域同時多発対応。
                 「人間の集合的感情がGSIに影響する」という仮説が提唱されたが、
                 現在も証明・否定いずれもされていない。`,
        },
      ]
    },
    {
      era: '近代化',
      eraEn: 'MODERNIZATION',
      eraColor: '#10b981',
      entries: [
        {
          year: '2003',
          month: '──',
          title: 'デジタル監視網の構築',
          level: 0,
          tag: '技術',
          tagColor: '#8b5cf6',
          body: `全国主要都市に電磁波・重力波・次元境界センサーを設置した
                 「次元異常早期探知網（DEAN）」が完成。
                 従来は目撃報告頼みだった検知が自動化され、
                 事案への初動対応時間が平均72分から18分に短縮された。`,
        },
        {
          year: '2011',
          month: '3月11日',
          title: '東日本大震災 ──大規模海蝕収束作戦',
          level: 1,
          tag: '史上最大級',
          tagColor: '#ef4444',
          highlight: true,
          body: `M9.0の巨大地震と津波が次元境界を広域にわたって不安定化。
                 被災地において35件以上の海蝕事案が同時進行した。
                 機関は全部門を投入し、日本赤十字・自衛隊との
                 極秘協力体制のもとで作戦を遂行した。
                 この経験が「大規模災害時の機関行動指針」の制定につながった。`,
        },
        {
          year: '2018',
          month: '──',
          title: '第二世代モジュール開発完了',
          level: 0,
          tag: '技術',
          tagColor: '#8b5cf6',
          body: `工作部門による10年越しの研究開発プロジェクトが結実。
                 現行の M-001 から M-020 シリーズが完成した。
                 特に概念固定アンカー（M-019）の完成は
                 「概念系実体への決定的対処手段」として高く評価された。`,
        },
        {
          year: '2020',
          month: '春',
          title: 'コロナ禍と次元孤立化',
          level: 2,
          tag: '特殊',
          tagColor: '#8b5cf6',
          classified: true,
          classifiedLevel: 3,
          body: `世界的なパンデミックの影響で人の往来が激減し、
                 次元境界は逆説的に「安定化」した一方、
                 特定の閉鎖空間（病院・施設等）では異常な高濃度の次元活動が観測された。
                 「孤立した意識の集積が局所的次元薄化を促す」という新仮説が提唱された。`,
        },
      ]
    },
    {
      era: '現代',
      eraEn: 'PRESENT',
      eraColor: '#ef4444',
      entries: [
        {
          year: '2025',
          month: '12月25日',
          title: '別府駅前次元亀裂封鎖作戦 ──木村 聡 殉職',
          level: 0,
          tag: '追悼事案',
          tagColor: '#ef4444',
          highlight: true,
          classified: true,
          classifiedLevel: 3,
          body: `クリスマスの深夜、別府駅北口広場にGSI 24.7（機関史上最高値）を記録する
                 巨大な空間裂目が出現。収束部門 第1・第2班、工作部門、支援部門の全力を投じた
                 9時間の収束作戦の末に民間被害ゼロで封鎖に成功したが、
                 機関員・木村 聡（K-012-089）が近接作業中に裂目の引力増大により殉職。
                 木村が携行していた緊急退避装置（M-014-ξ）の放出エネルギーが
                 最終収束の決定打となったことが後の解析で判明した。
                 毎年12月26日は機関記念日として全機関員が黙祷を捧げる。`,
        },
        {
          year: '2025',
          month: '11月',
          title: '宇佐神宮 空間裂目事案',
          level: 1,
          tag: '重大事案',
          tagColor: '#ef4444',
          body: `梅田地下街で機関史上最大級のGSI 28.4を記録する空間裂目が出現。
                 全部門を投入した2日間の収束作戦で市民4,500名が避難した。
                 機関員・木村 聡が負傷（後に回復）。
                 大分県警との情報統制協力が完璧に機能した事案として評価される。`,
        },
        {
          year: '2025',
          month: '12月',
          title: '摩周湖 鏡面侵食体 大量発生',
          level: 1,
          tag: '事案',
          tagColor: '#f59e0b',
          body: `北海道・摩周湖において47体の鏡面侵食体が発生。
                 冬季の低気圧と次元境界の相関が初めて定量的に記録された。
                 摩周湖周辺は以降、機関の定期観察ポイントに指定された。`,
        },
        {
          year: '2026',
          month: '現在',
          title: 'GSI上昇傾向──新局面へ',
          level: 0,
          tag: '現在進行形',
          tagColor: '#ef4444',
          highlight: true,
          body: `全球平均GSI値は3.2%（2026年2月現在）。
                 過去10年で平均1.8%の上昇が確認されており、
                 支援部門・鈴木主任分析官が警鐘を鳴らしている。
                 九重山脈研究施設での概念捕食者脱走（2月16日）や
                 大分市地下街の長期潜伏事案（2月12日〜）など、
                 複数の重大事案が同時進行する「多重危機」状態が続いている。
                 機関は増員・設備拡充を急ぐが、次元の浸食は止まらない。`,
        },
      ]
    },
  ];

  // ────────────────────────────────────────────
  // レンダリング
  // ────────────────────────────────────────────
  function render() {
    const root = document.getElementById('history-root');
    if (!root) return;

    root.innerHTML = HISTORY.map((era, ei) => `
      <section class="ah-era" style="--era-color: ${era.eraColor}; animation-delay: ${ei * 0.08}s">
        <div class="ah-era-header">
          <div class="ah-era-badge" style="color: ${era.eraColor}; border-color: ${era.eraColor}40">
            ${era.eraEn}
          </div>
          <div class="ah-era-title">${era.era}</div>
          <div class="ah-era-line"></div>
        </div>

        <div class="ah-entries">
          ${era.entries.map((e, i) => renderEntry(e, i)).join('')}
        </div>
      </section>
    `).join('');

    // Intersection Observer でスクロールアニメーション
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('ah-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.ah-entry').forEach(el => observer.observe(el));
  }

  function renderEntry(e, idx) {
    const isLocked = e.classified && userLevel < e.classifiedLevel;
    const highlightStyle = e.highlight
      ? 'border-color: var(--era-color, var(--primary)); box-shadow: 0 0 24px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.04);'
      : '';

    const bodyContent = isLocked
      ? `<div class="ah-redacted-block">
           <div class="ah-redacted-line"></div>
           <div class="ah-redacted-line" style="width:85%"></div>
           <div class="ah-redacted-line" style="width:92%"></div>
           <div class="ah-redacted-line" style="width:78%"></div>
           <div class="ah-redact-label">CLASSIFIED // LEVEL ${e.classifiedLevel} REQUIRED</div>
         </div>`
      : `<p class="ah-body">${e.body}</p>`;

    return `
      <div class="ah-entry" style="animation-delay: ${idx * 0.06}s">
        <div class="ah-connector">
          <div class="ah-year-badge">${e.year}</div>
          <div class="ah-dot ${e.highlight ? 'ah-dot--highlight' : ''}"></div>
          <div class="ah-vline"></div>
        </div>
        <div class="ah-card ${e.highlight ? 'ah-card--highlight' : ''}" style="${highlightStyle}">
          <div class="ah-card-top">
            <div class="ah-month">${e.month}</div>
            <span class="ah-tag" style="color: ${e.tagColor}; border-color: ${e.tagColor}40; background: ${e.tagColor}10">${e.tag}</span>
          </div>
          <div class="ah-title">${e.title}</div>
          ${bodyContent}
          ${isLocked ? `<div class="ah-lock-note">権限レベル不足 — LEVEL ${e.classifiedLevel} で解除</div>` : ''}
        </div>
      </div>
    `;
  }

  ProgressSystem.trackActivity('phenomenon_view');
  render();
})();
