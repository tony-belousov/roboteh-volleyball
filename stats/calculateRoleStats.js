(function () {
  const ROLE_ORDER = ['диагональный', 'доигровщик', 'центральный', 'связующий', 'либеро', 'блокирующий'];

  function getPlayerDisplayName(player) {
    if (window.SetkaPlayerNames) return window.SetkaPlayerNames.getPlayerDisplayName(player);
    const value = typeof player === 'string'
      ? player
      : (player?.name || player?.fullName || `${player?.lastName || ''} ${player?.firstName || ''}`.trim());
    const parts = String(value || '').trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).join(' ') || String(value || '').trim();
  }

  function roleName(value) {
    return value || 'Амплуа не указано';
  }

  function ensureRole(roles, role) {
    const key = roleName(role);
    if (!roles.has(key)) {
      roles.set(key, {
        role: key,
        players: new Map(),
        totalActions: 0,
        contributionPercent: 0,
        byAction: {},
        teamStats: null
      });
    }
    return roles.get(key);
  }

  function calculateRoleStats(matchOrMatches, teamId = '') {
    const matches = (Array.isArray(matchOrMatches) ? matchOrMatches : [matchOrMatches].filter(Boolean))
      .filter((match) => !teamId || !match.teamId || match.teamId === teamId);
    const roles = new Map();
    const totalStats = window.SetkaStatsCore.mergeTeamStats(matches.map((match) => window.SetkaStatsCore.calculateMatchStats(match, teamId)));
    const totalActions = totalStats.totalActions || 0;

    matches.forEach((match) => {
      (match.roster || []).forEach((player) => {
        const item = ensureRole(roles, player.role);
        item.players.set(player.playerId || player.id, getPlayerDisplayName(player));
      });

      (match.events || []).forEach((event) => {
        if (teamId && event.teamId && event.teamId !== teamId) return;
        ensureRole(roles, event.playerRole);
      });

      if (match.importedStats) {
        window.SetkaStatsCore.getImportedCalculationRows(match.importedStats, {
          teamId: match.teamId || teamId,
          matchId: match.id || match.matchId || ''
        }).forEach((row) => ensureRole(roles, row.playerRole).players.set(row.playerId, getPlayerDisplayName(row.playerName)));
      }
    });

    roles.forEach((item) => {
      const stats = window.SetkaStatsCore.mergeTeamStats(matches.map((match) => window.SetkaStatsCore.calculateMatchStats(match, teamId, {
        role: item.role
      })));
      item.teamStats = stats;
      item.totalActions = stats.totalActions;
      item.contributionPercent = window.SetkaStatsCore.percentage(stats.totalActions, totalActions);
      item.playerCount = item.players.size;
      item.byAction = stats.byAction;
      item.excel = stats.excel;
    });

    return Array.from(roles.values()).sort((a, b) => {
      const aRole = String(a.role || '').toLowerCase();
      const bRole = String(b.role || '').toLowerCase();
      const ai = ROLE_ORDER.findIndex((role) => aRole.includes(role));
      const bi = ROLE_ORDER.findIndex((role) => bRole.includes(role));
      if (ai !== -1 || bi !== -1) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      return a.role.localeCompare(b.role, 'ru');
    });
  }

  window.SetkaStatsRoles = {
    calculateRoleStats
  };
})();
