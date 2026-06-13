(function () {
  const EVENTS_KEY = 'setka.statsEvents';

  function safeLoad(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed;
    } catch (error) {
      return fallback;
    }
  }

  function safeSave(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getPlayerDisplayName(value) {
    if (window.SetkaPlayerNames) return window.SetkaPlayerNames.getPlayerDisplayName(value);
    const parts = String(value || '').trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).join(' ') || String(value || '').trim();
  }

  function getPlayerPhoto(player) {
    if (window.SetkaPlayerNames?.getPlayerPhoto) return window.SetkaPlayerNames.getPlayerPhoto(player);
    return player?.photo || '';
  }

  function normalizeSetNumber(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 1) return 1;
    return Math.min(5, Math.max(1, Math.round(parsed)));
  }

  function normalizeActionResultCode(result) {
    const value = String(result || '').trim().toLowerCase();
    if (result === '+' || value === 'plus' || value === 'плюс' || value === 'эйс' || value === 'очко' || value === 'качество' || value === 'качественно') return 'plus';
    if (result === '-' || value === 'minus' || value === 'минус' || value === 'ошибка' || value === 'брак') return 'minus';
    if (result === '/' || value === 'slash' || value === 'neutral' || value === 'средне' || value === 'нейтрально' || value === 'сбитый приём' || value === 'сбитый прием' || value === 'смягчение' || value === 'в игре') return 'slash';
    if (value === 'error' || result === 'Ошибка' || value === 'прочая ошибка') return 'error';
    return String(result || '');
  }

  function getActionResultLabel(actionType, result) {
    const raw = String(result || '').trim().toLowerCase();
    const code = actionType === 'error' && (raw === 'ошибка' || raw === 'прочая ошибка')
      ? 'error'
      : normalizeActionResultCode(result);
    const labels = {
      serve: { plus: 'эйс', minus: 'ошибка', slash: 'сбитый приём' },
      receive: { plus: 'качество', minus: 'ошибка', slash: 'нейтрально' },
      attack: { plus: 'очко', minus: 'ошибка', slash: 'в игре' },
      block: { plus: 'очко', minus: 'ошибка', slash: 'смягчение' },
      defense: { plus: 'качество', minus: 'ошибка' },
      error: { error: 'прочая ошибка' }
    };
    return labels[actionType]?.[code] || result || code;
  }

  function sameTeam(event, teamId) {
    return !teamId || !event.teamId || event.teamId === teamId;
  }

  function normalizeEvent(event) {
    if (!event || typeof event !== 'object') return null;
    const timestamp = event.timestamp || event.time || event.createdAt || new Date().toISOString();
    const createdAt = event.createdAt || timestamp;
    const updatedAt = event.updatedAt || event.changedAt || createdAt;
    const setNumber = normalizeSetNumber(event.setNumber || event.set || event.party || 1);

    const actionType = event.actionType || event.type || event.action || '';
    const rawActionResult = event.actionResult || event.result || event.resultLabel || event.label || '';
    const actionResult = actionType === 'error' && String(rawActionResult || '').trim().toLowerCase() === 'ошибка'
      ? 'error'
      : normalizeActionResultCode(rawActionResult) || rawActionResult;
    return {
      id: String(event.id || `event-${Date.now()}-${Math.random().toString(16).slice(2)}`),
      teamId: event.teamId || '',
      matchId: String(event.matchId || event.matchID || ''),
      playerId: String(event.playerId || event.player || ''),
      playerNumber: event.playerNumber || event.number || '',
      playerName: getPlayerDisplayName(event.playerName || event.name || ''),
      playerRole: event.playerRole || event.role || '',
      playerPhoto: getPlayerPhoto({
        photo: event.playerPhoto || event.photo || '',
        teamId: event.teamId || ''
      }),
      setNumber,
      time: event.time || timestamp,
      actionType,
      actionName: event.actionName || '',
      actionResult,
      resultLabel: getActionResultLabel(actionType, actionResult),
      timestamp,
      createdAt,
      updatedAt
    };
  }

  function loadAll() {
    const raw = safeLoad(EVENTS_KEY, []);
    if (!Array.isArray(raw)) return [];
    return raw.map(normalizeEvent).filter(Boolean);
  }

  function saveAll(events) {
    safeSave(EVENTS_KEY, Array.isArray(events) ? events.map(normalizeEvent).filter(Boolean) : []);
  }

  function appendEvent(event) {
    const events = loadAll();
    const normalized = normalizeEvent(event);
    if (!normalized) return events;
    events.push(normalized);
    saveAll(events);
    return events;
  }

  function getByMatch(matchId) {
    return loadAll().filter((event) => event.matchId === matchId);
  }

  function updateEvent(eventId, patch = {}, teamId = '') {
    const id = String(eventId || '');
    if (!id) return null;
    const events = loadAll();
    const index = events.findIndex((event) => event.id === id && sameTeam(event, teamId));
    if (index < 0) return null;
    const updated = normalizeEvent({
      ...events[index],
      ...patch,
      id,
      matchId: patch.matchId || events[index].matchId,
      teamId: patch.teamId || events[index].teamId,
      updatedAt: new Date().toISOString()
    });
    if (!updated) return null;
    events[index] = updated;
    saveAll(events);
    return updated;
  }

  function deleteEvent(eventId, teamId = '') {
    const events = loadAll();
    const next = events.filter((event) => event.id !== eventId || !sameTeam(event, teamId));
    saveAll(next);
    return events.length !== next.length;
  }

  function deleteLast(matchId, teamId = '') {
    const events = loadAll();
    for (let index = events.length - 1; index >= 0; index -= 1) {
      if ((!matchId || events[index].matchId === matchId) && sameTeam(events[index], teamId)) {
        const [removed] = events.splice(index, 1);
        saveAll(events);
        return removed || null;
      }
    }
    return null;
  }

  function deleteByMatch(matchId, teamId = '') {
    const id = String(matchId || '');
    if (!id) return 0;
    const events = loadAll();
    const next = events.filter((event) => event.matchId !== id || !sameTeam(event, teamId));
    saveAll(next);
    return events.length - next.length;
  }

  window.SetkaStorageEvents = {
    key: EVENTS_KEY,
    loadAll,
    saveAll,
    appendEvent,
    getByMatch,
    updateEvent,
    deleteEvent,
    deleteLast,
    deleteByMatch,
    normalizeEvent
  };
})();
