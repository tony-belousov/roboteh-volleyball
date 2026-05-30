(function () {
  function enough(player, actionType) {
    const total = player.byAction?.[actionType]?.total || 0;
    return total >= 3;
  }

  function bestByAction(players, actionType) {
    const candidates = (players || []).filter((player) => enough(player, actionType));
    if (!candidates.length) return null;
    return candidates.sort((a, b) => {
      const ap = a.byAction[actionType]?.plusPercent || 0;
      const bp = b.byAction[actionType]?.plusPercent || 0;
      return bp - ap || b.totalActions - a.totalActions;
    })[0];
  }

  function getBestPerformers(matches, teamId = '') {
    const safeMatches = (Array.isArray(matches) ? matches : [])
      .filter((match) => !teamId || !match.teamId || match.teamId === teamId);
    const players = window.SetkaStatsPlayers.calculatePlayerStats(safeMatches, teamId);
    const activePlayers = players.filter((player) => player.totalActions >= 5);
    const teamRows = safeMatches.map((match) => ({
      match,
      stats: window.SetkaStatsCore.calculateTeamStats((match.events || []).filter((event) => !teamId || !event.teamId || event.teamId === teamId))
    }));

    const lowestErrors = activePlayers.slice().sort((a, b) => a.errors - b.errors || b.totalActions - a.totalActions)[0] || null;
    const bestTeamMatch = teamRows.slice().sort((a, b) => b.stats.totalActions - a.stats.totalActions)[0]?.match || null;
    const lowestErrorMatch = teamRows.slice().sort((a, b) => {
      const ae = a.stats.byAction.error?.total || 0;
      const be = b.stats.byAction.error?.total || 0;
      return ae - be;
    })[0]?.match || null;

    const setCandidates = safeMatches.flatMap((match) => {
      const setStats = window.SetkaStatsSets.calculateSetStats(match);
      return setStats.sets.map((set) => ({ match, set }));
    });

    const bestAttackSet = setCandidates.slice().sort((a, b) => {
      return (b.set.teamStats.byAction.attack?.plusPercent || 0) - (a.set.teamStats.byAction.attack?.plusPercent || 0);
    })[0] || null;
    const bestReceiveSet = setCandidates.slice().sort((a, b) => {
      return (b.set.teamStats.byAction.receive?.plusPercent || 0) - (a.set.teamStats.byAction.receive?.plusPercent || 0);
    })[0] || null;

    return {
      serve: bestByAction(players, 'serve'),
      receive: bestByAction(players, 'receive'),
      attack: bestByAction(players, 'attack'),
      block: bestByAction(players, 'block'),
      defense: bestByAction(players, 'defense'),
      mostActive: players[0] || null,
      lowestErrors,
      bestTeamMatch,
      lowestErrorMatch,
      bestAttackSet,
      bestReceiveSet,
      enoughData: safeMatches.length > 0 && players.some((player) => player.totalActions >= 5)
    };
  }

  window.SetkaStatsBest = {
    getBestPerformers
  };
})();
