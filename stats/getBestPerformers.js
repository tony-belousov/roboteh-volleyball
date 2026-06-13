(function () {
  const PROFILE_THRESHOLDS = {
    serve: 5,
    receive: 5,
    attack: 5,
    block: 1,
    defense: 1
  };

  function pct(value) {
    const number = Number.isFinite(value) ? value : 0;
    return `${Math.round(number)}%`;
  }

  function countWord(count, one, few, many) {
    const value = Math.abs(Number(count) || 0);
    const mod10 = value % 10;
    const mod100 = value % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
  }

  function totalErrorsFromStats(stats) {
    const excel = stats?.excel || {};
    return (excel.serve?.errors || 0)
      + (excel.receive?.errors || 0)
      + (excel.attack?.errors || 0)
      + (excel.defense?.errors || 0)
      + (excel.block?.errors || 0)
      + (excel.miscErrors?.total || 0);
  }

  function withBestMeta(player, line, details = '', score = 0) {
    if (!player) return null;
    return {
      ...player,
      bestLine: line,
      bestDetails: details,
      bestScore: score
    };
  }

  function byMetric(players, options) {
    const candidates = (players || []).map((player) => {
      const stats = player.teamStats || {};
      const excel = stats.excel || player.excel || {};
      return options.build(player, stats, excel);
    }).filter(Boolean);

    if (!candidates.length) return null;
    return candidates.sort(options.sort)[0].item;
  }

  function bestServe(players) {
    return byMetric(players, {
      build(player, stats, excel) {
        const serve = excel.serve || {};
        const total = serve.total || 0;
        if (total < PROFILE_THRESHOLDS.serve) return null;
        const quality = (serve.aces || 0) + (serve.disruptedReceive || 0);
        return {
          item: withBestMeta(
            player,
            `${total} ${countWord(total, 'подача', 'подачи', 'подач')} · ${pct(serve.qualityPercent)} качества`,
            `${serve.aces || 0} ${countWord(serve.aces || 0, 'эйс', 'эйса', 'эйсов')} · ${serve.disruptedReceive || 0} ${countWord(serve.disruptedReceive || 0, 'сбитый приём', 'сбитых приёма', 'сбитых приёмов')}`,
            serve.qualityPercent || 0
          ),
          total,
          qualityPercent: serve.qualityPercent || 0,
          quality
        };
      },
      sort: (a, b) => b.qualityPercent - a.qualityPercent || b.total - a.total || b.quality - a.quality
    });
  }

  function bestReceive(players) {
    return byMetric(players, {
      build(player, stats, excel) {
        const receive = excel.receive || {};
        const total = receive.total || 0;
        if (total < PROFILE_THRESHOLDS.receive) return null;
        return {
          item: withBestMeta(
            player,
            `${total} ${countWord(total, 'приём', 'приёма', 'приёмов')} · ${pct(receive.qualityPercent)} качества`,
            `${receive.quality || 0} качественных · ${receive.errors || 0} ${countWord(receive.errors || 0, 'ошибка', 'ошибки', 'ошибок')}`,
            receive.qualityPercent || 0
          ),
          total,
          qualityPercent: receive.qualityPercent || 0,
          quality: receive.quality || 0
        };
      },
      sort: (a, b) => b.qualityPercent - a.qualityPercent || b.total - a.total || b.quality - a.quality
    });
  }

  function bestAttack(players) {
    return byMetric(players, {
      build(player, stats, excel) {
        const attack = excel.attack || {};
        const total = attack.total || 0;
        if (total < PROFILE_THRESHOLDS.attack) return null;
        return {
          item: withBestMeta(
            player,
            `${total} ${countWord(total, 'атака', 'атаки', 'атак')} · ${pct(attack.pointPercent)} реализации`,
            `${attack.points || 0} ${countWord(attack.points || 0, 'очко', 'очка', 'очков')} · ${attack.errors || 0} ${countWord(attack.errors || 0, 'ошибка', 'ошибки', 'ошибок')}`,
            attack.pointPercent || 0
          ),
          total,
          pointPercent: attack.pointPercent || 0,
          points: attack.points || 0
        };
      },
      sort: (a, b) => b.pointPercent - a.pointPercent || b.total - a.total || b.points - a.points
    });
  }

  function bestBlock(players) {
    return byMetric(players, {
      build(player, stats, excel) {
        const block = excel.block || {};
        const total = block.total || 0;
        if (total < PROFILE_THRESHOLDS.block) return null;
        return {
          item: withBestMeta(
            player,
            `${total} ${countWord(total, 'действие', 'действия', 'действий')} на блоке · ${pct(block.pointPercent)} очков`,
            `${block.points || 0} блок-очков · ${block.softTouches || 0} ${countWord(block.softTouches || 0, 'смягчение', 'смягчения', 'смягчений')}`,
            block.points || 0
          ),
          total,
          points: block.points || 0,
          pointPercent: block.pointPercent || 0
        };
      },
      sort: (a, b) => b.points - a.points || b.pointPercent - a.pointPercent || b.total - a.total
    });
  }

  function bestDefense(players) {
    return byMetric(players, {
      build(player, stats, excel) {
        const defense = excel.defense || {};
        const total = defense.total || 0;
        if (total < PROFILE_THRESHOLDS.defense) return null;
        const qualityPercent = window.SetkaStatsCore.percentage(defense.quality || 0, total);
        return {
          item: withBestMeta(
            player,
            `${total} ${countWord(total, 'действие', 'действия', 'действий')} в защите · ${pct(qualityPercent)} качества`,
            `${defense.quality || 0} качественных · ${defense.errors || 0} ${countWord(defense.errors || 0, 'ошибка', 'ошибки', 'ошибок')}`,
            defense.quality || 0
          ),
          total,
          quality: defense.quality || 0,
          qualityPercent
        };
      },
      sort: (a, b) => b.quality - a.quality || b.qualityPercent - a.qualityPercent || b.total - a.total
    });
  }

  function mostActive(players) {
    const player = (players || []).filter((item) => item.totalActions > 0)
      .sort((a, b) => b.totalActions - a.totalActions)[0];
    if (!player) return null;
    return withBestMeta(player, `${player.totalActions} действий всего`, 'все игровые действия и ошибки', player.totalActions);
  }

  function lowestErrors(players) {
    const candidates = (players || []).map((player) => {
      const totalActions = player.totalActions || 0;
      const hasProfileLoad = window.SetkaStatsCore.ACTIONS
        .filter((action) => action.type !== 'error')
        .some((action) => (player.byAction?.[action.type]?.total || 0) >= 5);
      if (totalActions < 10 && !hasProfileLoad) return null;
      const errors = totalErrorsFromStats(player.teamStats || { excel: player.excel });
      const errorRate = window.SetkaStatsCore.percentage(errors, totalActions);
      return {
        player,
        errors,
        errorRate,
        totalActions
      };
    }).filter(Boolean);

    if (!candidates.length) return null;
    const best = candidates.sort((a, b) => a.errorRate - b.errorRate || a.errors - b.errors || b.totalActions - a.totalActions)[0];
    return withBestMeta(
      best.player,
      `${best.errors} ${countWord(best.errors, 'ошибка', 'ошибки', 'ошибок')} · ${pct(best.errorRate)} брака`,
      `${best.totalActions} действий всего`,
      -best.errorRate
    );
  }

  function decorateMatch(match, stats, line, details = '') {
    if (!match) return null;
    return {
      ...match,
      bestLine: line,
      bestDetails: details,
      bestTeamStats: stats
    };
  }

  function errorRate(stats) {
    return window.SetkaStatsCore.percentage(totalErrorsFromStats(stats), stats?.totalActions || 0);
  }

  function bestTeamMatch(teamRows) {
    const rows = (teamRows || []).filter((row) => row.stats.totalActions > 0);
    if (!rows.length) return null;
    const best = rows.slice().sort((a, b) => {
      const aScore = (a.stats.excel.serve.qualityPercent || 0) + (a.stats.excel.receive.qualityPercent || 0) + (a.stats.excel.attack.pointPercent || 0) - errorRate(a.stats);
      const bScore = (b.stats.excel.serve.qualityPercent || 0) + (b.stats.excel.receive.qualityPercent || 0) + (b.stats.excel.attack.pointPercent || 0) - errorRate(b.stats);
      return bScore - aScore || b.stats.totalActions - a.stats.totalActions;
    })[0];
    return decorateMatch(
      best.match,
      best.stats,
      `${pct(best.stats.excel.serve.qualityPercent)} подачи · ${pct(best.stats.excel.attack.pointPercent)} атаки`,
      `${best.stats.totalActions} действий · ${totalErrorsFromStats(best.stats)} ошибок`
    );
  }

  function lowestErrorMatch(teamRows) {
    const rows = (teamRows || []).filter((row) => row.stats.totalActions > 0);
    if (!rows.length) return null;
    const best = rows.slice().sort((a, b) => errorRate(a.stats) - errorRate(b.stats) || totalErrorsFromStats(a.stats) - totalErrorsFromStats(b.stats))[0];
    const errors = totalErrorsFromStats(best.stats);
    return decorateMatch(
      best.match,
      best.stats,
      `${errors} ${countWord(errors, 'ошибка', 'ошибки', 'ошибок')} · ${pct(errorRate(best.stats))} брака`,
      `${best.stats.totalActions} действий всего`
    );
  }

  function bestSetByMetric(setCandidates, actionType, percentKey, totalLabel, percentLabel) {
    const candidates = (setCandidates || []).map((item) => {
      const stats = item.set.teamStats.byAction[actionType];
      if (!stats || stats.total <= 0) return null;
      return { ...item, actionStats: stats };
    }).filter(Boolean);
    if (!candidates.length) return null;
    const best = candidates.sort((a, b) => (b.actionStats[percentKey] || 0) - (a.actionStats[percentKey] || 0) || b.actionStats.total - a.actionStats.total)[0];
    return {
      ...best,
      bestLine: `${best.actionStats.total} ${totalLabel(best.actionStats.total)} · ${pct(best.actionStats[percentKey] || 0)} ${percentLabel}`,
      bestDetails: `${best.set.totalActions} действий в партии`
    };
  }

  function getBestPerformers(matches, teamId = '') {
    const safeMatches = (Array.isArray(matches) ? matches : [])
      .filter((match) => !teamId || !match.teamId || match.teamId === teamId);
    const players = window.SetkaStatsPlayers.calculatePlayerStats(safeMatches, teamId);
    const teamRows = safeMatches.map((match) => ({
      match,
      stats: window.SetkaStatsCore.calculateMatchStats(match, teamId)
    }));

    const setCandidates = safeMatches.flatMap((match) => {
      const setStats = window.SetkaStatsSets.calculateSetStats(match, teamId);
      return setStats.sets.map((set) => ({ match, set }));
    });

    return {
      serve: bestServe(players),
      receive: bestReceive(players),
      attack: bestAttack(players),
      block: bestBlock(players),
      defense: bestDefense(players),
      mostActive: mostActive(players),
      lowestErrors: lowestErrors(players),
      bestTeamMatch: bestTeamMatch(teamRows),
      lowestErrorMatch: lowestErrorMatch(teamRows),
      bestAttackSet: bestSetByMetric(setCandidates, 'attack', 'plusPercent', (total) => countWord(total, 'атака', 'атаки', 'атак'), 'реализации'),
      bestReceiveSet: bestSetByMetric(setCandidates, 'receive', 'plusPercent', (total) => countWord(total, 'приём', 'приёма', 'приёмов'), 'качества'),
      enoughData: safeMatches.length > 0 && players.some((player) => player.totalActions >= 5)
    };
  }

  window.SetkaStatsBest = {
    getBestPerformers,
    totalErrorsFromStats
  };
})();
