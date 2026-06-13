(function () {
  function getPlayerDisplayName(player) {
    if (window.SetkaPlayerNames) return window.SetkaPlayerNames.getPlayerDisplayName(player);
    const value = typeof player === 'string'
      ? player
      : (player?.name || player?.fullName || player?.playerName || `${player?.lastName || ''} ${player?.firstName || ''}`.trim());
    const parts = String(value || '').trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).join(' ') || String(value || '').trim();
  }

  function collectPlayerIds(match, teamId, setKey) {
    const players = new Map();
    (match.roster || []).forEach((player) => {
      const id = player.playerId || player.id;
      if (id) players.set(id, player);
    });
    (match.events || []).forEach((event) => {
      if (teamId && event.teamId && event.teamId !== teamId) return;
      const eventSet = event.setNumber ? String(event.setNumber) : 'unknown';
      if (eventSet !== String(setKey)) return;
      players.set(event.playerId, {
        playerId: event.playerId,
        number: event.playerNumber,
        name: event.playerName,
        role: event.playerRole
      });
    });
    const importedSet = (match.importedStats?.sets || []).find((set) => String(set.setNumber) === String(setKey));
    (importedSet?.players || []).forEach((player) => {
      players.set(player.playerId, {
        playerId: player.playerId,
        number: player.playerNumber,
        name: player.playerName,
        role: player.playerRole,
        photo: player.photo
      });
    });
    return Array.from(players.values());
  }

  function calculateSetStats(match, teamId = '') {
    const events = (Array.isArray(match?.events) ? match.events : []).filter((event) => !teamId || !event.teamId || event.teamId === teamId);
    const setScores = Array.isArray(match?.setScores) ? match.setScores : [];
    const keys = new Set();

    events.forEach((event) => {
      keys.add(event.setNumber ? String(event.setNumber) : 'unknown');
    });
    (match?.importedStats?.sets || []).forEach((set) => keys.add(String(set.setNumber || 'unknown')));

    if (!keys.size) {
      return {
        hasSetData: false,
        sets: []
      };
    }

    const sets = Array.from(keys).map((setKey) => {
      const numericSet = Number(setKey);
      const hasNumericSet = Number.isFinite(numericSet);
      const teamStats = window.SetkaStatsCore.calculateMatchStats(match, teamId, {
        setNumber: hasNumericSet ? numericSet : setKey
      });
      const players = collectPlayerIds(match, teamId, setKey)
        .map((player) => {
          const stats = window.SetkaStatsCore.calculateMatchStats(match, teamId, {
            setNumber: hasNumericSet ? numericSet : setKey,
            playerId: player.playerId || player.id
          });
          return {
            ...player,
            playerId: player.playerId || player.id,
            name: getPlayerDisplayName(player),
            totalActions: stats.totalActions,
            teamStats: stats
          };
        })
        .filter((player) => player.totalActions > 0)
        .sort((a, b) => b.totalActions - a.totalActions);
      const problemActions = window.SetkaStatsCore.ACTIONS
        .filter((action) => action.type !== 'error')
        .map((action) => teamStats.byAction[action.type])
        .filter(Boolean)
        .sort((a, b) => b.minusPercent - a.minusPercent)
        .slice(0, 2);
      const importedSet = (match?.importedStats?.sets || []).find((set) => String(set.setNumber) === String(setKey));

      return {
        setNumber: hasNumericSet ? numericSet : 'Партия не указана',
        setKey,
        score: hasNumericSet ? (setScores[numericSet - 1] || importedSet?.score || 'без счёта') : 'без счёта',
        totalActions: teamStats.totalActions,
        teamStats,
        bestPlayers: players.slice(0, 3),
        problemActions,
        importedPlayers: importedSet?.players || []
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
