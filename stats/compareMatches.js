(function () {
  function compareMatches(matches, teamId = '') {
    const safeMatches = (Array.isArray(matches) ? matches.filter(Boolean) : [])
      .filter((match) => !teamId || !match.teamId || match.teamId === teamId);
    if (safeMatches.length < 2) {
      return {
        available: false,
        reason: 'Недостаточно данных для сравнения',
        rows: [],
        bestPlayers: [],
        problemZones: []
      };
    }

    const rows = safeMatches.map((match) => {
      const teamStats = window.SetkaStatsCore.calculateTeamStats((match.events || []).filter((event) => !teamId || !event.teamId || event.teamId === teamId));
      return {
        matchId: match.id,
        date: match.date,
        opponent: match.opponent,
        tournament: match.tournament,
        venue: match.location || match.venue,
        location: match.location || match.venue,
        result: match.result || '',
        finalScore: match.finalScore,
        totalActions: teamStats.totalActions,
        serve: teamStats.byAction.serve,
        receive: teamStats.byAction.receive,
        attack: teamStats.byAction.attack,
        block: teamStats.byAction.block,
        defense: teamStats.byAction.defense,
        errors: teamStats.byAction.error
      };
    });

    const allPlayerStats = window.SetkaStatsPlayers.calculatePlayerStats(safeMatches, teamId);
    const problemZones = window.SetkaStatsCore.ACTIONS
      .filter((action) => action.type !== 'error')
      .map((action) => {
        const stats = window.SetkaStatsCore.calculateActionStats(safeMatches.flatMap((match) => match.events || []).filter((event) => !teamId || !event.teamId || event.teamId === teamId), action.type);
        return { action: action.name, minusPercent: stats.minusPercent, total: stats.total };
      })
      .sort((a, b) => b.minusPercent - a.minusPercent)
      .slice(0, 3);

    return {
      available: true,
      rows,
      bestPlayers: allPlayerStats.slice(0, 5),
      problemZones
    };
  }

  function compareLast(matches, count, teamId = '') {
    return compareMatches((matches || []).slice(0, count), teamId);
  }

  function compareByField(matches, field, value, teamId = '') {
    return compareMatches((matches || []).filter((match) => String(match[field] || '') === String(value || '')), teamId);
  }

  window.SetkaStatsCompare = {
    compareMatches,
    compareLast,
    compareByField
  };
})();
