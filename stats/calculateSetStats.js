(function () {
  function calculateSetStats(match, teamId = '') {
    const events = (Array.isArray(match?.events) ? match.events : []).filter((event) => !teamId || !event.teamId || event.teamId === teamId);
    const setScores = Array.isArray(match?.setScores) ? match.setScores : [];
    const groups = new Map();

    events.forEach((event) => {
      const key = event.setNumber ? String(event.setNumber) : 'unknown';
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
      }, teamId);
      const bestPlayers = players
        .filter((player) => player.totalActions > 0)
        .slice(0, 3);
      const teamStats = window.SetkaStatsCore.calculateTeamStats(setEvents);
      const numericSet = Number(setNumber);
      const hasNumericSet = Number.isFinite(numericSet);
      const problemActions = window.SetkaStatsCore.ACTIONS
        .filter((action) => action.type !== 'error')
        .map((action) => teamStats.byAction[action.type])
        .filter(Boolean)
        .sort((a, b) => b.minusPercent - a.minusPercent)
        .slice(0, 2);

      return {
        setNumber: hasNumericSet ? numericSet : 'Партия не указана',
        setKey: setNumber,
        score: hasNumericSet ? (setScores[numericSet - 1] || '—') : '—',
        totalActions: setEvents.length,
        teamStats,
        bestPlayers,
        problemActions
      };
    });

    return {
      hasSetData: true,
      sets: sets.sort((a, b) => {
        const aNumber = Number(a.setKey);
        const bNumber = Number(b.setKey);
        if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) return aNumber - bNumber;
        if (Number.isFinite(aNumber)) return -1;
        if (Number.isFinite(bNumber)) return 1;
        return String(a.setKey).localeCompare(String(b.setKey), 'ru');
      })
    };
  }

  window.SetkaStatsSets = {
    calculateSetStats
  };
})();
