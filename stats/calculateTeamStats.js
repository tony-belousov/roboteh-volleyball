(function () {
  const ACTIONS = [
    { type: 'serve', name: 'Подача', mode: 'triple' },
    { type: 'receive', name: 'Приём', mode: 'triple' },
    { type: 'attack', name: 'Атака', mode: 'triple' },
    { type: 'block', name: 'Блок', mode: 'double' },
    { type: 'defense', name: 'Защита', mode: 'double' },
    { type: 'error', name: 'Ошибка', mode: 'single' }
  ];

  const ACTION_BY_TYPE = Object.fromEntries(ACTIONS.map((action) => [action.type, action]));

  function toResultBucket(result) {
    if (result === '+' || result === 'plus' || result === 'плюс') return 'plus';
    if (result === '-' || result === 'minus' || result === 'минус') return 'minus';
    if (result === '/' || result === 'slash' || result === 'neutral' || result === 'средне') return 'neutral';
    if (result === 'error' || result === 'Ошибка') return 'error';
    return 'neutral';
  }

  function percentage(part, total) {
    if (!total || total <= 0) return 0;
    return Math.round((part / total) * 1000) / 10;
  }

  function formatPercent(value) {
    const num = Number.isFinite(value) ? value : 0;
    return `${num.toFixed(num % 1 === 0 ? 0 : 1)}%`;
  }

  function createActionStats(action) {
    return {
      type: action.type,
      name: action.name,
      mode: action.mode,
      total: 0,
      plus: 0,
      minus: 0,
      neutral: 0,
      errors: 0,
      plusPercent: 0,
      minusPercent: 0,
      neutralPercent: 0
    };
  }

  function finalizeActionStats(stats) {
    const total = stats.total || 0;
    stats.plusPercent = percentage(stats.plus, total);
    stats.minusPercent = percentage(stats.minus, total);
    stats.neutralPercent = percentage(stats.neutral, total);
    return stats;
  }

  function calculateActionStats(events, type) {
    const action = ACTION_BY_TYPE[type];
    if (!action) return null;
    const stats = createActionStats(action);

    events.forEach((event) => {
      if (event.actionType !== type) return;
      const bucket = toResultBucket(event.actionResult || event.resultLabel);
      stats.total += 1;
      if (type === 'error') {
        stats.errors += 1;
      } else if (bucket === 'plus') {
        stats.plus += 1;
      } else if (bucket === 'minus') {
        stats.minus += 1;
      } else {
        stats.neutral += 1;
      }
    });

    return finalizeActionStats(stats);
  }

  function groupCount(events, getKey) {
    return events.reduce((acc, event) => {
      const key = getKey(event) || 'Не указано';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  function calculateTeamStats(events, teamId = '') {
    const safeEvents = (Array.isArray(events) ? events : [])
      .filter((event) => !teamId || !event.teamId || event.teamId === teamId);
    const byAction = {};
    ACTIONS.forEach((action) => {
      byAction[action.type] = calculateActionStats(safeEvents, action.type);
    });

    const errorEvents = safeEvents.filter((event) => event.actionType === 'error');

    return {
      totalActions: safeEvents.length,
      byAction,
      errors: {
        total: errorEvents.length,
        bySet: groupCount(errorEvents, (event) => event.setNumber || 'Без партии'),
        byPlayer: groupCount(errorEvents, (event) => event.playerName || event.playerId || 'Игрок'),
        byRole: groupCount(errorEvents, (event) => event.playerRole || 'Амплуа')
      }
    };
  }

  function summarizeActionLine(actionStats) {
    if (!actionStats) return '0';
    if (actionStats.type === 'error') return `${actionStats.total}`;
    if (actionStats.mode === 'double') {
      return `${actionStats.total} · +${formatPercent(actionStats.plusPercent)} / -${formatPercent(actionStats.minusPercent)}`;
    }
    return `${actionStats.total} · +${formatPercent(actionStats.plusPercent)} / -${formatPercent(actionStats.minusPercent)} / /${formatPercent(actionStats.neutralPercent)}`;
  }

  window.SetkaStatsCore = {
    ACTIONS,
    ACTION_BY_TYPE,
    toResultBucket,
    percentage,
    formatPercent,
    createActionStats,
    finalizeActionStats,
    calculateActionStats,
    calculateTeamStats,
    summarizeActionLine
  };

  window.SetkaStatsTeam = {
    calculateTeamStats
  };
})();
