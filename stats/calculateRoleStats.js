(function () {
  const ROLE_ORDER = ['диагональный', 'доигровщик', 'центральный', 'связующий', 'либеро'];

  function calculateRoleStats(matchOrMatches, teamId = '') {
    const matches = (Array.isArray(matchOrMatches) ? matchOrMatches : [matchOrMatches].filter(Boolean))
      .filter((match) => !teamId || !match.teamId || match.teamId === teamId);
    const roles = new Map();
    const allEvents = matches.flatMap((match) => match.events || []).filter((event) => !teamId || !event.teamId || event.teamId === teamId);
    const totalActions = allEvents.length || 0;

    matches.forEach((match) => {
      (match.roster || []).forEach((player) => {
        const role = player.role || 'Амплуа не указано';
        if (!roles.has(role)) {
          roles.set(role, {
            role,
            players: new Map(),
            totalActions: 0,
            contributionPercent: 0,
            byAction: {}
          });
        }
        roles.get(role).players.set(player.playerId || player.id, player.name);
      });
    });

    allEvents.forEach((event) => {
      const role = event.playerRole || 'Амплуа не указано';
      if (!roles.has(role)) {
        roles.set(role, {
          role,
          players: new Map(),
          totalActions: 0,
          contributionPercent: 0,
          byAction: {}
        });
      }
    });

    roles.forEach((item) => {
      const events = allEvents.filter((event) => (event.playerRole || 'Амплуа не указано') === item.role);
      item.totalActions = events.length;
      item.contributionPercent = window.SetkaStatsCore.percentage(events.length, totalActions);
      item.playerCount = item.players.size;
      window.SetkaStatsCore.ACTIONS.forEach((action) => {
        item.byAction[action.type] = window.SetkaStatsCore.calculateActionStats(events, action.type);
      });
    });

    return Array.from(roles.values()).sort((a, b) => {
      const ai = ROLE_ORDER.indexOf(a.role);
      const bi = ROLE_ORDER.indexOf(b.role);
      if (ai !== -1 || bi !== -1) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      return a.role.localeCompare(b.role, 'ru');
    });
  }

  window.SetkaStatsRoles = {
    calculateRoleStats
  };
})();
