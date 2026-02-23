// ── 海蝕機関 記録文庫 ── Novel browser with embedded dynamic cards (SPA-compatible)
(function () {
  'use strict';

  /* ─────────────────────────────────────────────
   *  State
   * ───────────────────────────────────────────── */
  var novels   = [];
  var filtered = [];
  var activeCategory = 'all';
  var currentNovel   = null;

  /* ─────────────────────────────────────────────
   *  Style tokens
   * ───────────────────────────────────────────── */
  var CAT = {
    '\u4f5c\u6226\u8a18\u9332':     { bg:'rgba(239,68,68,.12)',   border:'rgba(239,68,68,.4)',   text:'rgb(239,68,68)' },
    '\u5b9f\u4f53\u63a5\u89e6\u8a18\u9332': { bg:'rgba(16,185,129,.12)',  border:'rgba(16,185,129,.4)',  text:'rgb(16,185,129)' },
    '\u5185\u90e8\u8a18\u9332':     { bg:'rgba(0,255,255,.10)',   border:'rgba(0,255,255,.35)',  text:'var(--primary)' },
    '\u4eba\u7269\u8a18\u9332':     { bg:'rgba(168,85,247,.12)',  border:'rgba(168,85,247,.4)',  text:'rgb(168,85,247)' },
    '\u500b\u4eba\u8a18\u9332':     { bg:'rgba(245,158,11,.12)',  border:'rgba(245,158,11,.4)',  text:'rgb(245,158,11)' },
  };
  var SEC_LABEL = {1:'\u516c\u958b', 2:'\u6a5f\u5bc6', 3:'\u6975\u79d8'};
  var SEC_COLOR = {1:'rgb(16,185,129)', 2:'rgb(245,158,11)', 3:'rgb(239,68,68)'};

  /* ─────────────────────────────────────────────
   *  Data helpers
   * ───────────────────────────────────────────── */
  function getPersonnel(id) {
    var db = window.__DATA_PERSONNEL_DATA;
    if (!db) return null;
    return (db.personnel || []).find(function(p){ return p.id === id; }) || null;
  }
  function getEntity(code) {
    var db = window.__DATA_ENTITIES_DATA;
    if (!db) return null;
    return (db.entities || []).find(function(e){ return e.code === code || e.id === code; }) || null;
  }
  function getModule(code) {
    var db = window.__DATA_MODULES_DATA;
    if (!db) return null;
    return (db.modules || []).find(function(m){ return m.code === code || m.id === code; }) || null;
  }
  function getLocation(id) {
    var db = window.__DATA_LOCATIONS_DATA;
    if (!db) return null;
    return (db.locations || []).find(function(l){ return l.id === id || l.name === id; }) || null;
  }
  function getMission(id) {
    var db = window.__DATA_MISSION_DATA;
    if (!db) return null;
    return (db.missions || []).find(function(m){ return m.id === id; }) || null;
  }
  function getIncident(id) {
    var db = window.__DATA_MAP_INCIDENTS;
    if (!db) return null;
    return (db.incidents || []).find(function(i){ return i.id === id; }) || null;
  }

  /* ─────────────────────────────────────────────
   *  Shared card wrapper
   * ───────────────────────────────────────────── */
  var _revealCounter = 0;

  // reveal=true のとき、カード全体をプレースホルダーで包む
  // プレースホルダーは最初 opacity:0 / pointer-events:none で、
  // IntersectionObserver が viewport 検知後 2秒で展開する
  function cardWrap(accent, label, content, reveal) {
    var accentA = accent.indexOf('rgb(') === 0
      ? accent.replace('rgb(','rgba(').replace(')',', .15)')
      : accent;
    var inner =
      '<div style="margin:1.6rem 0;border:1px solid ' + accent + ';background:rgba(0,0,0,.5);max-width:56ch;">' +
        '<div style="padding:.35rem .75rem;background:' + accentA + ';border-bottom:1px solid ' + accent + ';display:flex;align-items:center;gap:.5rem;">' +
          '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.58rem;color:' + accent + ';letter-spacing:.1em;text-transform:uppercase;">' + label + '</span>' +
        '</div>' +
        '<div style="padding:.85rem 1rem;">' + content + '</div>' +
      '</div>';

    if (!reveal) return inner;

    // REVEALモード: プレースホルダーで包む
    var rid = 'reveal-' + (_revealCounter++);
    _revealPending.push(rid);
    return '<div id="' + rid + '" data-reveal="1" style="position:relative;margin:1.6rem 0;max-width:56ch;">' +
      // センサー（透明・高さゼロ）: カードより少し前にスクロールされたら検知
      '<div id="' + rid + '-sensor" style="position:absolute;top:-60px;left:0;width:1px;height:1px;pointer-events:none;"></div>' +
      // カード本体は最初非表示
      '<div id="' + rid + '-card" style="opacity:0;transform:translateY(8px);transition:opacity .5s ease,transform .5s ease;pointer-events:none;margin:0;">' +
        inner.replace(/^<div style="margin:1\.6rem 0;/, '<div style="margin:0;') +
      '</div>' +
      // 待機インジケーター
      '<div id="' + rid + '-wait" style="display:flex;align-items:center;gap:.55rem;padding:.5rem .75rem;' +
        'border:1px dashed rgba(0,255,255,.2);background:rgba(0,0,0,.3);font-family:\'JetBrains Mono\',monospace;font-size:.6rem;color:rgba(0,255,255,.35);letter-spacing:.08em;">' +
        '<span style="display:inline-block;width:.45rem;height:.45rem;border-radius:50%;background:rgba(0,255,255,.35);animation:revealPulse 1.2s ease-in-out infinite;"></span>' +
        '\u53d6\u5f97\u4e2d\u2026' +  // 取得中…
      '</div>' +
    '</div>';
  }

  // reveal待ちのID一覧
  var _revealPending = [];

  // IntersectionObserver でプレースホルダーを監視、viewport 入ったら 2秒後に展開
  function _bindReveal() {
    if (!_revealPending.length) return;
    var ids = _revealPending.slice();
    _revealPending = [];

    if (!('IntersectionObserver' in window)) {
      // フォールバック: 即時表示
      ids.forEach(function(rid) { _doReveal(rid); });
      return;
    }

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        var sensor = entry.target;
        var rid = sensor.id.replace('-sensor', '');
        observer.unobserve(sensor);
        setTimeout(function() { _doReveal(rid); }, 2000);
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0 });

    ids.forEach(function(rid) {
      var sensor = document.getElementById(rid + '-sensor');
      if (sensor) observer.observe(sensor);
      else _doReveal(rid); // DOM未挿入の場合は即時
    });
  }

  function _doReveal(rid) {
    var wait = document.getElementById(rid + '-wait');
    var card = document.getElementById(rid + '-card');
    if (!wait || !card) return;
    // 待機インジケーターをフェードアウト
    wait.style.transition = 'opacity .3s';
    wait.style.opacity = '0';
    setTimeout(function() {
      wait.style.display = 'none';
      // カードをフェードイン
      card.style.pointerEvents = '';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
      // カード内のインタラクティブ要素も有効化（バインド済みのため不要だが念のため）
    }, 320);
  }

  /* ─────────────────────────────────────────────
   *  Card renderers
   * ───────────────────────────────────────────── */

  // PERSONNEL
  function renderPersonnelCard(id, reveal) {
    var p = getPersonnel(id);
    if (!p) return notFound('PERSONNEL', id);
    var col = 'rgb(245,158,11)';
    var statusColor = !p.psychEval ? 'rgba(255,255,255,.4)' :
      p.psychEval.status === '\u826f\u597d' ? 'rgb(16,185,129)' :
      p.psychEval.status === '\u6ce8\u610f\u89b3\u5bdf' ? 'rgb(245,158,11)' : 'rgb(239,68,68)';
    var inner =
      '<div style="display:flex;gap:.85rem;align-items:flex-start;">' +
        '<div style="flex-shrink:0;width:2.5rem;height:2.5rem;background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.35);display:flex;align-items:center;justify-content:center;">' +
          '<svg width="20" height="20" fill="none" stroke="' + col + '" viewBox="0 0 24 24">' +
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>' +
          '</svg>' +
        '</div>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin-bottom:.3rem;">' +
            '<span style="font-family:\'Space Grotesk\',sans-serif;font-weight:700;font-size:.9rem;color:white;">' + p.name + '</span>' +
            '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.58rem;color:rgba(255,255,255,.35);">' + p.id + '</span>' +
          '</div>' +
          '<div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.4rem;">' +
            '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.6rem;color:' + col + ';">' + p.division + '</span>' +
            '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.6rem;color:rgba(255,255,255,.3);">|</span>' +
            '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.6rem;color:rgba(255,255,255,.5);">' + p.rank + '</span>' +
          '</div>' +
          (p.specialization ? '<div style="font-size:.72rem;color:rgba(255,255,255,.5);margin-bottom:.35rem;">' + p.specialization + '</div>' : '') +
          '<div style="display:flex;align-items:center;gap:.35rem;">' +
            '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.58rem;color:rgba(255,255,255,.3);">\u5fc3\u7406\u8a55\u4fa1:</span>' +
            '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.6rem;color:' + statusColor + ';">' + (p.psychEval ? p.psychEval.status : '\u4e0d\u660e') + '</span>' +
          '</div>' +
        '</div>' +
      '</div>';
    return cardWrap(col, '\u25c6 \u6a5f\u95a2\u54e1\u30c7\u30fc\u30bf', inner, reveal);
  }

  // ENTITY
  var ENT_CLASS_COLOR = { safe:'rgb(16,185,129)', caution:'rgb(245,158,11)', danger:'rgb(239,68,68)', classified:'rgb(168,85,247)' };
  var ENT_CLASS_LABEL = { safe:'SAFE', caution:'CAUTION', danger:'DANGER', classified:'CLASSIFIED' };
  function renderEntityCard(code, reveal) {
    var e = getEntity(code);
    if (!e) return notFound('ENTITY', code);
    var col = ENT_CLASS_COLOR[e.classification] || 'rgb(168,85,247)';
    var lbl = ENT_CLASS_LABEL[e.classification] || e.classification.toUpperCase();
    var colA = col.replace('rgb(','rgba(').replace(')',', .12)');
    var colB = col.replace('rgb(','rgba(').replace(')',', .35)');
    var colC = col.replace('rgb(','rgba(').replace(')',', .15)');
    var colD = col.replace('rgb(','rgba(').replace(')',', .4)');
    var inner =
      '<div style="display:flex;gap:.75rem;align-items:flex-start;">' +
        '<div style="flex-shrink:0;width:2.5rem;height:2.5rem;background:' + colA + ';border:1px solid ' + colB + ';display:flex;align-items:center;justify-content:center;">' +
          '<svg width="18" height="18" fill="none" stroke="' + col + '" viewBox="0 0 24 24">' +
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>' +
          '</svg>' +
        '</div>' +
        '<div style="flex:1;">' +
          '<div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin-bottom:.3rem;">' +
            '<span style="font-family:\'Space Grotesk\',sans-serif;font-weight:700;font-size:.9rem;color:white;">' + e.name + '</span>' +
            '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.6rem;padding:.1rem .4rem;background:' + colC + ';border:1px solid ' + colD + ';color:' + col + ';">' + lbl + '</span>' +
            '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.58rem;color:rgba(255,255,255,.3);">' + e.code + '</span>' +
          '</div>' +
          '<p style="font-size:.75rem;color:rgba(255,255,255,.6);line-height:1.6;margin:0 0 .4rem;">' + e.description + '</p>' +
          '<div style="display:flex;gap:1rem;flex-wrap:wrap;">' +
            '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.6rem;color:rgba(255,255,255,.3);">\u8105\u5a01: <span style="color:rgba(255,255,255,.65);">' + (e.threat||'\u4e0d\u660e') + '</span></span>' +
            '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.6rem;color:rgba(255,255,255,.3);">\u77e5\u6027: <span style="color:rgba(255,255,255,.65);">' + (e.intelligence||'\u4e0d\u660e') + '</span></span>' +
          '</div>' +
        '</div>' +
      '</div>';
    return cardWrap(col, '\u25b2 \u5b9f\u4f53\u30c7\u30fc\u30bf\u30d5\u30a1\u30a4\u30eb', inner, reveal);
  }

  // MODULE
  var MOD_CLASS_COLOR = { safe:'rgb(16,185,129)', caution:'rgb(245,158,11)', danger:'rgb(239,68,68)', classified:'rgb(168,85,247)' };
  function renderModuleCard(code, reveal) {
    var m = getModule(code);
    if (!m) return notFound('MODULE', code);
    var col = MOD_CLASS_COLOR[m.classification] || 'var(--primary)';
    var specs = [];
    if (m.range)    specs.push('\u5c04\u7a0b: ' + m.range);
    if (m.duration) specs.push('\u6301\u7d9a: ' + m.duration);
    if (m.energy)   specs.push('\u30a8\u30cd\u30eb\u30ae\u30fc: ' + m.energy);
    var inner =
      '<div>' +
        '<div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin-bottom:.4rem;">' +
          '<span style="font-family:\'Space Grotesk\',sans-serif;font-weight:700;font-size:.9rem;color:white;">' + m.name + '</span>' +
          '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.65rem;color:' + col + ';">' + m.code + '</span>' +
        '</div>' +
        '<p style="font-size:.75rem;color:rgba(255,255,255,.6);line-height:1.6;margin:0 0 .5rem;">' + m.description + '</p>' +
        (specs.length ? '<div style="display:flex;gap:.75rem;flex-wrap:wrap;margin-bottom:.35rem;">' +
          specs.map(function(s){
            return '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.6rem;color:rgba(255,255,255,.5);">' + s + '</span>';
          }).join('') +
        '</div>' : '') +
        (m.warning ? '<div style="margin-top:.4rem;padding:.4rem .6rem;background:rgba(239,68,68,.08);border-left:2px solid rgba(239,68,68,.5);font-family:\'JetBrains Mono\',monospace;font-size:.62rem;color:rgba(239,68,68,.8);line-height:1.55;">[WARNING] ' + m.warning + '</div>' : '') +
      '</div>';
    return cardWrap(col, '\u29e1 \u30e2\u30b8\u30e5\u30fc\u30eb\u4ed5\u69d8\u66f8', inner, reveal);
  }

  // LOCATION
  function renderLocationCard(id, reveal) {
    var l = getLocation(id);
    if (!l) return notFound('LOCATION', id);
    var col = 'rgb(16,185,129)';
    var inner =
      '<div>' +
        '<div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin-bottom:.35rem;">' +
          '<span style="font-family:\'Space Grotesk\',sans-serif;font-weight:700;font-size:.9rem;color:white;">' + l.name + '</span>' +
          (l.coordinates ? '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.58rem;color:rgba(255,255,255,.3);">' + l.coordinates + '</span>' : '') +
        '</div>' +
        '<p style="font-size:.75rem;color:rgba(255,255,255,.6);line-height:1.6;margin:0 0 .45rem;">' + l.description + '</p>' +
        (l.facilities && l.facilities.length ?
          '<div style="display:flex;gap:.3rem;flex-wrap:wrap;">' +
            l.facilities.slice(0,5).map(function(f){
              return '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.58rem;padding:.1rem .4rem;background:rgba(16,185,129,.07);border:1px solid rgba(16,185,129,.25);color:rgba(16,185,129,.8);">' + f + '</span>';
            }).join('') +
          '</div>' : '') +
      '</div>';
    return cardWrap(col, '\u25ce \u65bd\u8a2d\u60c5\u5831', inner, reveal);
  }

  // INCIDENT
  var INC_SEV_COLOR = { critical:'rgb(239,68,68)', warning:'rgb(245,158,11)', safe:'rgb(16,185,129)' };
  function renderIncidentCard(id, reveal) {
    var inc = getIncident(id);
    if (!inc) return notFound('INCIDENT', id);
    var col = INC_SEV_COLOR[inc.severity] || 'rgb(245,158,11)';
    var colA = col.replace('rgb(','rgba(').replace(')',', .15)');
    var colB = col.replace('rgb(','rgba(').replace(')',', .4)');
    var inner =
      '<div>' +
        '<div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin-bottom:.35rem;">' +
          '<span style="font-family:\'Space Grotesk\',sans-serif;font-weight:700;font-size:.88rem;color:white;">' + inc.name + '</span>' +
          '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.6rem;padding:.1rem .4rem;background:' + colA + ';border:1px solid ' + colB + ';color:' + col + ';">' + inc.status + '</span>' +
        '</div>' +
        '<p style="font-size:.75rem;color:rgba(255,255,255,.6);line-height:1.6;margin:0 0 .4rem;">' + inc.desc + '</p>' +
        '<div style="display:flex;gap:.75rem;flex-wrap:wrap;">' +
          '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.6rem;color:rgba(255,255,255,.3);">GSI: <span style="color:' + col + ';">' + (inc.gsi||'—') + '</span></span>' +
          '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.6rem;color:rgba(255,255,255,.3);">\u62c5\u5f53: <span style="color:rgba(255,255,255,.55);">' + (inc.division||inc.assignedDivision||'—') + '</span></span>' +
          (inc.time||inc.timestamp ? '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.6rem;color:rgba(255,255,255,.25);">' + (inc.time||inc.timestamp) + '</span>' : '') +
        '</div>' +
      '</div>';
    return cardWrap(col, '\u26a0 \u73fe\u5834\u30a4\u30f3\u30b7\u30c7\u30f3\u30c8', inner, reveal);
  }

  // MINI CHAT
  var _chatCardCount = 0;
  function renderChatCard(lines, reveal) {
    var SENDER_COLOR = {
      '\u672c\u90e8':'rgb(0,255,255)', '\u53f8\u4ee4':'rgb(245,158,11)',
      '\u4f50\u85e4':'rgb(16,185,129)', '\u4f0a\u85e4':'rgb(239,68,68)',
      '\u4e2d\u6751':'rgb(249,115,22)', '\u9ad8\u6a4b':'rgb(168,85,247)',
      '\u7530\u4e2d':'rgb(96,165,250)', '\u6728\u6751':'rgb(52,211,153)',
      '\u4f50\u3005\u6728':'rgb(216,180,254)', '\u9234\u6728':'rgb(251,191,36)',
      'SYSTEM':'rgb(239,68,68)', 'AI':'rgb(0,255,255)',
    };
    function senderCol(s) {
      for (var k in SENDER_COLOR) {
        if (s.indexOf(k) !== -1) return SENDER_COLOR[k];
      }
      return 'rgba(255,255,255,.6)';
    }

    // Split input lines from chat log lines
    // INPUT lines: "INPUT:固定テキスト>>RESPONSE:反応テキスト"
    var logLines = [];
    var inputCfg = null;
    lines.forEach(function(raw) {
      if (/^INPUT:/.test(raw)) {
        var arrow = raw.indexOf('>>RESPONSE:');
        if (arrow !== -1) {
          inputCfg = {
            text: raw.slice(6, arrow).trim(),
            response: raw.slice(arrow + 11).trim()
          };
        } else {
          inputCfg = { text: raw.slice(6).trim(), response: '' };
        }
      } else {
        logLines.push(raw);
      }
    });

    var msgs = logLines.map(function(raw) {
      var colon = raw.indexOf(':');
      if (colon === -1) return { sender:'?', msg: raw };
      return { sender: raw.slice(0, colon).trim(), msg: raw.slice(colon+1).trim() };
    });

    var msgHTML =
      '<div id="chat-log-' + _chatCardCount + '" style="display:flex;flex-direction:column;gap:.55rem;">' +
        msgs.map(function(m) {
          var col = senderCol(m.sender);
          if (m.sender.toUpperCase() === 'SYSTEM') {
            return '<div style="text-align:center;font-family:\'JetBrains Mono\',monospace;font-size:.6rem;color:rgba(239,68,68,.7);letter-spacing:.08em;">\u2500\u2500 ' + m.msg + ' \u2500\u2500</div>';
          }
          var colB = col.replace('rgb(','rgba(').replace(')',', .35)');
          return '<div style="display:flex;gap:.6rem;align-items:flex-start;">' +
            '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.6rem;color:' + col + ';white-space:nowrap;flex-shrink:0;padding-top:.08rem;">' + m.sender + '</span>' +
            '<div style="flex:1;background:rgba(255,255,255,.04);border-left:2px solid ' + colB + ';padding:.3rem .55rem;font-size:.75rem;color:rgba(255,255,255,.8);line-height:1.6;">' + m.msg + '</div>' +
          '</div>';
        }).join('') +
      '</div>';

    var inputHTML = '';
    if (inputCfg) {
      var cardId = 'chat-input-' + _chatCardCount;
      var logId  = 'chat-log-'   + _chatCardCount;
      var respId = 'chat-resp-'  + _chatCardCount;
      var btnId  = 'chat-btn-'   + _chatCardCount;
      var respText = inputCfg.response;
      inputHTML =
        '<div style="margin-top:.75rem;border-top:1px solid rgba(0,255,255,.15);padding-top:.65rem;">' +
          '<div style="display:flex;gap:.4rem;align-items:center;">' +
            '<input id="' + cardId + '" readonly value="' + inputCfg.text.replace(/"/g,'&quot;') + '" ' +
              'style="flex:1;background:rgba(0,255,255,.06);border:1px solid rgba(0,255,255,.25);color:var(--primary);' +
              'font-family:\'JetBrains Mono\',monospace;font-size:.72rem;padding:.35rem .6rem;outline:none;cursor:default;caret-color:transparent;">' +
            '<button id="' + btnId + '" style="background:rgba(0,255,255,.1);border:1px solid rgba(0,255,255,.35);color:var(--primary);' +
              'font-family:\'JetBrains Mono\',monospace;font-size:.65rem;padding:.35rem .75rem;cursor:pointer;transition:all .2s;white-space:nowrap;"' +
              'onmouseover="this.style.background=\'rgba(0,255,255,.2)\'" onmouseout="this.style.background=\'rgba(0,255,255,.1)\'">' +
              '&#x25BA; \u9001\u4fe1' +
            '</button>' +
          '</div>' +
          '<div id="' + respId + '" style="margin-top:.5rem;min-height:0;"></div>' +
        '</div>';

      // Register post-render callback
      _chatCallbacks.push({
        btnId: btnId, logId: logId, respId: respId,
        inputId: cardId, respText: respText
      });
    }

    _chatCardCount++;
    var inner = msgHTML + inputHTML;
    return cardWrap('var(--primary)', '\u2726 \u901a\u4fe1\u30ed\u30b0', inner, reveal);
  }

  // Callbacks registered by renderChatCard, fired after DOM insertion
  var _chatCallbacks = [];
  function _bindChatCallbacks() {
    _chatCallbacks.forEach(function(cb) {
      var btn = document.getElementById(cb.btnId);
      if (!btn || btn._chatBound) return;
      btn._chatBound = true;
      var _typing = false;
      var _done   = false;
      btn.addEventListener('click', function() {
        if (_typing || _done) return;
        var logEl = document.getElementById(cb.logId);
        _typing = true;
        btn.disabled = true;
        btn.style.opacity = '0.4';
        if (logEl && document.getElementById(cb.inputId)) {
          var txt = document.getElementById(cb.inputId).value;
          var userRow = document.createElement('div');
          userRow.style.cssText = 'display:flex;gap:.6rem;align-items:flex-start;margin-top:.4rem;';
          userRow.innerHTML =
            '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.6rem;color:rgba(255,255,255,.6);white-space:nowrap;flex-shrink:0;padding-top:.08rem;">YOU</span>' +
            '<div style="flex:1;background:rgba(255,255,255,.04);border-left:2px solid rgba(255,255,255,.2);padding:.3rem .55rem;font-size:.75rem;color:rgba(255,255,255,.8);line-height:1.6;">' + txt + '</div>';
          logEl.appendChild(userRow);
        }
        if (!cb.respText) {
          _done = true;
          _typing = false;
          btn.style.cursor = 'not-allowed';
          return;
        }
        var respRow = document.createElement('div');
        respRow.style.cssText = 'display:flex;gap:.6rem;align-items:flex-start;margin-top:.3rem;';
        var msgBub = document.createElement('div');
        msgBub.style.cssText = 'flex:1;background:rgba(0,255,255,.05);border-left:2px solid rgba(0,255,255,.35);padding:.3rem .55rem;font-size:.75rem;color:rgba(255,255,255,.85);line-height:1.6;';
        respRow.innerHTML = '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.6rem;color:rgb(0,255,255);white-space:nowrap;flex-shrink:0;padding-top:.08rem;">AI</span>';
        respRow.appendChild(msgBub);
        if (logEl) logEl.appendChild(respRow);
        var i = 0;
        var full = cb.respText;
        var cursor = document.createElement('span');
        cursor.textContent = '\u258c';
        cursor.style.cssText = 'animation:chatBlink .6s step-end infinite;color:rgb(0,255,255);';
        msgBub.appendChild(cursor);
        var iv = setInterval(function() {
          msgBub.textContent = full.slice(0, i);
          msgBub.appendChild(cursor);
          i++;
          if (i > full.length) {
            clearInterval(iv);
            cursor.remove();
            setTimeout(function() {
              _typing = false;
              _done   = true;
              btn.disabled = true;
              btn.style.opacity = '0.25';
              btn.style.cursor  = 'not-allowed';
              btn.title = '\u9001\u4fe1\u6e08\u307f';
            }, 400);
          }
        }, 35);
      });
    });
    _chatCallbacks = [];
  }

  // MINI CONSOLE
  var _consoleCardCount = 0;
  var _consoleCallbacks = [];
  function renderConsoleCard(lines, reveal) {
    var TYPE_COL = {
      alert:'rgb(239,68,68)', critical:'rgb(239,68,68)',
      deployment:'rgb(245,158,11)', preparation:'rgb(245,158,11)',
      discovery:'rgb(96,165,250)', action:'rgb(0,255,255)',
      completed:'rgb(16,185,129)', success:'rgb(16,185,129)',
      ongoing:'rgba(255,255,255,.45)',
    };
    var TYPE_SYM = {
      alert:'\u26a1', critical:'\u2620', deployment:'\u25b6', preparation:'\u25ce',
      discovery:'\u25cf', action:'\u25ba', completed:'\u2713', success:'\u2713', ongoing:'\u2026',
    };

    // Split CMD line from log lines
    var logLines = [];
    var cmdCfg = null;
    lines.forEach(function(raw) {
      if (/^CMD:/.test(raw)) {
        var arrow = raw.indexOf('>>RESULT:');
        if (arrow !== -1) {
          cmdCfg = { cmd: raw.slice(4, arrow).trim(), result: raw.slice(arrow + 9).trim() };
        } else {
          cmdCfg = { cmd: raw.slice(4).trim(), result: '' };
        }
      } else {
        logLines.push(raw);
      }
    });

    var entries = logLines.map(function(raw) {
      var parts = raw.split(':');
      var type  = (parts[parts.length - 1] || '').trim();
      if (!TYPE_COL[type]) { return { time: '', event: raw, type: 'action' }; }
      var time  = parts[0].trim();
      var event = parts.slice(1, parts.length - 1).join(':').trim();
      return { time: time, event: event, type: type };
    });

    var logId = 'con-log-' + _consoleCardCount;
    var logHTML =
      '<div id="' + logId + '" style="font-family:\'JetBrains Mono\',monospace;display:flex;flex-direction:column;gap:.3rem;">' +
        entries.map(function(e) {
          var col = TYPE_COL[e.type] || 'rgba(255,255,255,.5)';
          var sym = TYPE_SYM[e.type] || '\u00b7';
          return '<div style="display:grid;grid-template-columns:auto 1.2rem 1fr;gap:.3rem .4rem;align-items:baseline;">' +
            (e.time ? '<span style="font-size:.58rem;color:rgba(255,255,255,.3);white-space:nowrap;">' + e.time + '</span>' : '<span></span>') +
            '<span style="font-size:.65rem;color:' + col + ';text-align:center;">' + sym + '</span>' +
            '<span style="font-size:.72rem;color:rgba(255,255,255,.7);line-height:1.5;">' + e.event + '</span>' +
          '</div>';
        }).join('') +
      '</div>';

    var cmdHTML = '';
    if (cmdCfg) {
      var btnId = 'con-btn-' + _consoleCardCount;
      var inId  = 'con-in-'  + _consoleCardCount;
      cmdHTML =
        '<div style="margin-top:.65rem;border-top:1px solid rgba(0,255,255,.15);padding-top:.55rem;">' +
          '<div style="display:flex;gap:0;align-items:center;background:rgba(0,0,0,.4);border:1px solid rgba(0,255,255,.2);">' +
            '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.68rem;color:rgba(0,255,255,.6);padding:.3rem .5rem;white-space:nowrap;border-right:1px solid rgba(0,255,255,.15);">&gt;_</span>' +
            '<input id="' + inId + '" readonly value="' + cmdCfg.cmd.replace(/"/g,'&quot;') + '" ' +
              'style="flex:1;background:transparent;border:none;color:rgb(0,255,255);' +
              'font-family:\'JetBrains Mono\',monospace;font-size:.72rem;padding:.3rem .55rem;outline:none;cursor:default;caret-color:transparent;">' +
            '<button id="' + btnId + '" style="background:rgba(0,255,255,.1);border:none;border-left:1px solid rgba(0,255,255,.2);color:var(--primary);' +
              'font-family:\'JetBrains Mono\',monospace;font-size:.62rem;padding:.3rem .65rem;cursor:pointer;transition:all .2s;white-space:nowrap;"' +
              'onmouseover="this.style.background=\'rgba(0,255,255,.22)\'" onmouseout="this.style.background=\'rgba(0,255,255,.1)\'">' +
              'EXEC' +
            '</button>' +
          '</div>' +
        '</div>';

      _consoleCallbacks.push({ btnId: btnId, logId: logId, result: cmdCfg.result });
    }

    _consoleCardCount++;
    return cardWrap('rgba(0,255,255,.5)', '\u2b1b \u4f5c\u6226\u30b3\u30f3\u30bd\u30fc\u30eb', logHTML + cmdHTML, reveal);
  }

  function _bindConsoleCallbacks() {
    _consoleCallbacks.forEach(function(cb) {
      var btn = document.getElementById(cb.btnId);
      if (!btn || btn._conBound) return;
      btn._conBound = true;
      var _running = false;
      var _done    = false;
      btn.addEventListener('click', function() {
        if (_running || _done) return;
        var logEl = document.getElementById(cb.logId);
        if (!logEl || !cb.result) return;
        _running = true;
        btn.disabled = true;
        btn.style.opacity = '0.4';
        var lines = cb.result.split('\\n');
        var delay = 0;
        lines.forEach(function(line, idx) {
          setTimeout(function() {
            var row = document.createElement('div');
            row.style.cssText = 'display:grid;grid-template-columns:auto 1.2rem 1fr;gap:.3rem .4rem;align-items:baseline;opacity:0;transition:opacity .2s;';
            row.innerHTML =
              '<span style="font-size:.58rem;color:rgba(255,255,255,.3);white-space:nowrap;">' + new Date().toTimeString().slice(0,5) + '</span>' +
              '<span style="font-size:.65rem;color:rgb(0,255,255);text-align:center;">&gt;</span>' +
              '<span style="font-size:.72rem;color:rgba(0,255,255,.85);line-height:1.5;">' + line + '</span>';
            logEl.appendChild(row);
            requestAnimationFrame(function() { row.style.opacity = '1'; });
            if (idx === lines.length - 1) {
              setTimeout(function() {
                _running = false;
                _done    = true;
                btn.disabled = true;
                btn.style.opacity  = '0.25';
                btn.style.cursor   = 'not-allowed';
                btn.title = '\u5b9f\u884c\u6e08\u307f';
              }, 400);
            }
          }, delay);
          delay += 180;
        });
      });
    });
    _consoleCallbacks = [];
  }

  // ─────────── NEW WIDGETS ───────────

  // REDACTED
  var _redactedCount = 0;
  function renderRedacted(text) {
    var id = 'redacted-' + _redactedCount++;
    var safeText = text.replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return '<span id="' + id + '" ' +
      'title="\u30af\u30ea\u30c3\u30af\u3067\u4e00\u77ac\u8868\u793a" ' +
      'style="display:inline-block;background:#111;color:#111;border-radius:2px;padding:0 .3rem;cursor:pointer;' +
      'font-family:\'JetBrains Mono\',monospace;font-size:.85em;letter-spacing:.04em;' +
      'transition:background .08s,color .08s;position:relative;user-select:none;"' +
      'onmousedown="(function(el,t){' +
        'el.style.background=\'transparent\';el.style.color=\'rgb(239,68,68)\';' +
        'clearTimeout(el._rt);el._rt=setTimeout(function(){el.style.background=\'#111\';el.style.color=\'#111\';},900);' +
      '})(document.getElementById(\'' + id + '\'),event)">' +
      safeText +
    '</span>';
  }

  // DIARY
  function renderDiaryCard(date, body, reveal) {
    var col = 'rgb(245,158,11)';
    var inner =
      '<div>' +
        '<div style="font-family:\'JetBrains Mono\',monospace;font-size:.62rem;color:' + col + ';letter-spacing:.1em;margin-bottom:.6rem;display:flex;align-items:center;gap:.5rem;">' +
          '<span style="opacity:.5;">\u25a1</span><span>' + date + '</span>' +
        '</div>' +
        '<p style="font-size:.8rem;color:rgba(255,255,255,.78);line-height:1.85;margin:0;white-space:pre-wrap;">' + body.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</p>' +
        '<div style="margin-top:.75rem;padding-top:.5rem;border-top:1px solid rgba(245,158,11,.12);font-family:\'JetBrains Mono\',monospace;font-size:.55rem;color:rgba(245,158,11,.4);letter-spacing:.1em;">\u2014 \u4e2a\u4eba\u8a18\u9332 // \u53d6\u308a\u6271\u3044\u8981\u6ce8\u610f \u2014</div>' +
      '</div>';
    return cardWrap(col, '\u270d \u65e5\u8a18', inner, reveal);
  }

  // ALERT
  function renderAlertBanner(type, message, reveal) {
    var STYLES = {
      info:    { col:'rgb(96,165,250)',  icon:'\u2139', label:'INFO' },
      warn:    { col:'rgb(245,158,11)', icon:'\u26a0', label:'WARNING' },
      warning: { col:'rgb(245,158,11)', icon:'\u26a0', label:'WARNING' },
      error:   { col:'rgb(239,68,68)',  icon:'\u2716', label:'ERROR' },
      success: { col:'rgb(16,185,129)', icon:'\u2714', label:'OK' },
      critical:{ col:'rgb(239,68,68)',  icon:'\u2620', label:'CRITICAL' },
    };
    var s = STYLES[(type||'').toLowerCase()] || STYLES.info;
    var colA = s.col.replace('rgb(','rgba(').replace(')',', .12)');
    var colB = s.col.replace('rgb(','rgba(').replace(')',', .35)');
    var html = '<div style="margin:1.2rem 0;padding:.65rem 1rem;background:' + colA + ';border:1px solid ' + colB + ';border-left:3px solid ' + s.col + ';display:flex;align-items:flex-start;gap:.65rem;max-width:56ch;">' +
      '<span style="font-size:.9rem;color:' + s.col + ';flex-shrink:0;line-height:1.4;">' + s.icon + '</span>' +
      '<div style="flex:1;">' +
        '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.58rem;color:' + s.col + ';letter-spacing:.12em;margin-right:.5rem;">[' + s.label + ']</span>' +
        '<span style="font-size:.78rem;color:rgba(255,255,255,.85);line-height:1.6;">' + message.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</span>' +
      '</div>' +
    '</div>';
    if (!reveal) return html;
    // ALERTはカード形式ではないので、reveal用ラッパーを手動生成
    var rid = 'reveal-' + (_revealCounter++);
    _revealPending.push(rid);
    return '<div id="' + rid + '" data-reveal="1" style="position:relative;max-width:56ch;">' +
      '<div id="' + rid + '-sensor" style="position:absolute;top:-60px;left:0;width:1px;height:1px;pointer-events:none;"></div>' +
      '<div id="' + rid + '-card" style="opacity:0;transform:translateY(8px);transition:opacity .5s ease,transform .5s ease;pointer-events:none;">' +
        html +
      '</div>' +
      '<div id="' + rid + '-wait" style="display:flex;align-items:center;gap:.55rem;padding:.5rem .75rem;margin:1.2rem 0;' +
        'border:1px dashed rgba(0,255,255,.2);background:rgba(0,0,0,.3);font-family:\'JetBrains Mono\',monospace;font-size:.6rem;color:rgba(0,255,255,.35);letter-spacing:.08em;">' +
        '<span style="display:inline-block;width:.45rem;height:.45rem;border-radius:50%;background:rgba(0,255,255,.35);animation:revealPulse 1.2s ease-in-out infinite;"></span>' +
        '\u53d6\u5f97\u4e2d\u2026' +
      '</div>' +
    '</div>';
  }

  // SCAN
  var _scanCount = 0;
  function renderScanCard(target, dataLines, reveal) {
    var id = 'scan-' + _scanCount++;
    var rows = dataLines.map(function(line) {
      var eq = line.indexOf(':');
      if (eq === -1) return { k: line, v: '' };
      return { k: line.slice(0, eq).trim(), v: line.slice(eq + 1).trim() };
    });
    var scanLinesHTML = rows.map(function(r, i) {
      return '<div style="display:flex;gap:.5rem;align-items:baseline;opacity:0;transition:opacity .3s ' + (i * 0.12) + 's;"' +
        ' class="scan-row-' + id + '">' +
        '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.6rem;color:rgba(0,255,255,.45);flex-shrink:0;min-width:6rem;">' + r.k.replace(/</g,'&lt;') + '</span>' +
        '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.68rem;color:rgba(255,255,255,.75);">' + r.v.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</span>' +
      '</div>';
    }).join('');
    var inner =
      '<div style="position:relative;overflow:hidden;">' +
        // Radar sweep
        '<div style="position:relative;width:5rem;height:5rem;margin:0 auto .85rem;flex-shrink:0;">' +
          '<svg viewBox="0 0 80 80" width="80" height="80" style="display:block;">' +
            '<circle cx="40" cy="40" r="38" fill="none" stroke="rgba(0,255,255,.15)" stroke-width="1"/>' +
            '<circle cx="40" cy="40" r="26" fill="none" stroke="rgba(0,255,255,.1)" stroke-width="1"/>' +
            '<circle cx="40" cy="40" r="13" fill="none" stroke="rgba(0,255,255,.08)" stroke-width="1"/>' +
            '<line x1="40" y1="2" x2="40" y2="78" stroke="rgba(0,255,255,.08)" stroke-width="1"/>' +
            '<line x1="2" y1="40" x2="78" y2="40" stroke="rgba(0,255,255,.08)" stroke-width="1"/>' +
            '<circle cx="40" cy="40" r="2" fill="rgb(0,255,255)" opacity=".6"/>' +
            '<g style="transform-origin:40px 40px;animation:radarSweep 2.5s linear infinite;">' +
              '<path d="M40 40 L40 2 A38 38 0 0 1 78 40 Z" fill="rgba(0,255,255,.07)"/>' +
              '<line x1="40" y1="40" x2="40" y2="2" stroke="rgba(0,255,255,.5)" stroke-width="1.5"/>' +
            '</g>' +
            '<circle id="scan-dot-' + id + '" cx="55" cy="28" r="2.5" fill="rgb(239,68,68)" opacity="0">' +
              '<animate attributeName="opacity" values="0;0;1;1;0.6;0.8;0.4;1;0.7;0" dur="2.5s" repeatCount="indefinite"/>' +
            '</circle>' +
          '</svg>' +
        '</div>' +
        '<div style="font-family:\'JetBrains Mono\',monospace;font-size:.62rem;color:var(--primary);letter-spacing:.1em;text-align:center;margin-bottom:.65rem;">' +
          '\u25ba SCAN: ' + target.replace(/</g,'&lt;') +
        '</div>' +
        '<div id="' + id + '" style="display:flex;flex-direction:column;gap:.28rem;">' +
          scanLinesHTML +
        '</div>' +
      '</div>';

    _scanCallbacks.push(id);
    return cardWrap('rgba(0,255,255,.6)', '\u25c9 \u30ec\u30fc\u30c0\u30fc\u30b9\u30ad\u30e3\u30f3', inner, reveal);
  }
  var _scanCallbacks = [];
  function _bindScanCallbacks() {
    _scanCallbacks.forEach(function(id) {
      var rows = document.querySelectorAll('.scan-row-' + id);
      rows.forEach(function(row, i) {
        setTimeout(function() { row.style.opacity = '1'; }, 300 + i * 130);
      });
    });
    _scanCallbacks = [];
  }

  // not-found placeholder
  function notFound(type, id) {
    return '<div style="color:rgba(255,255,255,.25);font-family:\'JetBrains Mono\',monospace;font-size:.68rem;font-style:italic;margin:.5rem 0;padding:.35rem .6rem;border-left:2px solid rgba(255,255,255,.1);">[' + type + ' \u30c7\u30fc\u30bf\u672a\u53d6\u5f97: ' + id + ']</div>';
  }

  /* ─────────────────────────────────────────────
   *  Chapter content parser
   *  Supported tags:
   *    [PERSONNEL:K-001-234]
   *    [ENTITY:E-010]
   *    [MODULE:M-002-β]
   *    [LOCATION:loc-001]
   *    [INCIDENT:inc-001]
   *    [CHAT|sender:msg|sender:msg|...]
   *    [CONSOLE|time:event:type|...]
   * ───────────────────────────────────────────── */
  function parseContent(raw) {
    var EMBED_RE = /\[(PERSONNEL|ENTITY|MODULE|LOCATION|INCIDENT|CHAT|CONSOLE|DIARY|ALERT|SCAN|REDACTED)([|:][^\]]+)?\]/g;
    var out  = '';
    var last = 0;
    var m;
    while ((m = EMBED_RE.exec(raw)) !== null) {
      out += textToHTML(raw.slice(last, m.index));
      last = m.index + m[0].length;
      var type = m[1];
      var rest = (m[2] || '').slice(1); // strip leading | or :

      // |REVEAL オプション検出（どの構文でも末尾に付けられる）
      var reveal = false;
      rest = rest.replace(/\|?REVEAL$/i, function() { reveal = true; return ''; }).trim();

      switch (type) {
        case 'PERSONNEL': out += renderPersonnelCard(rest.trim(), reveal); break;
        case 'ENTITY':    out += renderEntityCard(rest.trim(), reveal);    break;
        case 'MODULE':    out += renderModuleCard(rest.trim(), reveal);    break;
        case 'LOCATION':  out += renderLocationCard(rest.trim(), reveal);  break;
        case 'INCIDENT':  out += renderIncidentCard(rest.trim(), reveal);  break;
        case 'CHAT':      out += renderChatCard(rest.split('|').filter(Boolean), reveal);    break;
        case 'CONSOLE':   out += renderConsoleCard(rest.split('|').filter(Boolean), reveal); break;
        case 'REDACTED':  out += renderRedacted(rest); break;
        case 'DIARY': {
          var dColon = rest.indexOf(':');
          var dDate  = dColon !== -1 ? rest.slice(0, dColon).trim() : rest.trim();
          var dBody  = dColon !== -1 ? rest.slice(dColon + 1) : '';
          out += renderDiaryCard(dDate, dBody, reveal);
          break;
        }
        case 'ALERT': {
          var aColon = rest.indexOf(':');
          var aType  = aColon !== -1 ? rest.slice(0, aColon).trim() : 'info';
          var aMsg   = aColon !== -1 ? rest.slice(aColon + 1).trim() : rest.trim();
          out += renderAlertBanner(aType, aMsg, reveal);
          break;
        }
        case 'SCAN': {
          var sParts = rest.split('|');
          var sTgt   = sParts[0].trim();
          var sData  = sParts.slice(1);
          out += renderScanCard(sTgt, sData, reveal);
          break;
        }
      }
    }
    out += textToHTML(raw.slice(last));
    return out;
  }

  // Called after HTML is inserted into DOM to wire up interactive elements
  function _bindInteractiveWidgets() {
    _bindChatCallbacks();
    _bindConsoleCallbacks();
    _bindScanCallbacks();
    _bindReveal();   // ← REVEAL監視を最後に登録
  }

  function textToHTML(text) {
    if (!text.trim()) return '';
    return text.split(/\n\n+/).map(function(p) {
      p = p.trim();
      if (!p) return '';
      var isDialogue = /^\u300c|\u2500\u2500/.test(p);
      var style = 'margin-bottom:1.5rem;line-height:1.95;font-size:.92rem;' +
        (isDialogue
          ? 'color:rgba(200,230,255,.9);padding-left:1rem;border-left:2px solid rgba(0,255,255,.25);'
          : 'color:rgba(255,255,255,.82);');
      return '<p style="' + style + '">' + p.replace(/\n/g, '<br>') + '</p>';
    }).join('');
  }

  /* ─────────────────────────────────────────────
   *  Helpers
   * ───────────────────────────────────────────── */
  function $ (id) { return document.getElementById(id); }

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

  /* ─────────────────────────────────────────────
   *  Filter
   * ───────────────────────────────────────────── */
  function activateFilter (cat) {
    activeCategory = cat;
    document.querySelectorAll('[data-novel-cat]').forEach(function (btn) {
      var active = btn.getAttribute('data-novel-cat') === cat;
      btn.style.background  = active ? 'rgba(0,255,255,.1)'   : 'transparent';
      btn.style.borderColor = active ? 'rgba(0,255,255,.4)'   : 'rgba(255,255,255,.1)';
      btn.style.color       = active ? 'var(--primary)'       : 'rgba(255,255,255,.5)';
    });
    filtered = cat === 'all' ? novels : novels.filter(function(n){ return n.category === cat; });
    renderGrid(filtered);
  }

  /* ─────────────────────────────────────────────
   *  List view
   * ───────────────────────────────────────────── */
  function renderGrid (list) {
    var grid = $('novelGrid');
    if (!grid) return;
    if (list.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:4rem;color:var(--muted-foreground);font-family:\'JetBrains Mono\',monospace;font-size:.8rem;">\u2014 \u該当する記録はありません \u2014</div>';
      return;
    }
    grid.innerHTML = list.map(function(n) {
      var cat = CAT[n.category] || CAT['\u5185\u90e8\u8a18\u9332'];
      var secColor = SEC_COLOR[n.securityLevel] || SEC_COLOR[1];
      var secLabel = SEC_LABEL[n.securityLevel] || '\u516c\u958b';
      return '<div class="novel-card" data-id="' + n.id + '" style="' +
        'background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.07);' +
        'padding:1.5rem;cursor:pointer;transition:border-color .2s,background .2s;' +
        'display:flex;flex-direction:column;gap:.75rem;position:relative;overflow:hidden;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;">' +
          badge(n.category, cat.bg, cat.border, cat.text) +
          '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.6rem;color:' + secColor + ';">\u25ae ' + secLabel + '</span>' +
        '</div>' +
        '<div>' +
          '<h3 style="font-family:\'Space Grotesk\',sans-serif;font-size:1.05rem;font-weight:700;color:white;margin:0 0 .25rem;">' + n.title + '</h3>' +
          '<p style="font-size:.75rem;color:var(--muted-foreground);font-style:italic;margin:0;">' + n.subtitle + '</p>' +
        '</div>' +
        '<p style="font-size:.8rem;color:rgba(255,255,255,.55);line-height:1.65;margin:0;flex:1;">' + n.summary + '</p>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;padding-top:.75rem;border-top:1px solid rgba(255,255,255,.06);">' +
          '<div style="display:flex;gap:.35rem;flex-wrap:wrap;">' +
            n.tags.slice(0,3).map(function(t){
              return '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.58rem;padding:.1rem .45rem;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);color:rgba(255,255,255,.4);">#' + t + '</span>';
            }).join('') +
          '</div>' +
          '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.6rem;color:rgba(255,255,255,.3);">' + n.chapters.length + ' ch.</span>' +
        '</div>' +
        '<div style="position:absolute;bottom:0;left:0;right:0;height:2px;background:linear-gradient(90deg,' + cat.border + ',transparent);opacity:0;transition:opacity .2s;" class="novel-card-accent"></div>' +
      '</div>';
    }).join('');

    grid.querySelectorAll('.novel-card').forEach(function(card) {
      card.addEventListener('mouseenter', function() {
        this.style.borderColor = 'rgba(0,255,255,.25)';
        this.style.background  = 'rgba(0,255,255,.03)';
        var a = this.querySelector('.novel-card-accent');
        if (a) a.style.opacity = '1';
      });
      card.addEventListener('mouseleave', function() {
        this.style.borderColor = 'rgba(255,255,255,.07)';
        this.style.background  = 'rgba(0,0,0,.45)';
        var a = this.querySelector('.novel-card-accent');
        if (a) a.style.opacity = '0';
      });
      card.addEventListener('click', function() {
        var id = this.getAttribute('data-id');
        var novel = novels.find(function(n){ return n.id === id; });
        if (novel) openReader(novel);
      });
    });

    var countEl = $('novelCount');
    if (countEl) countEl.textContent = list.length;
  }

  /* ─────────────────────────────────────────────
   *  Reader view
   * ───────────────────────────────────────────── */
  function openReader (novel) {
    currentNovel = novel;
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
    var cat = CAT[novel.category] || CAT['\u5185\u90e8\u8a18\u9332'];
    var secColor = SEC_COLOR[novel.securityLevel] || SEC_COLOR[1];
    var secLabel = SEC_LABEL[novel.securityLevel] || '\u516c\u958b';
    el.innerHTML =
      '<div style="display:flex;gap:.6rem;align-items:center;flex-wrap:wrap;margin-bottom:1rem;">' +
        badge(novel.category, cat.bg, cat.border, cat.text) +
        '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.6rem;color:' + secColor + ';">\u25ae ' + secLabel + '</span>' +
        '<span style="font-family:\'JetBrains Mono\',monospace;font-size:.6rem;color:var(--muted-foreground);">' + novel.date + '</span>' +
      '</div>' +
      '<h1 style="font-family:\'Space Grotesk\',sans-serif;font-size:1.9rem;font-weight:700;color:white;line-height:1.2;margin:0 0 .4rem;">' + novel.title + '</h1>' +
      '<p style="font-size:.85rem;color:var(--muted-foreground);font-style:italic;margin:0 0 .5rem;">' + novel.subtitle + '</p>' +
      '<p style="font-family:\'JetBrains Mono\',monospace;font-size:.68rem;color:rgba(255,255,255,.35);">\u8457: ' + novel.author + '</p>';
  }

  function buildChapterNav (novel) {
    var nav = $('chapterNav');
    if (!nav) return;
    nav.innerHTML = novel.chapters.map(function(ch, i) {
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
    nav.querySelectorAll('.ch-btn').forEach(function(btn) {
      btn.addEventListener('mouseenter', function() {
        if (this.getAttribute('data-active') !== 'true') {
          this.style.borderColor = 'rgba(0,255,255,.15)';
          this.style.color = 'rgba(255,255,255,.8)';
        }
      });
      btn.addEventListener('mouseleave', function() {
        if (this.getAttribute('data-active') !== 'true') {
          this.style.borderColor = 'rgba(255,255,255,.06)';
          this.style.color = 'rgba(255,255,255,.5)';
        }
      });
      btn.addEventListener('click', function() {
        showChapter(currentNovel, parseInt(this.getAttribute('data-ch')));
      });
    });
  }

  function setNavActive (idx) {
    document.querySelectorAll('.ch-btn').forEach(function(btn, i) {
      var active = (i === idx);
      btn.setAttribute('data-active', active ? 'true' : 'false');
      btn.style.background  = active ? 'rgba(0,255,255,.1)'  : 'transparent';
      btn.style.borderColor = active ? 'rgba(0,255,255,.3)'  : 'rgba(255,255,255,.06)';
      btn.style.color       = active ? 'var(--primary)'      : 'rgba(255,255,255,.5)';
    });
  }

  function showChapter (novel, idx) {
    setNavActive(idx);
    var ch = novel.chapters[idx];
    if (!ch) return;
    var content = $('chapterContent');
    if (!content) return;
    content.style.opacity    = '0';
    content.style.transition = 'opacity .2s';
    setTimeout(function() {
      content.innerHTML = buildChapterHTML(novel, ch, idx);
      content.style.opacity = '1';
      _bindInteractiveWidgets();
      var prev = $('chPrev'), next = $('chNext');
      if (prev) prev.addEventListener('click', function() {
        showChapter(novel, idx-1);
        $('chapterContent').scrollIntoView({behavior:'smooth',block:'start'});
      });
      if (next) next.addEventListener('click', function() {
        showChapter(novel, idx+1);
        $('chapterContent').scrollIntoView({behavior:'smooth',block:'start'});
      });
    }, 200);
  }

  function buildChapterHTML (novel, ch, idx) {
    var bodyHTML = parseContent(ch.content);
    var hasPrev  = idx > 0;
    var hasNext  = idx < novel.chapters.length - 1;
    return (
      '<div style="margin-bottom:2.5rem;padding-bottom:1.25rem;border-bottom:1px solid rgba(255,255,255,.08);">' +
        '<div style="font-family:\'JetBrains Mono\',monospace;font-size:.58rem;color:var(--muted-foreground);letter-spacing:.12em;margin-bottom:.5rem;">CHAPTER ' + String(idx+1).padStart(2,'0') + '</div>' +
        '<h2 style="font-family:\'Space Grotesk\',sans-serif;font-size:1.35rem;font-weight:700;color:white;margin:0;">' + ch.title + '</h2>' +
      '</div>' +
      '<div style="max-width:66ch;">' + bodyHTML + '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:3rem;padding-top:1.5rem;border-top:1px solid rgba(255,255,255,.07);">' +
        (hasPrev
          ? '<button id="chPrev" style="font-family:\'JetBrains Mono\',monospace;font-size:.72rem;padding:.5rem 1.1rem;background:transparent;border:1px solid rgba(255,255,255,.12);color:rgba(255,255,255,.5);cursor:pointer;transition:all .2s;" onmouseover="this.style.borderColor=\'rgba(255,255,255,.3)\';this.style.color=\'white\'" onmouseout="this.style.borderColor=\'rgba(255,255,255,.12)\';this.style.color=\'rgba(255,255,255,.5)\'">\u2190 ' + novel.chapters[idx-1].title + '</button>'
          : '<span></span>') +
        (hasNext
          ? '<button id="chNext" style="font-family:\'JetBrains Mono\',monospace;font-size:.72rem;padding:.5rem 1.25rem;background:rgba(0,255,255,.07);border:1px solid rgba(0,255,255,.3);color:var(--primary);cursor:pointer;transition:all .2s;" onmouseover="this.style.background=\'rgba(0,255,255,.14)\'" onmouseout="this.style.background=\'rgba(0,255,255,.07)\'">' + novel.chapters[idx+1].title + ' \u2192</button>'
          : '<div style="font-family:\'JetBrains Mono\',monospace;font-size:.68rem;color:rgba(16,185,129,.7);letter-spacing:.12em;">\u2500\u2500 FIN \u2500\u2500</div>') +
      '</div>'
    );
  }

  /* ─────────────────────────────────────────────
   *  Related panel
   * ───────────────────────────────────────────── */
  function buildRelated (novel) {
    var el = $('relatedData');
    if (!el) return;
    var html = '';
    if (novel.relatedPersonnel && novel.relatedPersonnel.length) {
      html += relatedSection('\u95a2\u9023\u4eba\u54e1', novel.relatedPersonnel.map(function(id) {
        var p = getPersonnel(id);
        var name = p ? p.name : id;
        return '<a href="#/personnel-detail?id=' + id + '" style="display:flex;align-items:center;gap:.4rem;font-family:\'JetBrains Mono\',monospace;font-size:.68rem;color:rgb(245,158,11);text-decoration:none;padding:.3rem 0;border-bottom:1px solid rgba(255,255,255,.05);transition:color .15s;" onmouseover="this.style.color=\'white\'" onmouseout="this.style.color=\'rgb(245,158,11)\'">' +
          '<span style="opacity:.5;font-size:.58rem;">' + id + '</span>' +
          '<span>' + name + '</span>' +
        '</a>';
      }).join(''));
    }
    if (novel.relatedEntities && novel.relatedEntities.length) {
      html += relatedSection('\u95a2\u9023\u5b9f\u4f53', novel.relatedEntities.map(function(code) {
        var e = getEntity(code);
        var name = e ? e.name : code;
        return '<a href="#/entity-detail?id=' + (e?e.id:code) + '" style="display:flex;align-items:center;gap:.4rem;font-family:\'JetBrains Mono\',monospace;font-size:.68rem;color:rgb(168,85,247);text-decoration:none;padding:.3rem 0;border-bottom:1px solid rgba(255,255,255,.05);transition:color .15s;" onmouseover="this.style.color=\'white\'" onmouseout="this.style.color=\'rgb(168,85,247)\'">' +
          '<span style="opacity:.5;font-size:.58rem;">' + code + '</span>' +
          '<span>' + name + '</span>' +
        '</a>';
      }).join(''));
    }
    if (novel.relatedMissions && novel.relatedMissions.length) {
      html += relatedSection('\u95a2\u9023\u4efb\u52d9', novel.relatedMissions.map(function(id) {
        var m = getMission(id);
        var title = m ? m.title : id;
        return '<a href="#/mission-detail?id=' + id + '" style="display:flex;flex-direction:column;font-family:\'JetBrains Mono\',monospace;font-size:.68rem;color:rgb(239,68,68);text-decoration:none;padding:.35rem 0;border-bottom:1px solid rgba(255,255,255,.05);transition:color .15s;gap:.1rem;" onmouseover="this.style.color=\'white\'" onmouseout="this.style.color=\'rgb(239,68,68)\'">' +
          '<span style="opacity:.5;font-size:.58rem;">' + id + '</span>' +
          '<span>' + title + '</span>' +
        '</a>';
      }).join(''));
    }
    el.innerHTML = html || '<p style="font-size:.75rem;color:var(--muted-foreground);">\u95a2\u9023\u30c7\u30fc\u30bf\u306a\u3057</p>';
  }

  function relatedSection (title, inner) {
    return '<div style="margin-bottom:1.25rem;">' +
      '<div style="font-family:\'JetBrains Mono\',monospace;font-size:.58rem;color:var(--muted-foreground);letter-spacing:.1em;margin-bottom:.5rem;text-transform:uppercase;">' + title + '</div>' +
      inner +
    '</div>';
  }

  /* ─────────────────────────────────────────────
   *  Events
   * ───────────────────────────────────────────── */
  document.querySelectorAll('[data-novel-cat]').forEach(function (btn) {
    btn.addEventListener('click', function() {
      activateFilter(this.getAttribute('data-novel-cat'));
    });
  });
  var backBtn = $('backToList');
  if (backBtn) {
    backBtn.addEventListener('click', function() {
      currentNovel = null;
      setView('novelListView');
      window.scrollTo(0, 0);
    });
  }

  /* ─────────────────────────────────────────────
   *  Load
   * ───────────────────────────────────────────── */
  function init(data) {
    novels = data.novels || [];
    activateFilter('all');
    setView('novelListView');
  }

  if (window.__DATA_NOVELS_DATA) {
    init(window.__DATA_NOVELS_DATA);
  } else {
    fetch('./data/novels-data.json')
      .then(function(r){ return r.json(); })
      .then(init)
      .catch(function() {
        var grid = $('novelGrid');
        if (grid) grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:4rem;color:rgb(239,68,68);font-family:\'JetBrains Mono\',monospace;font-size:.8rem;">\u30c7\u30fc\u30bf\u306e\u8aad\u307f\u8fbc\u307f\u306b\u5931\u6557\u3057\u307e\u3057\u305f</div>';
      });
  }

})();
