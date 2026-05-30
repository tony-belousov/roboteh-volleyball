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

  function normalizeEvent(event) {
    if (!event || typeof event !== 'object') return null;
    const timestamp = event.timestamp || event.time || new Date().toISOString();
    const setNumber = event.setNumber || event.set || event.party || null;

    return {
      id: String(event.id || `event-${Date.now()}-${Math.random().toString(16).slice(2)}`),
      teamId: event.teamId || '',
      matchId: String(event.matchId || event.matchID || ''),
      playerId: String(event.playerId || event.player || ''),
      playerNumber: event.playerNumber || event.number || '',
      playerName: getPlayerDisplayName(event.playerName || event.name || ''),
      playerRole: event.playerRole || event.role || '',
      setNumber,
      time: event.time || timestamp,
      actionType: event.actionType || event.type || event.action || '',
      actionName: event.actionName || '',
      actionResult: event.actionResult || event.result || '',
      resultLabel: event.resultLabel || event.label || event.actionResult || event.result || '',
      timestamp
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

  function deleteEvent(eventId) {
    const events = loadAll();
    const next = events.filter((event) => event.id !== eventId);
    saveAll(next);
    return events.length !== next.length;
  }

  function deleteLast(matchId) {
    const events = loadAll();
    for (let index = events.length - 1; index >= 0; index -= 1) {
      if (!matchId || events[index].matchId === matchId) {
        const [removed] = events.splice(index, 1);
        saveAll(events);
        return removed || null;
      }
    }
    return null;
  }

  function deleteByMatch(matchId) {
    const id = String(matchId || '');
    if (!id) return 0;
    const events = loadAll();
    const next = events.filter((event) => event.matchId !== id);
    saveAll(next);
    return events.length - next.length;
  }

  window.SetkaStorageEvents = {
    key: EVENTS_KEY,
    loadAll,
    saveAll,
    appendEvent,
    getByMatch,
    deleteEvent,
    deleteLast,
    deleteByMatch,
    normalizeEvent
  };
})();
