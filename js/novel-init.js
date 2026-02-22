// ── 海蝕機関 記録文庫 ── Novel browser (SPA-compatible)
(function () {
  'use strict';

  /* ─ state ─ */
  var novels = [];
  var filtered = [];
  var activeCategory = 'all';
  var currentNovel = null;

  /* ─ style tokens ─ */
  var CAT = {
    '作戦記録':     { bg:'rgba(239,68,68,.12)',   border:'rgba(239,68,68,.4)',   text:'rgb(239,68,68)' },
    '実体接触記録': { bg:'rgba(16,185,129,.12)',  border:'rgba(16,185,129,.4)',  text:'rgb(16,185,129)' },
    '内部記録':     { bg:'rgba(0,255,255,.10)',   border:'rgba(0,255,255,.35)',  text:'var(--primary)' },
    '人物記録':     { bg:'rgba(168,85,247,.12)',  border:'rgba(168,85,247,.4)',  text:'rgb(168,85,247)' },
    '個人記録':     { bg:'rgba(245,158,11,.12)',  border:'rgba(245,158,11,.4)',  text:'rgb(245,158,11)' },
  };
  var SEC_LABEL = {1:'公開', 2:'機密', 3:'極秘'};
  var SEC_COLOR = {1:'rgb(16,185,129)', 2:'rgb(245,158,11)', 3:'rgb(239,68,68)'};

  /* ─ helpers ─ */
  function $ (id) { return document.getElementById(id); }

  function span (text, style) {
    return '<span style="' + style + '">' + text + '</span>';
  }

  function badge (label, bg, border, color) {
    return '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.6rem;' +
      'padding:.2rem .55rem;background:' + bg + ';border:1px solid ' + border +
      ';color:' + color + ';letter-spacing:.06em;text-transform:uppercase;">' + label + '</span>';
  }

  function setView (id) {
    ['novelListView','novelReaderView'].forEach(function (v) {
      var el = $(v);
      if (el) el.style.display = (v === id) ? 'block' : 'none';
    });
  }

  /* ─ category filter buttons ─ */
  function activateFilter (cat) {
    activeCategory = cat;
    document.querySelectorAll('[data-novel-cat]').forEach(function (btn) {
      var active = btn.getAttribute('data-novel-cat') === cat;
      btn.style.background    = active ? 'rgba(0,255,255,.1)'   : 'transparent';
      btn.style.borderColor   = active ? 'rgba(0,255,255,.4)'   : 'rgba(255,255,255,.1)';
      btn.style.color         = active ? 'var(--primary)'       : 'rgba(255,255,255,.5)';
    });
    filtered = cat === 'all' ? novels : novels.filter(function (n) { return n.category === cat; });
    renderGrid(filtered);
  }

  /* ─ list view ─ */
  function renderGrid (list) {
    var grid = $('novelGrid');
    if (!grid) return;

    if (list.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:4rem;color:var(--muted-foreground);font-family:\'JetBrains Mono\',monospace;font-size:.8rem;">— 該当する記録はありません —</div>';
      return;
    }

    grid.innerHTML = list.map(function (n) {
      var cat = CAT[n.category] || CAT['内部記録'];
      var secColor = SEC_COLOR[n.securityLevel] || SEC_COLOR[1];
      var secLabel = SEC_LABEL[n.securityLevel] || '公開';

      return '<div class="novel-card" data-id="' + n.id + '" style="' +
        'background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.07);' +
        'padding:1.5rem;cursor:pointer;transition:border-color .2s,background .2s;' +
        'display:flex;flex-direction:column;gap:.75rem;position:relative;overflow:hidden;">' +

        // top bar
        '<div style="display:flex;justify-content:space-between;align-items:center;">' +
          badge(n.category, cat.bg, cat.border, cat.text) +
          '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.6rem;color:' + secColor + ';">▮ ' + secLabel + '</span>' +
        '</div>' +

        // title block
        '<div>' +
          '<h3 style="font-family:\'Space Grotesk\',sans-serif;font-size:1.05rem;font-weight:700;color:white;margin:0 0 .25rem;">' + n.title + '</h3>' +
          '<p style="font-size:.75rem;color:var(--muted-foreground);font-style:italic;margin:0;">' + n.subtitle + '</p>' +
        '</div>' +

        // summary
        '<p style="font-size:.8rem;color:rgba(255,255,255,.55);line-height:1.65;margin:0;flex:1;">' + n.summary + '</p>' +

        // footer
        '<div style="display:flex;justify-content:space-between;align-items:center;padding-top:.75rem;border-top:1px solid rgba(255,255,255,.06);">' +
          '<div style="display:flex;gap:.35rem;flex-wrap:wrap;">' +
            n.tags.slice(0,3).map(function (t) {
              return '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.58rem;padding:.1rem .45rem;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);color:rgba(255,255,255,.4);">#' + t + '</span>';
            }).join('') +
          '</div>' +
          '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.6rem;color:rgba(255,255,255,.3);">' + n.chapters.length + ' ch.</span>' +
        '</div>' +

        // hover accent bar (bottom)
        '<div style="position:absolute;bottom:0;left:0;right:0;height:2px;background:linear-gradient(90deg,' + cat.border + ',transparent);opacity:0;transition:opacity .2s;" class="novel-card-accent"></div>' +
      '</div>';
    }).join('');

    // events
    grid.querySelectorAll('.novel-card').forEach(function (card) {
      card.addEventListener('mouseenter', function () {
        this.style.borderColor = 'rgba(0,255,255,.25)';
        this.style.background  = 'rgba(0,255,255,.03)';
        var accent = this.querySelector('.novel-card-accent');
        if (accent) accent.style.opacity = '1';
      });
      card.addEventListener('mouseleave', function () {
        this.style.borderColor = 'rgba(255,255,255,.07)';
        this.style.background  = 'rgba(0,0,0,.45)';
        var accent = this.querySelector('.novel-card-accent');
        if (accent) accent.style.opacity = '0';
      });
      card.addEventListener('click', function () {
        var id = this.getAttribute('data-id');
        var novel = novels.find(function (n) { return n.id === id; });
        if (novel) openReader(novel);
      });
    });

    // count
    var countEl = $('novelCount');
    if (countEl) countEl.textContent = list.length;
  }

  /* ─ reader view ─ */
  function openReader (novel) {
    currentNovel = novel;

    // XP tracking
    if (window.ProgressSystem) {
      try { ProgressSystem.trackActivity('phenomenon_view'); } catch (e) {}
    }

    buildReaderHeader(novel);
    buildChapterNav(novel);
    showChapter(novel, 0);
    buildRelated(novel);
    setView('novelReaderView');
    window.scrollTo(0, 0);
  }

  function buildReaderHeader (novel) {
    var el = $('readerHeader');
    if (!el) return;
    var cat = CAT[novel.category] || CAT['内部記録'];
    var secColor = SEC_COLOR[novel.securityLevel] || SEC_COLOR[1];
    var secLabel = SEC_LABEL[novel.securityLevel] || '公開';

    el.innerHTML =
      '<div style="display:flex;gap:.6rem;align-items:center;flex-wrap:wrap;margin-bottom:1rem;">' +
        badge(novel.category, cat.bg, cat.border, cat.text) +
        '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.6rem;color:' + secColor + ';">▮ ' + secLabel + '</span>' +
        '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.6rem;color:var(--muted-foreground);">' + novel.date + '</span>' +
      '</div>' +
      '<h1 style="font-family:\'Space Grotesk\',sans-serif;font-size:1.9rem;font-weight:700;color:white;line-height:1.2;margin:0 0 .4rem;">' + novel.title + '</h1>' +
      '<p style="font-size:.85rem;color:var(--muted-foreground);font-style:italic;margin:0 0 .5rem;">' + novel.subtitle + '</p>' +
      '<p style="font-family:\'JetBrains Mono\',monospace;font-size:.68rem;color:rgba(255,255,255,.35);">著: ' + novel.author + '</p>';
  }

  function buildChapterNav (novel) {
    var nav = $('chapterNav');
    if (!nav) return;
    nav.innerHTML = novel.chapters.map(function (ch, i) {
      return '<button class="ch-btn" data-ch="' + i + '" style="' +
        'display:block;width:100%;text-align:left;padding:.55rem .75rem;margin-bottom:.2rem;' +
        'background:' + (i===0?'rgba(0,255,255,.1)':'transparent') + ';' +
        'border:1px solid ' + (i===0?'rgba(0,255,255,.3)':'rgba(255,255,255,.06)') + ';' +
        'color:' + (i===0?'var(--primary)':'rgba(255,255,255,.5)') + ';' +
        'font-family:\'JetBrains Mono\',monospace;font-size:.65rem;cursor:pointer;transition:all .2s;line-height:1.4;">' +
        '<div style="opacity:.4;font-size:.55rem;margin-bottom:.15rem;">CH.' + String(i+1).padStart(2,'0') + '</div>' +
        ch.title +
        '</button>';
    }).join('');

    nav.querySelectorAll('.ch-btn').forEach(function (btn) {
      btn.addEventListener('mouseenter', function () {
        if (this.getAttribute('data-active') !== 'true') {
          this.style.borderColor = 'rgba(0,255,255,.15)';
          this.style.color = 'rgba(255,255,255,.8)';
        }
      });
      btn.addEventListener('mouseleave', function () {
        if (this.getAttribute('data-active') !== 'true') {
          this.style.borderColor = 'rgba(255,255,255,.06)';
          this.style.color = 'rgba(255,255,255,.5)';
        }
      });
      btn.addEventListener('click', function () {
        showChapter(currentNovel, parseInt(this.getAttribute('data-ch')));
      });
    });
  }

  function setNavActive (idx) {
    document.querySelectorAll('.ch-btn').forEach(function (btn, i) {
      var active = (i === idx);
      btn.setAttribute('data-active', active ? 'true' : 'false');
      btn.style.background   = active ? 'rgba(0,255,255,.1)'  : 'transparent';
      btn.style.borderColor  = active ? 'rgba(0,255,255,.3)'  : 'rgba(255,255,255,.06)';
      btn.style.color        = active ? 'var(--primary)'      : 'rgba(255,255,255,.5)';
    });
  }

  function showChapter (novel, idx) {
    setNavActive(idx);
    var ch = novel.chapters[idx];
    if (!ch) return;

    var content = $('chapterContent');
    if (!content) return;

    // Fade
    content.style.opacity = '0';
    content.style.transition = 'opacity .2s';
    setTimeout(function () {
      content.innerHTML = buildChapterHTML(novel, ch, idx);
      content.style.opacity = '1';
      // Wire prev/next buttons
      var prev = $('chPrev'), next = $('chNext');
      if (prev) prev.addEventListener('click', function () { showChapter(novel, idx-1); $('chapterContent').scrollIntoView({behavior:'smooth',block:'start'}); });
      if (next) next.addEventListener('click', function () { showChapter(novel, idx+1); $('chapterContent').scrollIntoView({behavior:'smooth',block:'start'}); });
    }, 200);
  }

  function buildChapterHTML (novel, ch, idx) {
    // Convert text to HTML paragraphs
    var paras = ch.content.split('\n\n').map(function (p) {
      p = p.trim();
      if (!p) return '';
      var isDialogue = /^「|^──/.test(p);
      var style = 'margin-bottom:1.5rem;line-height:1.95;font-size:.92rem;' +
        (isDialogue
          ? 'color:rgba(200,230,255,.9);padding-left:1rem;border-left:2px solid rgba(0,255,255,.25);'
          : 'color:rgba(255,255,255,.82);');
      return '<p style="' + style + '">' + p.replace(/\n/g,'<br>') + '</p>';
    }).join('');

    var hasPrev = idx > 0;
    var hasNext = idx < novel.chapters.length - 1;

    return (
      // chapter header
      '<div style="margin-bottom:2.5rem;padding-bottom:1.25rem;border-bottom:1px solid rgba(255,255,255,.08);">' +
        '<div style="font-family:\'JetBrains Mono\',monospace;font-size:.58rem;color:var(--muted-foreground);letter-spacing:.12em;margin-bottom:.5rem;">CHAPTER ' + String(idx+1).padStart(2,'0') + '</div>' +
        '<h2 style="font-family:\'Space Grotesk\',sans-serif;font-size:1.35rem;font-weight:700;color:white;margin:0;">' + ch.title + '</h2>' +
      '</div>' +

      // body
      '<div style="max-width:62ch;">' + paras + '</div>' +

      // nav
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:3rem;padding-top:1.5rem;border-top:1px solid rgba(255,255,255,.07);">' +
        (hasPrev
          ? '<button id="chPrev" style="font-family:\'JetBrains Mono\',monospace;font-size:.72rem;padding:.5rem 1.1rem;background:transparent;border:1px solid rgba(255,255,255,.12);color:rgba(255,255,255,.5);cursor:pointer;transition:all .2s;" onmouseover="this.style.borderColor=\'rgba(255,255,255,.3)\';this.style.color=\'white\'" onmouseout="this.style.borderColor=\'rgba(255,255,255,.12)\';this.style.color=\'rgba(255,255,255,.5)\'">← ' + novel.chapters[idx-1].title + '</button>'
          : '<span></span>') +
        (hasNext
          ? '<button id="chNext" style="font-family:\'JetBrains Mono\',monospace;font-size:.72rem;padding:.5rem 1.25rem;background:rgba(0,255,255,.07);border:1px solid rgba(0,255,255,.3);color:var(--primary);cursor:pointer;transition:all .2s;" onmouseover="this.style.background=\'rgba(0,255,255,.14)\'" onmouseout="this.style.background=\'rgba(0,255,255,.07)\'">' + novel.chapters[idx+1].title + ' →</button>'
          : '<div style="font-family:\'JetBrains Mono\',monospace;font-size:.68rem;color:rgba(16,185,129,.7);letter-spacing:.12em;">── FIN ──</div>') +
      '</div>'
    );
  }

  function buildRelated (novel) {
    var el = $('relatedData');
    if (!el) return;

    var html = '';

    if (novel.relatedPersonnel && novel.relatedPersonnel.length) {
      html += relatedSection('関連人員', novel.relatedPersonnel.map(function (id) {
        return '<a href="#/personnel-detail?id=' + id + '" style="display:block;font-family:\'JetBrains Mono\',monospace;font-size:.68rem;color:var(--primary);text-decoration:none;padding:.35rem 0;border-bottom:1px solid rgba(255,255,255,.05);transition:color .15s;" onmouseover="this.style.color=\'white\'" onmouseout="this.style.color=\'var(--primary)\'">' + id + '</a>';
      }).join(''));
    }
    if (novel.relatedEntities && novel.relatedEntities.length) {
      html += relatedSection('関連実体', novel.relatedEntities.map(function (id) {
        return '<a href="#/entity-detail?id=' + id.toLowerCase().replace(/[^a-z0-9]/g,'') + '" style="display:block;font-family:\'JetBrains Mono\',monospace;font-size:.68rem;color:rgb(168,85,247);text-decoration:none;padding:.35rem 0;border-bottom:1px solid rgba(255,255,255,.05);transition:color .15s;" onmouseover="this.style.color=\'white\'" onmouseout="this.style.color=\'rgb(168,85,247)\'">' + id + '</a>';
      }).join(''));
    }
    if (novel.relatedMissions && novel.relatedMissions.length) {
      html += relatedSection('関連任務', novel.relatedMissions.map(function (id) {
        return '<a href="#/mission-detail?id=' + id + '" style="display:block;font-family:\'JetBrains Mono\',monospace;font-size:.68rem;color:rgb(239,68,68);text-decoration:none;padding:.35rem 0;border-bottom:1px solid rgba(255,255,255,.05);transition:color .15s;" onmouseover="this.style.color=\'white\'" onmouseout="this.style.color=\'rgb(239,68,68)\'">' + id + '</a>';
      }).join(''));
    }

    el.innerHTML = html || '<p style="font-size:.75rem;color:var(--muted-foreground);">関連データなし</p>';
  }

  function relatedSection (title, innerHtml) {
    return '<div style="margin-bottom:1.25rem;">' +
      '<div style="font-family:\'JetBrains Mono\',monospace;font-size:.58rem;color:var(--muted-foreground);letter-spacing:.1em;margin-bottom:.5rem;text-transform:uppercase;">' + title + '</div>' +
      innerHtml +
    '</div>';
  }

  /* ─ wire filter buttons ─ */
  document.querySelectorAll('[data-novel-cat]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      activateFilter(this.getAttribute('data-novel-cat'));
    });
  });

  /* ─ back button ─ */
  var backBtn = $('backToList');
  if (backBtn) {
    backBtn.addEventListener('click', function () {
      currentNovel = null;
      setView('novelListView');
      window.scrollTo(0, 0);
    });
  }

  /* ─ load JSON ─ */
  fetch('./data/novels-data.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      novels = data.novels || [];
      activateFilter('all');
      setView('novelListView');
    })
    .catch(function () {
      var grid = $('novelGrid');
      if (grid) grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:4rem;color:rgb(239,68,68);font-family:\'JetBrains Mono\',monospace;font-size:.8rem;">データの読み込みに失敗しました</div>';
    });

})();
