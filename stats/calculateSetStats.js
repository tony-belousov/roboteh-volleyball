(function () {
  function calculateSetStats(match, teamId = '') {
    const events = (Array.isArray(match?.events) ? match.events : []).filter((event) => !teamId || !event.teamId || event.teamId === teamId);
    const setScores = Array.isArray(match?.setScores) ? match.setScores : [];
    const groups = new Map();

    events.forEach((event) => {
      const key = event.setNumber || 'Без партии';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(event);
    });

    if (!groups.size) {
      return {
        hasSetData: false,
        sets: []
      };
    }

    const sets = Array.from(groups.entries()).map(([setNumber, setEvents]) => {
      const players = window.SetkaStatsPlayers.calculatePlayerStats({
        ...match,
        events: setEvents
      });
      const bestPlayers = players
        .filter((player) => player.totalActions > 0)
        .slice(0, 3);
      const teamStats = window.SetkaStatsCore.calculateTeamStats(setEvents);
      const problemActions = window.SetkaStatsCore.ACTIONS
        .filter((action) => action.type !== 'error')
        .map((action) => teamStats.byAction[action.type])
        .filter(Boolean)
        .sort((a, b) => b.minusPercent - a.minusPercent)
        .slice(0, 2);

      return {
        setNumber,
        score: setScores[Number(setNumber) - 1] || '—',
        totalActions: setEvents.length,
        teamStats,
        bestPlayers,
        problemActions
      };
    });

    return {
      hasSetData: true,
      sets: sets.sort((a, b) => Number(a.setNumber) - Number(b.setNumber))
    };
  }

  window.SetkaStatsSets = {
    calculateSetStats
  };
})();
