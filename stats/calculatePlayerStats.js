(function () {
  function calculatePlayerStats(matchOrMatches, teamId = '') {
    const matches = (Array.isArray(matchOrMatches) ? matchOrMatches : [matchOrMatches].filter(Boolean))
      .filter((match) => !teamId || !match.teamId || match.teamId === teamId);
    const players = new Map();

    matches.forEach((match) => {
      const roster = Array.isArray(match.roster) ? match.roster : [];
      roster.forEach((player) => {
        if (!players.has(player.playerId || player.id)) {
          players.set(player.playerId || player.id, {
            playerId: player.playerId || player.id,
            teamId: player.teamId || match.teamId || '',
            number: player.number || '',
            name: player.name || '',
            fullName: player.fullName || player.name || '',
            role: player.role || '',
            roleKey: player.roleKey || '',
            height: player.height || '',
            birthDate: player.birthDate || '',
            photo: player.photo || '',
            status: player.status || 'запас',
            matches: 0,
            totalActions: 0,
            byAction: {}
          });
        }
        const item = players.get(player.playerId || player.id);
        item.matches += 1;
        if (item.status !== 'старт' && player.status === 'старт') item.status = 'старт';
        if (player.status === 'выходил на замену') item.status = 'выходил на замену';
      });

      (match.events || []).filter((event) => !teamId || !event.teamId || event.teamId === teamId).forEach((event) => {
        const id = event.playerId;
        if (!id) return;
        if (!players.has(id)) {
          players.set(id, {
            playerId: id,
            teamId: event.teamId || match.teamId || '',
            number: event.playerNumber || '',
            name: event.playerName || '',
            fullName: event.playerName || '',
            role: event.playerRole || '',
            roleKey: '',
            height: '',
            birthDate: '',
            photo: '',
            status: 'выходил на замену',
            matches: 0,
            totalActions: 0,
            byAction: {}
          });
        }
      });
    });

    const allEvents = matches.flatMap((match) => match.events || []).filter((event) => !teamId || !event.teamId || event.teamId === teamId);
    players.forEach((player) => {
      const playerEvents = allEvents.filter((event) => event.playerId === player.playerId);
      player.totalActions = playerEvents.length;
      window.SetkaStatsCore.ACTIONS.forEach((action) => {
        player.byAction[action.type] = window.SetkaStatsCore.calculateActionStats(playerEvents, action.type);
      });
      player.errors = player.byAction.error?.total || 0;
    });

    return Array.from(players.values())
      .sort((a, b) => b.totalActions - a.totalActions || Number(a.number) - Number(b.number));
  }

  function calculatePlayerDynamics(playerId, matches, teamId = '') {
    return (matches || []).filter((match) => !teamId || !match.teamId || match.teamId === teamId).map((match) => {
      const events = (match.events || []).filter((event) => event.playerId === playerId && (!teamId || !event.teamId || event.teamId === teamId));
      return {
        matchId: match.id,
        date: match.date,
        opponent: match.opponent,
        totalActions: events.length,
        teamStats: window.SetkaStatsCore.calculateTeamStats(events)
      };
    });
  }

  window.SetkaStatsPlayers = {
    calculatePlayerStats,
    calculatePlayerDynamics
  };
})();
