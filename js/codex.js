// World Codex Page
(function() {
  if (!ProgressSystem.checkPageAccess('codex.html')) {
    ModalSystem.warning('このページにアクセスするには LEVEL 1 が必要です。', 'ACCESS DENIED')
      .then(() => Router.navigate('#/dashboard'));
    return;
  }

  const CODEX_ENTRIES = [
    {
      id: 'kaishoku',
      title: '海蝕とは何か',
      icon: '🌊',
      level: 0,
      accent: 'var(--primary)',
      summary: '階宙次元が物理世界を「侵食」する現象の総称。',
      content: `
        <h2>海蝕（かいしょく）とは</h2>
        <p>「海蝕」とは、私たちの世界（一次元素材次元）に隣接する「<strong style="color:var(--primary)">階宙次元</strong>」と呼ばれる並行次元空間が、物理的現実に干渉・侵食する現象の総称です。</p>
        <h3>現象の概要</h3>
        <p>海蝕現象は次元境界の「薄さ」に起因します。通常、両次元の境界は安定していますが、様々な要因により境界が弱体化すると、次元間の相互干渉が生じます。</p>
        <ul>
          <li>次元境界の薄化（自然発生・人為的）</li>
          <li>階宙実体の侵入と物理世界への影響</li>
          <li>物理法則の局所的な破綻（GSI値上昇）</li>
          <li>人間の認識・記憶・感覚への干渉</li>
        </ul>
        <h3>なぜ「海蝕」という名称か</h3>
        <p>海が岩を削るように、階宙次元は静かに、しかし確実に物理現実を浸食していきます。機関設立当初の研究者が「岩に打ち寄せる波のような干渉」と表現したことに由来します。</p>
      `
    },
    {
      id: 'kaichu',
      title: '階宙次元',
      icon: '∞',
      level: 1,
      accent: '#8b5cf6',
      summary: '物理世界に隣接する並行次元空間。無数の「層」から構成される。',
      content: `
        <h2>階宙次元（かいちゅうじげん）</h2>
        <p>階宙次元は、私たちが生きる物理空間に重なって存在する、別の法則に基づいた次元空間です。単一の空間ではなく、「無数の層から成る重層的な次元群」と理解されています。</p>
        <h3>物理法則の違い</h3>
        <ul>
          <li>時間が一方向に流れない（逆行・分岐が存在する）</li>
          <li>質量・エネルギー保存則が適用されない領域がある</li>
          <li>意識・記憶・感情が物質的実体を持つ</li>
          <li>論理的概念が「物体」として存在する</li>
        </ul>
        <h3>階宙次元の「住民」</h3>
        <p>この次元には多様な生命体・知性体・現象体が存在します。これらを機関では「<strong style="color:var(--primary)">海蝕実体</strong>」と総称します。多くは無害ですが、物理世界と接触することで予期しない影響を与えます。</p>
        <h3>境界の薄い場所</h3>
        <p>次元境界には「薄い場所」と「厚い場所」があります。薄い場所では実体が侵入しやすく、海蝕現象が頻発します。日本列島は地政学的・地質学的要因から特に境界が薄い地域とされています。</p>
      `
    },
    {
      id: 'gsi',
      title: 'GSI（世界安定指数）',
      icon: '📊',
      level: 0,
      accent: '#ef4444',
      summary: '物理世界の安定度を示す重要指標。現在: 3.2%。',
      content: `
        <h2>GSI（Global Stability Index）</h2>
        <p>GSIは「世界安定指数」と訳される、次元境界の安定度を示す主要指標です。機関の監視システムが算出するこの数値は、地球規模の次元安定度の「逆数」として機能します。</p>
        <h3>数値の意味</h3>
        <ul>
          <li><strong style="color:#10b981">0-5%</strong>：安定領域。通常の海蝕活動レベル</li>
          <li><strong style="color:#f59e0b">5-15%</strong>：警戒領域。大規模事案の頻発に注意</li>
          <li><strong style="color:#ef4444">15-30%</strong>：危機領域。次元境界の大規模崩壊リスク</li>
          <li><strong style="color:#8b5cf6">30%以上</strong>：崩壊域。取り返しのつかない影響の可能性</li>
        </ul>
        <h3>局所GSIと全球GSI</h3>
        <p>各事案報告のGSI値は「局所GSI」（特定地点の安定度）を示します。機関トップページに表示される「3.2%」は現在の全球平均GSI値です。</p>
        <h3>GSIの上昇要因</h3>
        <ul>
          <li>大規模な海蝕実体の活動</li>
          <li>人為的な次元干渉実験</li>
          <li>未知の自然的サイクル（11年周期説あり）</li>
          <li>月の引力との相関（満月時に上昇傾向）</li>
        </ul>
      `
    },
    {
      id: 'agency',
      title: '機関の歴史',
      icon: '🏛',
      level: 1,
      accent: '#f59e0b',
      summary: '1968年設立。最初の海蝕事案から半世紀以上の記録。',
      content: `
        <h2>海蝕機関の歴史</h2>
        <h3>設立前史（1945-1967）</h3>
        <p>第二次世界大戦後の混乱期、日本各地で「説明のつかない事案」が多発しました。当初は精神医学的・宗教的解釈がなされましたが、1960年代に入り、物理学・心理学・情報学の研究者らが科学的調査を開始します。</p>
        <h3>機関設立（1968年）</h3>
        <p>1968年、政府の極秘認可のもと「特殊事案収束局」として発足。初代局長の命名により「海蝕機関」と通称されるようになります。設立当初の職員は わずか12名でした。</p>
        <h3>第1次大規模事案（1984年）</h3>
        <p>大分市中心部を舞台にした「桜川事件」（機密指定）。機関史上初の「概念捕食者」との遭遇記録。この事案が現在の収容・収束プロトコルの原型を作りました。</p>
        <h3>現在（2026年）</h3>
        <p>全国に5拠点、在籍機関員は約200名（公式記録）。年間処理事案数は約150件。GSI値は過去10年で平均1.8%上昇しており、増加傾向に対応するため体制の強化が続いています。</p>
      `
    },
    {
      id: 'classification',
      title: '実体分類体系',
      icon: '🗂',
      level: 2,
      accent: '#10b981',
      summary: 'SAFE / CAUTION / DANGER / CLASSIFIED の4分類。',
      content: `
        <h2>実体分類体系</h2>
        <p>機関は確認された全ての海蝕実体を4段階で分類します。この分類は対処方針の基礎となります。</p>
        <h3>SAFE（安全）</h3>
        <p>人間・物理環境への危害が認められない、または極めて低い実体。接触しても即座の影響はないが、継続的な観察は必要。漂流者、次元の錨などが該当。</p>
        <h3>CAUTION（注意）</h3>
        <p>条件次第で危害を与える可能性のある実体。物理的ダメージより認識・記憶・感覚への干渉が多い。適切な装備と手順で対処可能。波喰い、感覚置換体などが該当。</p>
        <h3>DANGER（危険）</h3>
        <p>積極的に人間や物理環境に危害を与える実体。専門的な収束プロトコルが必要。不適切な対処は機関員の重篤な被害につながる。概念捕食者、言葉喰らいなどが該当。</p>
        <h3>CLASSIFIED（機密）</h3>
        <p>危険性の評価が困難か、上位権限者のみが閲覧可能な情報を持つ実体。存在の公知は機関内でも制限される。確率の子などが該当。</p>
      `
    },
    {
      id: 'modules',
      title: 'モジュール体系',
      icon: '⚙️',
      level: 2,
      accent: '#3b82f6',
      summary: '工作部門が開発・整備する収束装備の総称。',
      content: `
        <h2>モジュール体系</h2>
        <p>機関の現場機関員が使用する特殊装備を「モジュール」と総称します。すべてのモジュールは工作部門が開発・製造・整備を担当し、コードによって管理されます。</p>
        <h3>命名規則</h3>
        <p>M-[番号]-[ギリシャ文字] という形式です。番号は機能カテゴリ（001-010: 空間系、011-020: 情報系等）を示し、ギリシャ文字は世代・改良型を示します。</p>
        <h3>使用資格制度</h3>
        <p>危険度の高いモジュールには使用資格が必要です。S/A/AA/AAA の4段階で、最上位のAAAは特定モジュールの専門訓練を完了した機関員にのみ付与されます。</p>
        <h3>現場での原則</h3>
        <ul>
          <li>単独使用禁止（複数名でのチーム運用）</li>
          <li>使用前後の機能確認必須</li>
          <li>連続使用時間の制限遵守</li>
          <li>事案報告書への使用記録記載義務</li>
        </ul>
      `
    }
  ];

  window.__codexEntries = CODEX_ENTRIES;

  let activeEntry = null;

  function render() {
    const container = document.getElementById('codex-container');
    if (!container) return;

    container.innerHTML = `
      <div class="codex-grid" id="codex-grid"></div>
      <div id="codex-detail"></div>
    `;

    const grid = document.getElementById('codex-grid');
    grid.innerHTML = CODEX_ENTRIES.map(e => `
      <div class="codex-card" data-id="${e.id}" style="--card-accent:${e.accent}" onclick="window.__codexShow('${e.id}')">
        <div class="codex-card-icon">${e.icon}</div>
        <div class="codex-card-title">${e.title}</div>
        <div class="codex-card-desc">${e.summary}</div>
        <div class="codex-card-level">必要レベル: ${e.level}</div>
      </div>
    `).join('');
  }

  window.__codexShow = function(id) {
    const entry = CODEX_ENTRIES.find(e => e.id === id);
    if (!entry) return;
    
    const userLevel = ProgressSystem.getUserData()?.level || 0;
    if (userLevel < entry.level) {
      ModalSystem.warning(`このエントリの閲覧には LEVEL ${entry.level} が必要です。`, 'アクセス制限');
      return;
    }

    const el = document.getElementById('codex-detail');
    el.innerHTML = `
      <div class="codex-content" style="border-color: ${entry.accent}">
        <button onclick="document.getElementById('codex-detail').innerHTML=''" 
          style="float:right;background:none;border:1px solid var(--border);color:var(--muted-foreground);cursor:pointer;padding:0.25rem 0.75rem;border-radius:0.25rem;font-size:0.75rem;">
          ✕ 閉じる
        </button>
        ${entry.content}
      </div>
    `;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  ProgressSystem.trackActivity('phenomenon_view');
  render();
})();
