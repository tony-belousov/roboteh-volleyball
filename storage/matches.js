(function () {
  const MATCHES_KEY = 'setka.matches';
  const CURRENT_MATCH_KEY = 'setka.currentMatch';
  const SUBSTITUTIONS_KEY = 'setka.substitutions';

  let lastLoadInfo = { damaged: 0, usedMock: false };

  function safeLoad(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (error) {
      lastLoadInfo.damaged += 1;
      return fallback;
    }
  }

  function safeSave(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function toDateInput(value) {
    if (!value) return new Date().toISOString().slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return value;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 10);
    return parsed.toISOString().slice(0, 10);
  }

  function getFullName(player) {
    return player.fullName || `${player.lastName || ''} ${player.firstName || ''}`.trim() || player.name || '';
  }

  function getPlayerDisplayName(player) {
    if (window.SetkaPlayerNames) return window.SetkaPlayerNames.getPlayerDisplayName(player);
    const fullName = typeof player === 'string' ? player : getFullName(player);
    const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).join(' ') || fullName || '';
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

  function normalizeScoreValue(value) {
    if (value === '' || value === null || typeof value === 'undefined') return 0;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return Math.round(parsed);
  }

  function playerSnapshot(player, status) {
    return {
      playerId: player.id,
      id: player.id,
      teamId: player.teamId || '',
      number: player.number || '',
      name: getPlayerDisplayName(player),
      fullName: getFullName(player),
      lastName: player.lastName || '',
      firstName: player.firstName || '',
      patronymic: player.patronymic || '',
      role: player.role || '',
      roleKey: player.roleKey || '',
      height: player.height || '',
      birthDate: player.birthDate || '',
      photo: getPlayerPhoto(player),
      registrationAddress: player.registrationAddress || '',
      status
    };
  }

  function normalizeRosterPlayer(player, teamId = '') {
    if (!player || typeof player !== 'object') return player;
    const fullName = getFullName(player);
    const teamPlayer = { ...player, teamId: player.teamId || teamId };
    return {
      ...player,
      name: getPlayerDisplayName(player),
      fullName,
      photo: getPlayerPhoto(teamPlayer)
    };
  }

  function normalizeEventName(event, teamId) {
    if (!event || typeof event !== 'object') return event;
    const timestamp = event.timestamp || event.time || event.createdAt || new Date().toISOString();
    const actionType = event.actionType || event.type || event.action || '';
    const rawActionResult = event.actionResult || event.result || event.resultLabel || event.label || '';
    const actionResult = actionType === 'error' && String(rawActionResult || '').trim().toLowerCase() === 'ошибка'
      ? 'error'
      : normalizeActionResultCode(rawActionResult) || rawActionResult;
    return {
      ...event,
      teamId: event.teamId || teamId || '',
      playerName: getPlayerDisplayName(event.playerName || event.name || ''),
      playerPhoto: getPlayerPhoto({
        photo: event.playerPhoto || event.photo || '',
        teamId: event.teamId || teamId || ''
      }),
      setNumber: normalizeSetNumber(event.setNumber || event.set || event.party || 1),
      actionType,
      actionResult,
      resultLabel: getActionResultLabel(actionType, actionResult),
      timestamp,
      createdAt: event.createdAt || timestamp,
      updatedAt: event.updatedAt || timestamp
    };
  }

  function normalizeImportedStats(value) {
    if (!value || typeof value !== 'object') return null;
    return {
      source: value.source || 'excel',
      sourceLabel: value.sourceLabel || 'Старый Excel',
      originalFile: value.originalFile || '',
      sourceImage: value.sourceImage || '',
      sets: Array.isArray(value.sets) ? value.sets : [],
      summary: Array.isArray(value.summary) ? value.summary : []
    };
  }

  function normalizeLineupItem(item, index) {
    const playerId = item?.playerId || item?.id || '';
    return {
      ...item,
      slotId: item?.slotId || `match-slot-${index + 1}`,
      playerId,
      id: playerId || item?.id || '',
      label: item?.label || item?.role || '',
      tone: item?.tone || item?.roleKey || 'unknown'
    };
  }

  function buildRoster(match, teamData) {
    const players = Array.isArray(teamData?.players) ? teamData.players : [];
    const starterIds = new Set((match.startingLineup || match.lineup || [])
      .map((slot) => slot.playerId || slot.id)
      .filter(Boolean));
    const substitutionIds = new Set((match.substitutions || [])
      .map((item) => item.inPlayerId)
      .filter(Boolean));
    const eventIds = new Set((match.events || [])
      .map((event) => event.playerId)
      .filter(Boolean));

    return players.map((player) => {
      let status = 'запас';
      if (starterIds.has(player.id)) status = 'старт';
      if (substitutionIds.has(player.id)) status = 'выходил на замену';
      if (!starterIds.has(player.id) && !substitutionIds.has(player.id) && !eventIds.has(player.id)) {
        status = 'запас';
      }
      return playerSnapshot(player, status);
    });
  }

  function normalizeSets(value) {
    const source = Array.isArray(value) ? value : [];
    const bySet = new Map();

    source.forEach((item, index) => {
      const fallbackNumber = index + 1;
      if (typeof item === 'string') {
        const parts = item.split(/[:\-]/);
        const setNumber = normalizeSetNumber(fallbackNumber);
        const ourScore = normalizeScoreValue(parts[0]);
        const opponentScore = normalizeScoreValue(parts[1]);
        bySet.set(setNumber, {
          setNumber,
          ourScore,
          opponentScore,
          ours: ourScore,
          opponent: opponentScore,
          score: `${ourScore}:${opponentScore}`
        });
        return;
      }

      if (item && typeof item === 'object') {
        const parts = typeof item.score === 'string' ? item.score.split(/[:\-]/) : [];
        const setNumber = normalizeSetNumber(item.setNumber || item.number || fallbackNumber);
        const ourScore = normalizeScoreValue(item.ourScore ?? item.ours ?? parts[0]);
        const opponentScore = normalizeScoreValue(item.opponentScore ?? item.opponent ?? parts[1]);
        bySet.set(setNumber, {
          ...item,
          setNumber,
          ourScore,
          opponentScore,
          ours: ourScore,
          opponent: opponentScore,
          score: `${ourScore}:${opponentScore}`
        });
      }
    });

    return Array.from({ length: 5 }, (_, index) => {
      const setNumber = index + 1;
      return bySet.get(setNumber) || {
        setNumber,
        ourScore: 0,
        opponentScore: 0,
        ours: 0,
        opponent: 0,
        score: '0:0'
      };
    });
  }

  function normalizeSetScores(value, normalizedSets = []) {
    if (Array.isArray(value)) {
      const scores = value.map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          const ourScore = normalizeScoreValue(item.ourScore ?? item.ours);
          const opponentScore = normalizeScoreValue(item.opponentScore ?? item.opponent);
          if (!ourScore && !opponentScore) return '';
          return item.score || `${ourScore}:${opponentScore}`;
        }
        return String(item || '');
      }).filter(Boolean);
      if (scores.length) return scores;
    }
    if (!value) return [];
    return String(value).split(',').map((item) => item.trim()).filter(Boolean);
  }

  function normalizeMatch(match, teamData, events, substitutions) {
    if (!match || typeof match !== 'object') return null;

    const id = String(match.id || match.matchId || match.matchID || '');
    if (!id) return null;
    const teamId = match.teamId || teamData?.id || '';

    const storedEvents = events.filter((event) => event.matchId === id && (!event.teamId || event.teamId === teamId));
    const matchEvents = storedEvents.length
      ? storedEvents.map((event) => normalizeEventName(event, teamId))
      : Array.isArray(match.events)
        ? match.events.filter((event) => !event.teamId || event.teamId === teamId).map((event) => normalizeEventName(event, teamId))
        : [];
    const storedSubstitutions = substitutions.filter((item) => item.matchId === id && (!item.teamId || item.teamId === teamId));
    const matchSubstitutions = storedSubstitutions.length
      ? storedSubstitutions
      : Array.isArray(match.substitutions)
        ? match.substitutions.filter((item) => !item.teamId || item.teamId === teamId).map((item) => ({ ...item, teamId: item.teamId || teamId }))
        : [];
    const startingLineup = (Array.isArray(match.startingLineup)
      ? match.startingLineup
      : Array.isArray(match.lineup)
        ? match.lineup
        : [])
      .map(normalizeLineupItem);
    const isLegacyImage = match.dataType === 'legacyImage';
    const location = match.location || match.venue || match.place || (isLegacyImage ? 'Не указано' : 'Площадка не указана');
    const sets = normalizeSets(match.sets || match.setScores || []);
    const setScores = normalizeSetScores(match.setScores || match.sets || [], sets);
    const finalScore = match.finalScore || match.score || '—';
    const currentSet = normalizeSetNumber(match.currentSet || match.setNumber || 1);
    const rawDate = match.date;
    const hasExplicitDate = rawDate !== null
      && typeof rawDate !== 'undefined'
      && String(rawDate || '').trim() !== '';
    const dateIsUnknown = rawDate === null || match.displayDate === 'Не указано';
    const normalizedDate = hasExplicitDate
      ? toDateInput(rawDate)
      : dateIsUnknown
        ? ''
        : toDateInput(match.createdAt);
    const normalizedDisplayDate = match.displayDate
      || (normalizedDate ? normalizedDate.split('-').reverse().join('.') : 'Не указано');

    const normalized = {
      id,
      matchId: id,
      date: normalizedDate,
      displayDate: normalizedDisplayDate,
      dateNote: match.dateNote || '',
      ourTeam: match.ourTeam || match.teamName || teamData?.name || 'Сетка',
      teamName: match.teamName || match.ourTeam || teamData?.name || 'Сетка',
      teamId,
      opponent: match.opponent || 'Соперник не указан',
      tournament: match.tournament || 'Тренировочный матч',
      venue: location,
      location,
      matchType: match.matchType || 'товарищеский',
      matchFormat: match.matchFormat || 'до 3 партий',
      finalScore,
      setScores,
      sets,
      result: match.result || '',
      source: match.source || '',
      sourceLabel: match.sourceLabel || '',
      originalFileName: match.originalFileName || '',
      sourceImage: match.sourceImage || '',
      dataType: match.dataType || '',
      imported: Boolean(match.imported),
      readOnly: Boolean(match.readOnly || match.imported),
      editableMetadata: Boolean(match.editableMetadata),
      metadataEditable: Boolean(match.metadataEditable || match.editableMetadata),
      statsEditableInApp: Boolean(match.statsEditableInApp),
      digitizingStatus: match.digitizingStatus || '',
      workflowStatus: match.workflowStatus || '',
      reviewStatus: match.reviewStatus || '',
      localOverride: Boolean(match.localOverride),
      override: match.override || null,
      metadataMissing: Array.isArray(match.metadataMissing) ? match.metadataMissing : [],
      syncStatus: match.syncStatus || '',
      archiveVersion: match.archiveVersion || '',
      hasLiveEvents: typeof match.hasLiveEvents === 'boolean' ? match.hasLiveEvents : matchEvents.length > 0,
      importedSets: Number(match.importedSets || match.setsCount || match.importedStats?.sets?.length || 0) || 0,
      setsCount: Number(match.setsCount || match.importedSets || match.importedStats?.sets?.length || setScores.length || 0) || 0,
      coachComment: match.coachComment || match.comment || '',
      status: match.status || (matchEvents.length > 0 ? 'сохранён локально' : 'черновик'),
      currentSet,
      setNumber: currentSet,
      roster: Array.isArray(match.roster) && match.roster.length ? match.roster.map((player) => normalizeRosterPlayer(player, teamId)) : [],
      lineup: startingLineup,
      startingLineup,
      bench: Array.isArray(match.bench) ? match.bench.map((player) => normalizeRosterPlayer(player, teamId)) : [],
      substitutions: matchSubstitutions,
      events: matchEvents,
      importedStats: normalizeImportedStats(match.importedStats),
      createdAt: match.createdAt || new Date().toISOString(),
      updatedAt: match.updatedAt || match.createdAt || new Date().toISOString(),
      title: match.title || `${teamData?.name || 'Сетка'} — ${match.opponent || 'соперник'}`,
      isMock: Boolean(match.isMock)
    };

    if (!normalized.roster.length && !isLegacyImage) {
      normalized.roster = buildRoster(normalized, teamData);
    }
    if (!normalized.bench.length) {
      normalized.bench = normalized.roster.filter((player) => player.status === 'запас');
    }

    return normalized;
  }

  function loadSubstitutions() {
    const raw = safeLoad(SUBSTITUTIONS_KEY, []);
    return Array.isArray(raw) ? raw : [];
  }

  function loadSavedRaw() {
    const raw = safeLoad(MATCHES_KEY, []);
    return Array.isArray(raw) ? raw : [];
  }

  function saveSavedRaw(matches) {
    safeSave(MATCHES_KEY, matches);
  }

  function belongsToTeam(item, teamId) {
    return !teamId || !item?.teamId || item.teamId === teamId;
  }

  function upsert(match) {
    const saved = loadSavedRaw();
    const id = match.id || match.matchId;
    if (!id) return;
    const index = saved.findIndex((item) => (item.id || item.matchId) === id);
    const nextMatch = {
      ...match,
      id,
      matchId: id,
      teamId: match.teamId || '',
      updatedAt: match.updatedAt || new Date().toISOString()
    };

    if (index >= 0) {
      saved[index] = { ...saved[index], ...nextMatch };
    } else {
      saved.unshift(nextMatch);
    }

    saveSavedRaw(saved);
  }

  function deleteMatch(matchId, teamId = '') {
    const id = String(matchId || '');
    if (!id) return false;
    const saved = loadSavedRaw();
    const next = saved.filter((item) => String(item.id || item.matchId || '') !== id || !belongsToTeam(item, teamId));
    saveSavedRaw(next);

    const current = safeLoad(CURRENT_MATCH_KEY, null);
    if (current && String(current.id || current.matchId || '') === id && belongsToTeam(current, teamId)) {
      localStorage.removeItem(CURRENT_MATCH_KEY);
    }

    return next.length !== saved.length || Boolean(current && String(current.id || current.matchId || '') === id && belongsToTeam(current, teamId));
  }

  function clearCurrent(matchId) {
    const current = safeLoad(CURRENT_MATCH_KEY, null);
    if (!current) return;
    if (!matchId || String(current.id || current.matchId || '') === String(matchId)) {
      localStorage.removeItem(CURRENT_MATCH_KEY);
    }
  }

  function appendSubstitution(substitution) {
    const substitutions = loadSubstitutions();
    substitutions.push(substitution);
    safeSave(SUBSTITUTIONS_KEY, substitutions);
    return substitutions;
  }

  function deleteSubstitutionsByMatch(matchId, teamId = '') {
    const id = String(matchId || '');
    if (!id) return 0;
    const substitutions = loadSubstitutions();
    const next = substitutions.filter((item) => String(item.matchId || '') !== id || !belongsToTeam(item, teamId));
    safeSave(SUBSTITUTIONS_KEY, next);
    return substitutions.length - next.length;
  }

  function createMockEvents(matchId, teamId, players, seed) {
    const actions = [
      ['serve', 'Подача', ['plus', 'minus', 'slash']],
      ['receive', 'Приём', ['plus', 'minus', 'slash']],
      ['attack', 'Атака', ['plus', 'minus', 'slash']],
      ['block', 'Блок', ['plus', 'minus', 'slash']],
      ['defense', 'Защита', ['plus', 'minus']],
      ['error', 'Ошибка', ['error']]
    ];
    const events = [];
    const base = new Date(`2026-05-${10 + seed}T16:00:00`).getTime();

    players.slice(0, 8).forEach((player, playerIndex) => {
      actions.forEach(([type, name, results], actionIndex) => {
        const repeats = type === 'error' ? (playerIndex % 3 === 0 ? 1 : 0) : 2 + ((playerIndex + actionIndex + seed) % 3);
        for (let i = 0; i < repeats; i += 1) {
          const result = results[(playerIndex + actionIndex + i + seed) % results.length];
          events.push({
            id: `${matchId}-event-${player.id}-${type}-${i}`,
            teamId,
            matchId,
            playerId: player.id,
            playerNumber: player.number,
            playerName: getPlayerDisplayName(player),
            playerRole: player.role,
            playerPhoto: getPlayerPhoto(player),
            setNumber: 1 + ((playerIndex + i) % 3),
            time: new Date(base + events.length * 45000).toISOString(),
            actionType: type,
            actionName: name,
            actionResult: result,
            resultLabel: getActionResultLabel(type, result),
            timestamp: new Date(base + events.length * 45000).toISOString()
          });
        }
      });
    });

    return events;
  }

  function createMockMatches(teamData) {
    const players = Array.isArray(teamData?.players) ? teamData.players : [];
    const starters = Array.isArray(teamData?.starterSlots) ? teamData.starterSlots : [];
    const teamId = teamData?.id || 'team';
    const firstMatchId = `${teamId}-mock-match-1`;
    const secondMatchId = `${teamId}-mock-match-2`;
    const firstEvents = createMockEvents(firstMatchId, teamId, players, 1);
    const secondEvents = createMockEvents(secondMatchId, teamId, players, 2);

    return [
      normalizeMatch({
        id: firstMatchId,
        teamId,
        date: '2026-05-11',
        ourTeam: teamData?.name || 'Сетка',
        opponent: 'ВК Север',
        tournament: 'Городская лига',
        venue: 'домашняя площадка',
        finalScore: '3:1',
        setScores: ['25:19', '23:25', '25:18', '25:21'],
        status: 'завершён',
        startingLineup: starters,
        events: firstEvents,
        isMock: true,
        createdAt: '2026-05-11T13:00:00.000Z',
        updatedAt: '2026-05-11T15:00:00.000Z'
      }, teamData, firstEvents, []),
      normalizeMatch({
        id: secondMatchId,
        teamId,
        date: '2026-05-18',
        ourTeam: teamData?.name || 'Сетка',
        opponent: 'Академия Юг',
        tournament: 'Кубок области',
        venue: 'выезд',
        finalScore: '2:3',
        setScores: ['25:22', '21:25', '25:19', '20:25', '12:15'],
        status: 'завершён',
        startingLineup: starters,
        events: secondEvents,
        isMock: true,
        createdAt: '2026-05-18T13:00:00.000Z',
        updatedAt: '2026-05-18T15:20:00.000Z'
      }, teamData, secondEvents, [])
    ];
  }

  function getImportedMatches(teamData, events, substitutions) {
    const imported = window.SetkaImportedMatches?.getImportedMatches
      ? window.SetkaImportedMatches.getImportedMatches(teamData)
      : [];
    return imported
      .map((match) => normalizeMatch(match, teamData, events, substitutions))
      .filter(Boolean);
  }

  function getAll(teamData) {
    lastLoadInfo = { damaged: 0, usedMock: false };
    const saved = loadSavedRaw();
    let migrated = false;
    saved.forEach((match) => {
      if (match && typeof match === 'object' && !match.teamId && teamData?.id) {
        match.teamId = teamData.id;
        migrated = true;
      }
    });
    if (migrated) saveSavedRaw(saved);
    const current = safeLoad(CURRENT_MATCH_KEY, null);
    const events = window.SetkaStorageEvents ? window.SetkaStorageEvents.loadAll() : [];
    const substitutions = loadSubstitutions();
    const byId = new Map();

    saved.forEach((match) => {
      const normalized = normalizeMatch(match, teamData, events, substitutions);
      if (normalized) byId.set(normalized.id, normalized);
    });

    if (current) {
      const normalized = normalizeMatch(current, teamData, events, substitutions);
      if (normalized) byId.set(normalized.id, { ...byId.get(normalized.id), ...normalized });
    }

    getImportedMatches(teamData, events, substitutions).forEach((match) => {
      if (!byId.has(match.id)) byId.set(match.id, match);
    });

    const matches = Array.from(byId.values())
      .filter((match) => !teamData?.id || match.teamId === teamData.id)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.updatedAt).localeCompare(String(a.updatedAt)));

    if (!matches.length) {
      lastLoadInfo.usedMock = true;
      return createMockMatches(teamData);
    }

    return matches;
  }

  function getById(matchId, teamData) {
    return getAll(teamData).find((match) => match.id === matchId) || null;
  }

  function getLoadInfo() {
    return { ...lastLoadInfo };
  }

  window.SetkaStorageMatches = {
    key: MATCHES_KEY,
    currentKey: CURRENT_MATCH_KEY,
    substitutionsKey: SUBSTITUTIONS_KEY,
    getAll,
    getById,
    upsert,
    deleteMatch,
    clearCurrent,
    appendSubstitution,
    deleteSubstitutionsByMatch,
    getLoadInfo,
    buildRoster,
    playerSnapshot,
    normalizeMatch
  };
})();
