(function () {
  const ACTIONS = [
    { type: 'serve', name: 'Подача', mode: 'triple' },
    { type: 'receive', name: 'Приём', mode: 'triple' },
    { type: 'attack', name: 'Атака', mode: 'triple' },
    { type: 'block', name: 'Блок', mode: 'triple' },
    { type: 'defense', name: 'Защита', mode: 'double' },
    { type: 'error', name: 'Ошибка', mode: 'single' }
  ];

  const ACTION_BY_TYPE = Object.fromEntries(ACTIONS.map((action) => [action.type, action]));
  const ACTION_RESULT_LABELS = {
    serve: { plus: 'эйс', minus: 'ошибка', slash: 'сбитый приём' },
    receive: { plus: 'качество', minus: 'ошибка', slash: 'нейтрально' },
    attack: { plus: 'очко', minus: 'ошибка', slash: 'в игре' },
    block: { plus: 'очко', minus: 'ошибка', slash: 'смягчение' },
    defense: { plus: 'качество', minus: 'ошибка' },
    error: { error: 'прочая ошибка' }
  };

  function normalizeResultCode(result) {
    const value = String(result || '').trim().toLowerCase();
    if (result === '+' || value === 'plus' || value === 'плюс' || value === 'эйс' || value === 'очко' || value === 'качество' || value === 'качественно') return 'plus';
    if (result === '-' || value === 'minus' || value === 'минус' || value === 'ошибка' || value === 'брак') return 'minus';
    if (result === '/' || value === 'slash' || value === 'neutral' || value === 'средне' || value === 'нейтрально' || value === 'сбитый приём' || value === 'сбитый прием' || value === 'смягчение' || value === 'в игре') return 'slash';
    if (value === 'error' || result === 'Ошибка' || value === 'прочая ошибка') return 'error';
    return String(result || '');
  }

  function toResultBucket(result) {
    const code = normalizeResultCode(result);
    if (code === 'plus') return 'plus';
    if (code === 'minus') return 'minus';
    if (code === 'slash') return 'neutral';
    if (code === 'error') return 'error';
    return 'neutral';
  }

  function getActionResultLabel(actionType, result) {
    const raw = String(result || '').trim().toLowerCase();
    const code = actionType === 'error' && (raw === 'ошибка' || raw === 'прочая ошибка')
      ? 'error'
      : normalizeResultCode(result);
    return ACTION_RESULT_LABELS[actionType]?.[code]
      || (code === 'plus' ? 'плюс' : code === 'minus' ? 'ошибка' : code === 'slash' ? 'нейтрально' : code || 'результат');
  }

  function getActionDisplayText(actionType, result) {
    if (actionType === 'error') return 'Прочая ошибка';
    const action = ACTION_BY_TYPE[actionType];
    return `${action?.name || 'Действие'}: ${getActionResultLabel(actionType, result)}`;
  }

  function percentage(part, total) {
    if (!total || total <= 0) return 0;
    return Math.round((part / total) * 1000) / 10;
  }

  function formatPercent(value) {
    const num = Number.isFinite(value) ? value : 0;
    return `${num.toFixed(num % 1 === 0 ? 0 : 1)}%`;
  }

  function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  function eventWeight(event) {
    const weight = Number(event?.count ?? event?.weight ?? 1);
    return Number.isFinite(weight) && weight > 0 ? weight : 0;
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

    (Array.isArray(events) ? events : []).forEach((event) => {
      if (event.actionType !== type) return;
      const weight = eventWeight(event);
      if (!weight) return;
      const bucket = toResultBucket(event.actionResult || event.resultLabel);
      stats.total += weight;
      if (type === 'error') {
        stats.errors += weight;
      } else if (bucket === 'plus') {
        stats.plus += weight;
      } else if (bucket === 'minus') {
        stats.minus += weight;
      } else {
        stats.neutral += weight;
      }
    });

    return finalizeActionStats(stats);
  }

  function groupCount(events, getKey) {
    return (Array.isArray(events) ? events : []).reduce((acc, event) => {
      const key = getKey(event) || 'Не указано';
      acc[key] = (acc[key] || 0) + eventWeight(event);
      return acc;
    }, {});
  }

  function getPlayerDisplayName(value) {
    if (window.SetkaPlayerNames) return window.SetkaPlayerNames.getPlayerDisplayName(value);
    const parts = String(value || '').trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).join(' ') || String(value || '').trim();
  }

  function filterEvents(events, teamId = '') {
    return (Array.isArray(events) ? events : [])
      .filter((event) => !teamId || !event.teamId || event.teamId === teamId);
  }

  function calculateTeamStats(events, teamId = '') {
    const safeEvents = filterEvents(events, teamId);
    const byAction = {};
    ACTIONS.forEach((action) => {
      byAction[action.type] = calculateActionStats(safeEvents, action.type);
    });

    const errorEvents = safeEvents.filter((event) => event.actionType === 'error');

    return {
      totalActions: safeEvents.reduce((sum, event) => sum + eventWeight(event), 0),
      byAction,
      excel: calculateExcelCompatibleStats(safeEvents),
      errors: {
        total: errorEvents.reduce((sum, event) => sum + eventWeight(event), 0),
        bySet: groupCount(errorEvents, (event) => event.setNumber || 'Партия не указана'),
        byPlayer: groupCount(errorEvents, (event) => getPlayerDisplayName(event.playerName || event.playerId || 'Игрок')),
        byRole: groupCount(errorEvents, (event) => event.playerRole || 'Амплуа')
      }
    };
  }

  function createExcelStats() {
    return {
      serve: {
        total: 0,
        aces: 0,
        errors: 0,
        disruptedReceive: 0,
        qualityPercent: 0,
        errorPercent: 0
      },
      receive: {
        total: 0,
        quality: 0,
        errors: 0,
        neutral: 0,
        qualityPercent: 0,
        errorPercent: 0
      },
      attack: {
        total: 0,
        points: 0,
        errors: 0,
        inPlay: 0,
        pointPercent: 0,
        errorPercent: 0
      },
      defense: {
        total: 0,
        quality: 0,
        errors: 0
      },
      block: {
        total: 0,
        points: 0,
        softTouches: 0,
        errors: 0,
        pointPercent: 0,
        softPercent: 0,
        errorPercent: 0
      },
      miscErrors: {
        total: 0
      }
    };
  }

  function finalizeExcelStats(stats) {
    stats.serve.qualityPercent = percentage(stats.serve.aces + stats.serve.disruptedReceive, stats.serve.total);
    stats.serve.errorPercent = percentage(stats.serve.errors, stats.serve.total);
    stats.receive.qualityPercent = percentage(stats.receive.quality, stats.receive.total);
    stats.receive.errorPercent = percentage(stats.receive.errors, stats.receive.total);
    stats.attack.pointPercent = percentage(stats.attack.points, stats.attack.total);
    stats.attack.errorPercent = percentage(stats.attack.errors, stats.attack.total);
    stats.block.pointPercent = percentage(stats.block.points, stats.block.total);
    stats.block.softPercent = percentage(stats.block.softTouches, stats.block.total);
    stats.block.errorPercent = percentage(stats.block.errors, stats.block.total);
    return stats;
  }

  function calculateExcelCompatibleStats(events, teamId = '') {
    const safeEvents = filterEvents(events, teamId);
    const stats = createExcelStats();

    safeEvents.forEach((event) => {
      const weight = eventWeight(event);
      if (!weight) return;
      const result = toResultBucket(event.actionResult || event.resultLabel);
      if (event.actionType === 'serve') {
        stats.serve.total += weight;
        if (result === 'plus') stats.serve.aces += weight;
        else if (result === 'minus') stats.serve.errors += weight;
        else stats.serve.disruptedReceive += weight;
      }
      if (event.actionType === 'receive') {
        stats.receive.total += weight;
        if (result === 'plus') stats.receive.quality += weight;
        else if (result === 'minus') stats.receive.errors += weight;
        else stats.receive.neutral += weight;
      }
      if (event.actionType === 'attack') {
        stats.attack.total += weight;
        if (result === 'plus') stats.attack.points += weight;
        else if (result === 'minus') stats.attack.errors += weight;
        else stats.attack.inPlay += weight;
      }
      if (event.actionType === 'defense') {
        stats.defense.total += weight;
        if (result === 'minus') stats.defense.errors += weight;
        else stats.defense.quality += weight;
      }
      if (event.actionType === 'block') {
        stats.block.total += weight;
        if (result === 'plus') stats.block.points += weight;
        else if (result === 'minus') stats.block.errors += weight;
        else stats.block.softTouches += weight;
      }
      if (event.actionType === 'error') {
        stats.miscErrors.total += weight;
      }
    });

    return finalizeExcelStats(stats);
  }

  function matchesImportedFilters(player, set, options = {}) {
    if (options.playerId && player.playerId !== options.playerId) return false;
    if (options.role && player.playerRole !== options.role && player.role !== options.role) return false;
    if (options.setNumber && String(set.setNumber) !== String(options.setNumber)) return false;
    return true;
  }

  function getImportedCalculationRows(importedStats, options = {}) {
    if (!importedStats || typeof importedStats !== 'object') return [];
    const rows = [];
    const sets = Array.isArray(importedStats.sets) ? importedStats.sets : [];

    sets.forEach((set) => {
      const players = Array.isArray(set.players) ? set.players : [];
      players.forEach((player) => {
        if (!matchesImportedFilters(player, set, options)) return;
        const base = {
          source: 'importedStats',
          teamId: player.teamId || options.teamId || '',
          matchId: options.matchId || '',
          playerId: player.playerId || '',
          playerNumber: player.playerNumber || player.number || '',
          playerName: player.playerName || player.name || '',
          playerRole: player.playerRole || player.role || '',
          setNumber: set.setNumber || 1
        };
        const push = (actionType, actionResult, count) => {
          const weight = number(count);
          if (!weight) return;
          rows.push({
            ...base,
            actionType,
            actionResult,
            count: weight,
            resultLabel: getActionResultLabel(actionType, actionResult)
          });
        };

        const receive = player.receive || {};
        const attack = player.attack || {};
        const defense = player.defense || {};
        const block = player.block || {};
        const serve = player.serve || {};
        const miscErrors = player.miscErrors || player.otherErrors || {};

        push('receive', 'plus', receive.quality);
        push('receive', 'minus', receive.error ?? receive.errors);
        push('receive', 'slash', Math.max(number(receive.total) - number(receive.quality) - number(receive.error ?? receive.errors), 0));

        push('attack', 'plus', attack.point ?? attack.points);
        push('attack', 'minus', attack.error ?? attack.errors);
        push('attack', 'slash', Math.max(number(attack.total) - number(attack.point ?? attack.points) - number(attack.error ?? attack.errors), 0));

        push('defense', 'plus', defense.quality);
        push('defense', 'minus', defense.error ?? defense.errors);

        push('block', 'plus', block.point ?? block.points);
        push('block', 'minus', block.error ?? block.errors);
        push('block', 'slash', block.soft ?? block.softTouches);

        push('serve', 'plus', serve.ace ?? serve.aces);
        push('serve', 'minus', serve.error ?? serve.errors);
        push('serve', 'slash', Math.max(number(serve.total) - number(serve.ace ?? serve.aces) - number(serve.error ?? serve.errors), 0));

        push('error', 'error', miscErrors.total ?? miscErrors.errors ?? miscErrors);
      });
    });

    return rows;
  }

  function calculateImportedExcelStats(importedStats, options = {}) {
    const stats = createExcelStats();
    const sets = Array.isArray(importedStats?.sets) ? importedStats.sets : [];

    sets.forEach((set) => {
      (set.players || []).forEach((player) => {
        if (!matchesImportedFilters(player, set, options)) return;
        const receive = player.receive || {};
        const attack = player.attack || {};
        const defense = player.defense || {};
        const block = player.block || {};
        const serve = player.serve || {};
        const miscErrors = player.miscErrors || player.otherErrors || {};

        stats.serve.total += number(serve.total);
        stats.serve.aces += number(serve.ace ?? serve.aces);
        stats.serve.errors += number(serve.error ?? serve.errors);
        stats.serve.disruptedReceive += number(serve.disruptedReceive ?? serve.disrupted);

        stats.receive.total += number(receive.total);
        stats.receive.quality += number(receive.quality);
        stats.receive.errors += number(receive.error ?? receive.errors);
        stats.receive.neutral += Math.max(number(receive.total) - number(receive.quality) - number(receive.error ?? receive.errors), 0);

        stats.attack.total += number(attack.total);
        stats.attack.points += number(attack.point ?? attack.points);
        stats.attack.errors += number(attack.error ?? attack.errors);
        stats.attack.inPlay += Math.max(number(attack.total) - number(attack.point ?? attack.points) - number(attack.error ?? attack.errors), 0);

        stats.defense.quality += number(defense.quality);
        stats.defense.errors += number(defense.error ?? defense.errors);
        stats.defense.total += number(defense.quality) + number(defense.error ?? defense.errors);

        stats.block.points += number(block.point ?? block.points);
        stats.block.softTouches += number(block.soft ?? block.softTouches);
        stats.block.errors += number(block.error ?? block.errors);
        stats.block.total += number(block.point ?? block.points) + number(block.soft ?? block.softTouches) + number(block.error ?? block.errors);

        stats.miscErrors.total += number(miscErrors.total ?? miscErrors.errors ?? miscErrors);
      });
    });

    return finalizeExcelStats(stats);
  }

  function calculateImportedTeamStats(importedStats, options = {}) {
    const rows = getImportedCalculationRows(importedStats, options);
    const stats = calculateTeamStats(rows, options.teamId || '');
    stats.excel = calculateImportedExcelStats(importedStats, options);
    return stats;
  }

  function addActionStats(target, source) {
    target.total += number(source?.total);
    target.plus += number(source?.plus);
    target.minus += number(source?.minus);
    target.neutral += number(source?.neutral);
    target.errors += number(source?.errors);
    return target;
  }

  function mergeExcelStats(statsList) {
    const merged = createExcelStats();
    statsList.forEach((item) => {
      const excel = item?.excel || item;
      if (!excel) return;
      merged.serve.total += number(excel.serve?.total);
      merged.serve.aces += number(excel.serve?.aces);
      merged.serve.errors += number(excel.serve?.errors);
      merged.serve.disruptedReceive += number(excel.serve?.disruptedReceive);
      merged.receive.total += number(excel.receive?.total);
      merged.receive.quality += number(excel.receive?.quality);
      merged.receive.errors += number(excel.receive?.errors);
      merged.receive.neutral += number(excel.receive?.neutral);
      merged.attack.total += number(excel.attack?.total);
      merged.attack.points += number(excel.attack?.points);
      merged.attack.errors += number(excel.attack?.errors);
      merged.attack.inPlay += number(excel.attack?.inPlay);
      merged.defense.total += number(excel.defense?.total);
      merged.defense.quality += number(excel.defense?.quality);
      merged.defense.errors += number(excel.defense?.errors);
      merged.block.total += number(excel.block?.total);
      merged.block.points += number(excel.block?.points);
      merged.block.softTouches += number(excel.block?.softTouches);
      merged.block.errors += number(excel.block?.errors);
      merged.miscErrors.total += number(excel.miscErrors?.total);
    });
    return finalizeExcelStats(merged);
  }

  function mergeMaps(statsList, mapName) {
    return statsList.reduce((acc, item) => {
      const map = item?.errors?.[mapName] || {};
      Object.entries(map).forEach(([key, value]) => {
        acc[key] = (acc[key] || 0) + number(value);
      });
      return acc;
    }, {});
  }

  function mergeTeamStats(statsList) {
    const items = (Array.isArray(statsList) ? statsList : []).filter(Boolean);
    if (!items.length) return calculateTeamStats([]);
    const byAction = {};
    ACTIONS.forEach((action) => {
      byAction[action.type] = finalizeActionStats(items.reduce((acc, item) => addActionStats(acc, item.byAction?.[action.type]), createActionStats(action)));
    });
    const errorTotal = items.reduce((sum, item) => sum + number(item.errors?.total), 0);
    return {
      totalActions: items.reduce((sum, item) => sum + number(item.totalActions), 0),
      byAction,
      excel: mergeExcelStats(items.map((item) => item.excel)),
      errors: {
        total: errorTotal,
        bySet: mergeMaps(items, 'bySet'),
        byPlayer: mergeMaps(items, 'byPlayer'),
        byRole: mergeMaps(items, 'byRole')
      }
    };
  }

  function eventMatchesFilters(event, filters = {}) {
    if (filters.playerId && event.playerId !== filters.playerId) return false;
    if (filters.role && event.playerRole !== filters.role) return false;
    if (filters.setNumber && String(event.setNumber || '') !== String(filters.setNumber)) return false;
    return true;
  }

  function calculateMatchStats(match, teamId = '', filters = {}) {
    if (!match) return calculateTeamStats([]);
    const matchTeamId = match.teamId || teamId || '';
    const liveEvents = filterEvents(match.events || [], teamId || matchTeamId).filter((event) => eventMatchesFilters(event, filters));
    const parts = [calculateTeamStats(liveEvents, teamId || matchTeamId)];
    if (match.importedStats) {
      parts.push(calculateImportedTeamStats(match.importedStats, {
        teamId: matchTeamId,
        matchId: match.id || match.matchId || '',
        ...filters
      }));
    }
    return mergeTeamStats(parts);
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
    ACTION_RESULT_LABELS,
    normalizeResultCode,
    toResultBucket,
    getActionResultLabel,
    getActionDisplayText,
    percentage,
    formatPercent,
    eventWeight,
    createActionStats,
    finalizeActionStats,
    calculateActionStats,
    calculateExcelCompatibleStats,
    calculateTeamStats,
    getImportedCalculationRows,
    calculateImportedExcelStats,
    calculateImportedTeamStats,
    calculateMatchStats,
    mergeTeamStats,
    summarizeActionLine
  };

  window.SetkaStatsTeam = {
    calculateTeamStats,
    calculateMatchStats
  };
})();
