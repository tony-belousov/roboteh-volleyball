(function () {
  function parseFinalScore(score) {
    const match = String(score || '').match(/(\d+)\s*[:\-]\s*(\d+)/);
    if (!match) return null;
    return {
      ours: Number(match[1]),
      opponent: Number(match[2])
    };
  }

  function countSets(match) {
    if (Array.isArray(match.setScores) && match.setScores.length) return match.setScores.length;
    if (match.importedSets) return Number(match.importedSets) || 0;
    if (match.setsCount) return Number(match.setsCount) || 0;
    if (Array.isArray(match.importedStats?.sets)) return match.importedStats.sets.length;
    const eventSets = new Set((match.events || []).map((event) => event.setNumber || 'unknown'));
    return eventSets.size;
  }

  function calculateSeasonStats(matches, teamId = '') {
    const safeMatches = (Array.isArray(matches) ? matches : [])
      .filter((match) => !teamId || !match.teamId || match.teamId === teamId);
    const wins = safeMatches.filter((match) => {
      if (match.result === 'победа') return true;
      const score = parseFinalScore(match.finalScore);
      return score && score.ours > score.opponent;
    }).length;
    const losses = safeMatches.filter((match) => {
      if (match.result === 'поражение') return true;
      const score = parseFinalScore(match.finalScore);
      return score && score.ours < score.opponent;
    }).length;
    const totalSets = safeMatches.reduce((sum, match) => sum + countSets(match), 0);
    const playerStats = window.SetkaStatsPlayers.calculatePlayerStats(safeMatches, teamId);
    const matchStats = safeMatches.map((match) => window.SetkaStatsCore.calculateMatchStats(match, teamId));
    const teamStats = window.SetkaStatsCore.mergeTeamStats(matchStats);
    const dynamics = safeMatches.map((match) => {
      const stats = window.SetkaStatsCore.calculateMatchStats(match, teamId);
      return {
        matchId: match.id,
        date: match.date,
        opponent: match.opponent,
        totalActions: stats.totalActions,
        errors: stats.errors.total,
        attackPlusPercent: stats.byAction.attack?.plusPercent || 0,
        receivePlusPercent: stats.byAction.receive?.plusPercent || 0
      };
    });

    return {
      totalMatches: safeMatches.length,
      wins,
      losses,
      totalSets,
      totalActions: teamStats.totalActions,
      actionsPerMatch: safeMatches.length ? Math.round((teamStats.totalActions / safeMatches.length) * 10) / 10 : 0,
      teamStats,
      topPlayersByActions: playerStats.slice(0, 5),
      topPlayersByErrors: playerStats.slice().sort((a, b) => b.errors - a.errors).slice(0, 5),
      dynamics
    };
  }

  window.SetkaStatsSeason = {
    calculateSeasonStats,
    parseFinalScore
  };
})();
