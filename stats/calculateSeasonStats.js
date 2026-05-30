(function () {
  function parseFinalScore(score) {
    const match = String(score || '').match(/(\d+)\s*[:\-]\s*(\d+)/);
    if (!match) return null;
    return {
      ours: Number(match[1]),
      opponent: Number(match[2])
    };
  }

  function calculateSeasonStats(matches, teamId = '') {
    const safeMatches = (Array.isArray(matches) ? matches : [])
      .filter((match) => !teamId || !match.teamId || match.teamId === teamId);
    const allEvents = safeMatches.flatMap((match) => match.events || []).filter((event) => !teamId || !event.teamId || event.teamId === teamId);
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
    const totalSets = safeMatches.reduce((sum, match) => sum + (Array.isArray(match.setScores) ? match.setScores.length : 0), 0);
    const playerStats = window.SetkaStatsPlayers.calculatePlayerStats(safeMatches, teamId);
    const teamStats = window.SetkaStatsCore.calculateTeamStats(allEvents);
    const dynamics = safeMatches.map((match) => ({
      matchId: match.id,
      date: match.date,
      opponent: match.opponent,
      totalActions: (match.events || []).length,
      errors: (match.events || []).filter((event) => event.actionType === 'error').length,
      attackPlusPercent: window.SetkaStatsCore.calculateActionStats(match.events || [], 'attack')?.plusPercent || 0,
      receivePlusPercent: window.SetkaStatsCore.calculateActionStats(match.events || [], 'receive')?.plusPercent || 0
    }));

    return {
      totalMatches: safeMatches.length,
      wins,
      losses,
      totalSets,
      totalActions: allEvents.length,
      actionsPerMatch: safeMatches.length ? Math.round((allEvents.length / safeMatches.length) * 10) / 10 : 0,
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
