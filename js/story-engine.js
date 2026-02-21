/**
 * 海蝕機関 Story Engine
 * ─────────────────────────────────────────────────────────────────────────
 * トリガー種類:
 *   chat_keyword       - チャットに特定文言が含まれる
 *   page_visit         - 特定ページを訪問する
 *   view_history_type  - 特定カテゴリの閲覧数が閾値を超える
 *   variable_threshold - 内部変数が閾値に達する
 *   flag_set           - フラグが立った時
 *   time_elapsed       - セッション開始からの経過時間(秒)
 *   sequence           - イベントが特定順序で発生した時
 * ─────────────────────────────────────────────────────────────────────────
 */
var StoryEngine = (function () {
  'use strict';

  // ───────────────────────────────────────────
  // State
  // ───────────────────────────────────────────
  var STATE_KEY = 'kaishoku_story_state';
  var SESSION_START = Date.now();

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STATE_KEY)) || {
        flags: {},
        variables: {},
        history: [],  // [{ eventId, time }]
        firedSet: {}  // eventId -> true (重複防止)
      };
    } catch (e) {
      return { flags: {}, variables: {}, history: [], firedSet: {} };
    }
  }

  function saveState(state) {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  }

  function getState() { return loadState(); }

  function setFlag(flag, value) {
    var s = loadState();
    s.flags[flag] = (value === undefined ? true : value);
    saveState(s);
    // フラグセットトリガーを即時チェック
    setTimeout(function () { checkFlagTriggers(flag); }, 0);
  }

  function getFlag(flag) { return loadState().flags[flag] || false; }

  function addVariable(key, delta) {
    var s = loadState();
    if (!s.variables[key]) s.variables[key] = 0;
    s.variables[key] += delta;
    saveState(s);
  }

  function setVariable(key, value) {
    var s = loadState();
    s.variables[key] = value;
    saveState(s);
  }

  function getVariable(key) { return loadState().variables[key] || 0; }

  function logEvent(eventId) {
    var s = loadState();
    s.history.push({ eventId: eventId, time: Date.now() });
    s.firedSet[eventId] = true;
    saveState(s);
  }

  function hasFired(eventId) { return !!loadState().firedSet[eventId]; }

  function getHistory() { return loadState().history; }

  // ───────────────────────────────────────────
  // イベント定義
  // ───────────────────────────────────────────
  var EVENTS = [

    // ==============================
    // チャット文言トリガー
    // ==============================
    {
      id: 'E_CHAT_KAISOKU',
      once: true,
      trigger: { type: 'chat_keyword', value: '海は削れている' },
      conditions: {},
      effects: [
        { addVariable: { anomaly_score: 5 } },
        { setFlag: 'keyword_kaisoku_heard' },
        { notify: { message: '[SYSTEM] 異常語彙を検出。スコア+5', level: 'warn' } }
      ]
    },
    {
      id: 'E_CHAT_KAISOKU_2ND',
      once: false,
      trigger: { type: 'chat_keyword', value: '海は削れている' },
      conditions: { flag: 'keyword_kaisoku_heard', equals: true },
      effects: [
        { addVariable: { anomaly_score: 2 } },
        { notify: { message: '[SYSTEM] 繰り返し検出。スコア+2', level: 'warn' } }
      ]
    },
    {
      id: 'E_CHAT_SHINSOKU',
      once: true,
      trigger: { type: 'chat_keyword', value: '収束' },
      conditions: {},
      effects: [
        { addVariable: { anomaly_score: 2 } },
        { setFlag: 'keyword_shinsoku_heard' }
      ]
    },
    {
      id: 'E_CHAT_PROJECT_KAISOKU',
      once: true,
      trigger: { type: 'chat_keyword', value: '海蝕プロジェクト' },
      conditions: {},
      effects: [
        { addVariable: { anomaly_score: 8 } },
        { setFlag: 'keyword_project_heard' },
        { notify: { message: '[ALERT] 機密事項への言及を検出。スコア+8', level: 'error' } }
      ]
    },
    {
      id: 'E_CHAT_NISHIDOU',
      once: true,
      trigger: { type: 'chat_keyword', value: '西堂' },
      conditions: {},
      effects: [
        { addVariable: { anomaly_score: 3 } },
        { setFlag: 'keyword_nishidou_heard' }
      ]
    },
    {
      id: 'E_CHAT_JIKUU',
      once: true,
      trigger: { type: 'chat_keyword', value: '次元' },
      conditions: {},
      effects: [
        { addVariable: { anomaly_score: 2 } },
        { setFlag: 'keyword_jikuu_heard' }
      ]
    },
    {
      id: 'E_CHAT_KANSHISA',
      once: true,
      trigger: { type: 'chat_keyword', value: '監視されている' },
      conditions: {},
      effects: [
        { addVariable: { anomaly_score: 6 } },
        { setFlag: 'paranoia_active' },
        { notify: { message: '[SYSTEM] 不安定なパターンを検出', level: 'warn' } }
      ]
    },
    {
      id: 'E_CHAT_FUIN',
      once: true,
      trigger: { type: 'chat_keyword', value: '封印' },
      conditions: { flag: 'keyword_kaisoku_heard', equals: true },
      effects: [
        { addVariable: { anomaly_score: 5 } },
        { setFlag: 'keyword_fuin_heard' }
      ]
    },
    {
      id: 'E_CHAT_CHAPTER2_KEY',
      once: true,
      trigger: { type: 'chat_keyword', value: '観測者は存在しない' },
      conditions: { flag: 'chapter1_open', equals: true },
      effects: [
        { addVariable: { anomaly_score: 10 } },
        { setFlag: 'chapter2_open' },
        { notify: { message: '[CRITICAL] 特定語彙の連鎖を検出。フェーズ移行', level: 'error' } }
      ]
    },

    // ==============================
    // ページ訪問トリガー
    // ==============================
    {
      id: 'E_PAGE_ENTITIES',
      once: true,
      trigger: { type: 'page_visit', page: 'entities' },
      conditions: {},
      effects: [
        { addVariable: { anomaly_score: 1 } },
        { setFlag: 'visited_entities' }
      ]
    },
    {
      id: 'E_PAGE_CLASSIFIED',
      once: true,
      trigger: { type: 'page_visit', page: 'classified' },
      conditions: {},
      effects: [
        { addVariable: { anomaly_score: 3 } },
        { setFlag: 'visited_classified' },
        { notify: { message: '[SYSTEM] 機密ファイルへのアクセスを記録', level: 'warn' } }
      ]
    },
    {
      id: 'E_PAGE_CLASSIFIED_2ND',
      once: false,
      trigger: { type: 'page_visit', page: 'classified' },
      conditions: { flag: 'visited_classified', equals: true },
      effects: [
        { addVariable: { anomaly_score: 1 } }
      ]
    },
    {
      id: 'E_PAGE_AGENCY_HISTORY',
      once: true,
      trigger: { type: 'page_visit', page: 'agency-history' },
      conditions: {},
      effects: [
        { addVariable: { anomaly_score: 2 } },
        { setFlag: 'visited_history' }
      ]
    },
    {
      id: 'E_PAGE_CONSOLE',
      once: true,
      trigger: { type: 'page_visit', page: 'console' },
      conditions: {},
      effects: [
        { addVariable: { anomaly_score: 4 } },
        { setFlag: 'visited_console' },
        { notify: { message: '[SYSTEM] コンソールへのアクセスを記録', level: 'warn' } }
      ]
    },
    {
      id: 'E_PAGE_STATISTICS',
      once: true,
      trigger: { type: 'page_visit', page: 'statistics' },
      conditions: {},
      effects: [
        { addVariable: { anomaly_score: 1 } },
        { setFlag: 'visited_statistics' }
      ]
    },
    {
      id: 'E_PAGE_MAP_AFTER_ENTITY',
      once: true,
      trigger: { type: 'page_visit', page: 'map' },
      conditions: { flag: 'visited_entities', equals: true },
      effects: [
        { addVariable: { anomaly_score: 3 } },
        { setFlag: 'map_entities_crossref' }
      ]
    },

    // ==============================
    // 閲覧履歴カテゴリトリガー
    // ==============================
    {
      id: 'E_HISTORY_ENTITY_3',
      once: true,
      trigger: { type: 'view_history_type', historyType: 'entity', gte: 3 },
      conditions: {},
      effects: [
        { addVariable: { anomaly_score: 5 } },
        { setFlag: 'entity_researcher' },
        { notify: { message: '[SYSTEM] 海蝕実体への過剰な関心を検出', level: 'warn' } }
      ]
    },
    {
      id: 'E_HISTORY_ENTITY_7',
      once: true,
      trigger: { type: 'view_history_type', historyType: 'entity', gte: 7 },
      conditions: {},
      effects: [
        { addVariable: { anomaly_score: 8 } },
        { setFlag: 'entity_obsession' },
        { notify: { message: '[ALERT] 実体データへの強迫的アクセス。要監視', level: 'error' } }
      ]
    },
    {
      id: 'E_HISTORY_MISSION_5',
      once: true,
      trigger: { type: 'view_history_type', historyType: 'mission', gte: 5 },
      conditions: {},
      effects: [
        { addVariable: { anomaly_score: 3 } },
        { setFlag: 'mission_analyst' }
      ]
    },
    {
      id: 'E_HISTORY_CLASSIFIED_2',
      once: true,
      trigger: { type: 'view_history_type', historyType: 'classified', gte: 2 },
      conditions: {},
      effects: [
        { addVariable: { anomaly_score: 6 } },
        { setFlag: 'classified_hunter' },
        { notify: { message: '[ALERT] 機密文書へのパターン的アクセス検出', level: 'error' } }
      ]
    },

    // ==============================
    // 変数閾値トリガー (重複実行防止済み)
    // ==============================
    {
      id: 'E_THRESH_ANOMALY_10',
      once: true,
      trigger: { type: 'variable_threshold', variable: 'anomaly_score', gte: 10 },
      conditions: {},
      effects: [
        { setFlag: 'chapter1_open' },
        { notify: { message: '[SYSTEM] 異常スコアが臨界点を突破。第1フェーズ移行', level: 'warn' } }
      ]
    },
    {
      id: 'E_THRESH_ANOMALY_20',
      once: true,
      trigger: { type: 'variable_threshold', variable: 'anomaly_score', gte: 20 },
      conditions: {},
      effects: [
        { setFlag: 'deep_anomaly' },
        { addVariable: { observer_load: 30 } },
        { notify: { message: '[CRITICAL] 深部異常検出。観測者負荷増大', level: 'error' } }
      ]
    },
    {
      id: 'E_THRESH_ANOMALY_35',
      once: true,
      trigger: { type: 'variable_threshold', variable: 'anomaly_score', gte: 35 },
      conditions: {},
      effects: [
        { setFlag: 'world_collapse_imminent' },
        { notify: { message: '[SYSTEM FAILURE] 構造崩壊の予兆を検出', level: 'error' } }
      ]
    },
    {
      id: 'E_THRESH_ANOMALY_50',
      once: true,
      trigger: { type: 'variable_threshold', variable: 'anomaly_score', gte: 50 },
      conditions: {},
      effects: [
        { setFlag: 'world_collapse' },
        { notify: { message: '[CRITICAL] 世界構造の崩壊が開始された', level: 'error' } }
      ]
    },
    {
      id: 'E_THRESH_OBSERVER_80',
      once: true,
      trigger: { type: 'variable_threshold', variable: 'observer_load', gte: 80 },
      conditions: {},
      effects: [
        { setFlag: 'observer_overload' },
        { notify: { message: '[CRITICAL] 観測者負荷が限界値を超過', level: 'error' } }
      ]
    },

    // ==============================
    // シーケンストリガー (複数イベントの組み合わせ)
    // ==============================
    {
      id: 'E_SEQ_RESEARCH_PATH',
      once: true,
      trigger: {
        type: 'sequence',
        required: ['E_PAGE_ENTITIES', 'E_PAGE_AGENCY_HISTORY', 'E_HISTORY_ENTITY_3']
      },
      conditions: {},
      effects: [
        { setFlag: 'researcher_path_unlocked' },
        { addVariable: { anomaly_score: 5 } },
        { notify: { message: '[SYSTEM] 特定の調査パターンを検出。内部記録を更新', level: 'warn' } }
      ]
    },
    {
      id: 'E_SEQ_PARANOIA_PATH',
      once: true,
      trigger: {
        type: 'sequence',
        required: ['E_CHAT_KANSHISA', 'E_PAGE_CLASSIFIED', 'E_CHAT_FUIN']
      },
      conditions: {},
      effects: [
        { setFlag: 'paranoia_path_unlocked' },
        { addVariable: { anomaly_score: 8 } },
        { notify: { message: '[ALERT] 精神的不安定パターンを検出', level: 'error' } }
      ]
    },

    // ==============================
    // 経過時間トリガー
    // ==============================
    {
      id: 'E_TIME_5MIN',
      once: true,
      trigger: { type: 'time_elapsed', seconds: 300 },
      conditions: {},
      effects: [
        { addVariable: { observer_load: 10 } },
        { setFlag: 'long_session' }
      ]
    },
    {
      id: 'E_TIME_15MIN',
      once: true,
      trigger: { type: 'time_elapsed', seconds: 900 },
      conditions: {},
      effects: [
        { addVariable: { observer_load: 25 } },
        { addVariable: { anomaly_score: 3 } },
        { setFlag: 'very_long_session' },
        { notify: { message: '[SYSTEM] 長時間セッションを検出。観測者負荷増大', level: 'warn' } }
      ]
    }

  ];

  // ───────────────────────────────────────────
  // 条件評価
  // ───────────────────────────────────────────
  function evaluateConditions(conditions) {
    if (!conditions || Object.keys(conditions).length === 0) return true;

    if ('flag' in conditions && 'equals' in conditions) {
      return getFlag(conditions.flag) === conditions.equals;
    }
    if ('variable' in conditions) {
      var val = getVariable(conditions.variable);
      if (conditions.gte !== undefined) return val >= conditions.gte;
      if (conditions.lte !== undefined) return val <= conditions.lte;
    }
    return false;
  }

  // ───────────────────────────────────────────
  // エフェクト適用
  // ───────────────────────────────────────────
  function applyEffects(effects) {
    effects.forEach(function (effect) {
      if (effect.setFlag) setFlag(effect.setFlag);

      if (effect.addVariable) {
        Object.keys(effect.addVariable).forEach(function (k) {
          addVariable(k, effect.addVariable[k]);
        });
      }

      if (effect.setVariable) {
        Object.keys(effect.setVariable).forEach(function (k) {
          setVariable(k, effect.setVariable[k]);
        });
      }

      if (effect.notify) {
        showNotification(effect.notify.message, effect.notify.level);
      }
    });
  }

  // ───────────────────────────────────────────
  // 通知表示
  // ───────────────────────────────────────────
  function showNotification(message, level) {
    // NotificationSystem が存在する場合はそちらへ委譲
    if (typeof NotificationSystem !== 'undefined') {
      NotificationSystem.notifySystem(message, level || 'info');
      return;
    }
    // フォールバック: NotificationSystem 未読み込み時は window イベントで通知
    window.dispatchEvent(new CustomEvent('kaishoku:story:notify', {
      detail: { message: message, level: level || 'info' }
    }));
  }

  // ───────────────────────────────────────────
  // トリガーマッチ
  // ───────────────────────────────────────────
  function matchTrigger(trigger, type, payload) {
    if (trigger.type !== type) return false;

    switch (type) {
      case 'chat_keyword':
        return payload && typeof payload === 'string' && payload.includes(trigger.value);

      case 'page_visit':
        return payload === trigger.page;

      case 'view_history_type':
        if (typeof ViewHistory === 'undefined') return false;
        var hist = ViewHistory.load();
        var count = hist.filter(function (h) { return h.type === trigger.historyType; }).length;
        return count >= trigger.gte;

      case 'variable_threshold':
        return getVariable(trigger.variable) >= trigger.gte;

      case 'flag_set':
        return payload === trigger.flag && getFlag(trigger.flag);

      case 'time_elapsed':
        return (Date.now() - SESSION_START) / 1000 >= trigger.seconds;

      case 'sequence':
        var hist2 = getHistory();
        var firedIds = hist2.map(function (h) { return h.eventId; });
        return trigger.required.every(function (id) { return firedIds.indexOf(id) !== -1; });

      default:
        return false;
    }
  }

  // ───────────────────────────────────────────
  // イベント処理コア
  // ───────────────────────────────────────────
  function processEvents(type, payload) {
    EVENTS.forEach(function (event) {
      // once フラグがあり既に実行済みならスキップ
      if (event.once && hasFired(event.id)) return;

      if (!matchTrigger(event.trigger, type, payload)) return;
      if (!evaluateConditions(event.conditions)) return;

      applyEffects(event.effects);
      logEvent(event.id);

      // シーケンス条件として使われうる非oneceイベントも履歴には残す
    });
  }

  // ───────────────────────────────────────────
  // 閲覧履歴トリガーのフック
  // フラグセット後に呼ばれる内部関数
  // ───────────────────────────────────────────
  function checkFlagTriggers(flagName) {
    processEvents('flag_set', flagName);
  }

  // ───────────────────────────────────────────
  // 定期ポーリング (variable_threshold / time_elapsed / sequence)
  // ───────────────────────────────────────────
  setInterval(function () {
    processEvents('variable_threshold', null);
    processEvents('time_elapsed', null);
    processEvents('sequence', null);
    // 閲覧履歴タイプも定期チェック
    ['entity', 'mission', 'module', 'location', 'personnel', 'classified'].forEach(function (t) {
      processEvents('view_history_type', null);
    });
  }, 3000);

  // ───────────────────────────────────────────
  // 公開API
  // ───────────────────────────────────────────
  return {
    // チャット文言チェック
    onChat: function (text) {
      processEvents('chat_keyword', text);
    },

    // ページ訪問チェック
    onPageVisit: function (pageKey) {
      processEvents('page_visit', pageKey);
    },

    // 閲覧履歴記録後に呼ぶ
    onViewHistory: function () {
      processEvents('view_history_type', null);
      processEvents('sequence', null);
    },

    // デバッグ用: 現在のストーリー状態を返す
    getDebugState: function () {
      return {
        state: loadState(),
        sessionElapsedSec: Math.floor((Date.now() - SESSION_START) / 1000)
      };
    },

    // フラグ直接読み取り (他のモジュール向け)
    getFlag: getFlag,
    getVariable: getVariable,
    hasFired: hasFired,

    // 手動でフラグ/変数を設定 (デバッグ用)
    _setFlag: setFlag,
    _addVariable: addVariable,

    // イベント一覧 (デバッグ用)
    _events: EVENTS
  };
})();
