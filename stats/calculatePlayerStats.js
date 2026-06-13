(function () {
  function getPlayerDisplayName(player) {
    if (window.SetkaPlayerNames) return window.SetkaPlayerNames.getPlayerDisplayName(player);
    const value = typeof player === 'string'
      ? player
      : (player?.name || player?.fullName || `${player?.lastName || ''} ${player?.firstName || ''}`.trim());
    const parts = String(value || '').trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).join(' ') || String(value || '').trim();
  }

  function getPlayerPhoto(player) {
    if (window.SetkaPlayerNames?.getPlayerPhoto) return window.SetkaPlayerNames.getPlayerPhoto(player);
    return player?.photo || '';
  }

  function createPlayer(player, match) {
    const id = player.playerId || player.id;
    return {
      playerId: id,
      teamId: player.teamId || match?.teamId || '',
      number: player.number || player.playerNumber || '',
      name: getPlayerDisplayName(player),
      fullName: player.fullName || player.name || player.playerName || '',
      role: player.role || player.playerRole || '',
      roleKey: player.roleKey || '',
      height: player.height || '',
      birthDate: player.birthDate || '',
      photo: getPlayerPhoto(player),
      status: player.status || 'запас',
      matches: 0,
      totalActions: 0,
      byAction: {},
      teamStats: null,
      excel: null
    };
  }

  function ensurePlayer(players, player, match, status = '') {
    const id = player?.playerId || player?.id;
    if (!id) return null;
    if (!players.has(id)) players.set(id, createPlayer({ ...player, status: status || player.status }, match));
    const item = players.get(id);
    if (!item.number && (player.number || player.playerNumber)) item.number = player.number || player.playerNumber;
    if (!item.role && (player.role || player.playerRole)) item.role = player.role || player.playerRole;
    if (!item.roleKey && player.roleKey) item.roleKey = player.roleKey;
    if (!item.photo) item.photo = getPlayerPhoto(player);
    if (item.status !== 'старт' && (status === 'старт' || player.status === 'старт')) item.status = 'старт';
    if (status === 'выходил на замену' || player.status === 'выходил на замену') item.status = 'выходил на замену';
    return item;
  }

  function calculatePlayerStats(matchOrMatches, teamId = '') {
    const matches = (Array.isArray(matchOrMatches) ? matchOrMatches : [matchOrMatches].filter(Boolean))
      .filter((match) => !teamId || !match.teamId || match.teamId === teamId);
    const players = new Map();

    matches.forEach((match) => {
      const appearedInMatch = new Set();
      const roster = Array.isArray(match.roster) ? match.roster : [];
      roster.forEach((player) => {
        const item = ensurePlayer(players, player, match);
        if (item) appearedInMatch.add(item.playerId);
      });

      (match.events || []).filter((event) => !teamId || !event.teamId || event.teamId === teamId).forEach((event) => {
        const item = ensurePlayer(players, {
          playerId: event.playerId,
          teamId: event.teamId || match.teamId || '',
          playerNumber: event.playerNumber || '',
          playerName: event.playerName || '',
          playerRole: event.playerRole || '',
          photo: event.playerPhoto || ''
        }, match, 'выходил на замену');
        if (item) appearedInMatch.add(item.playerId);
      });

      if (match.importedStats) {
        window.SetkaStatsCore.getImportedCalculationRows(match.importedStats, {
          teamId: match.teamId || teamId,
          matchId: match.id || match.matchId || ''
        }).forEach((row) => {
          const item = ensurePlayer(players, {
            playerId: row.playerId,
            teamId: row.teamId,
            playerNumber: row.playerNumber,
            playerName: row.playerName,
            playerRole: row.playerRole
          }, match, 'старт');
          if (item) appearedInMatch.add(item.playerId);
        });
      }

      appearedInMatch.forEach((playerId) => {
        const item = players.get(playerId);
        if (item) item.matches += 1;
      });
    });

    players.forEach((player) => {
      const stats = window.SetkaStatsCore.mergeTeamStats(matches.map((match) => window.SetkaStatsCore.calculateMatchStats(match, teamId, {
        playerId: player.playerId
      })));
      player.teamStats = stats;
      player.excel = stats.excel;
      player.totalActions = stats.totalActions;
      player.byAction = stats.byAction;
      player.errors = stats.byAction.error?.total || stats.errors?.total || 0;
    });

    return Array.from(players.values())
      .sort((a, b) => b.totalActions - a.totalActions || Number(a.number) - Number(b.number));
  }

  function calculatePlayerDynamics(playerId, matches, teamId = '') {
    return (matches || []).filter((match) => !teamId || !match.teamId || match.teamId === teamId).map((match) => {
      const teamStats = window.SetkaStatsCore.calculateMatchStats(match, teamId, { playerId });
      return {
        matchId: match.id,
        date: match.date,
        opponent: match.opponent,
        totalActions: teamStats.totalActions,
        teamStats
      };
    });
  }

  window.SetkaStatsPlayers = {
    calculatePlayerStats,
    calculatePlayerDynamics
  };
})();
