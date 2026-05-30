document.addEventListener('DOMContentLoaded', () => {
  const APP_VERSION = '2026.05.30.1';
  const APP_NAME = 'Сетка';

  const STORAGE_KEYS = {
    activeAccount: 'setka.activeAccount',
    activeTeamId: 'setka.activeTeamId',
    settings: 'setka.settings',
    matches: 'setka.matches',
    currentMatch: 'setka.currentMatch',
    statsEvents: 'setka.statsEvents',
    substitutions: 'setka.substitutions'
  };

  const MENU_ITEMS = {
    calendar: 'Календарь',
    coach: 'Тренерская',
    results: 'Результаты',
    export: 'Экспорт данных',
    documents: 'Документы',
    scoreboard: 'Электронное табло',
    help: 'Справка',
    sync: 'Облако / синхронизация'
  };

  const ACTION_GROUPS = [
    {
      type: 'serve',
      name: 'Подача',
      results: [
        { code: 'plus', label: '+' },
        { code: 'minus', label: '-' },
        { code: 'slash', label: '/' }
      ]
    },
    {
      type: 'receive',
      name: 'Приём',
      results: [
        { code: 'plus', label: '+' },
        { code: 'minus', label: '-' },
        { code: 'slash', label: '/' }
      ]
    },
    {
      type: 'attack',
      name: 'Атака',
      results: [
        { code: 'plus', label: '+' },
        { code: 'minus', label: '-' },
        { code: 'slash', label: '/' }
      ]
    },
    {
      type: 'block',
      name: 'Блок',
      results: [
        { code: 'plus', label: '+' },
        { code: 'minus', label: '-' }
      ]
    },
    {
      type: 'defense',
      name: 'Защита',
      results: [
        { code: 'plus', label: '+' },
        { code: 'minus', label: '-' }
      ]
    },
    {
      type: 'error',
      name: 'Ошибка',
      results: [
        { code: 'error', label: 'Ошибка' }
      ]
    }
  ];

  const ROLE_ORDER = {
    opposite: 1,
    outside: 2,
    middle: 3,
    setter: 4,
    libero: 5,
    unknown: 6
  };

  let TEAM_DATA = window.SetkaTeams ? window.SetkaTeams.getActiveTeam() : {
    id: 'robotech',
    name: 'Роботех',
    subtitle: 'Волейбольная команда · сезон 2026',
    description: 'Данные команды загружаются из локального слоя профилей.',
    logoText: 'Р',
    contacts: [],
    socials: [],
    coaches: [],
    players: [],
    starterSlots: []
  };

  const state = {
    screen: 'welcome',
    previousScreen: 'menu',
    currentPlayerId: '',
    currentSet: 1,
    statsLineup: [],
    currentMatch: null,
    playerStatsFilters: {
      matchId: '',
      tournament: '',
      opponent: '',
      dateFrom: '',
      dateTo: ''
    },
    substitutionSlotIndex: -1,
    lastTapKey: '',
    lastTapAt: 0,
    autosaveTimer: null,
    wakeLock: null,
    results: {
      view: 'home',
      selectedMatchId: '',
      selectedPlayerId: '',
      selectedRole: '',
      compareIds: [],
      filters: {
        status: 'all',
        tournament: '',
        opponent: '',
        venue: '',
        result: '',
        dateFrom: '',
        dateTo: '',
        last: ''
      },
      eventFilters: {
        playerId: '',
        role: '',
        setNumber: '',
        actionType: '',
        result: ''
      },
      cacheKey: '',
      cache: null
    }
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const storage = {
    load(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (error) {
        console.warn('Не удалось прочитать локальные данные', key, error);
        return fallback;
      }
    },
    save(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.warn('Не удалось сохранить локальные данные', key, error);
      }
    },
    remove(key) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn('Не удалось удалить локальные данные', key, error);
      }
    },
    append(key, item) {
      const list = this.load(key, []);
      list.push(item);
      this.save(key, list);
      return list;
    }
  };

  function createId(prefix) {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return `${prefix}-${window.crypto.randomUUID()}`;
    }

    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function getFullName(player) {
    if (player.fullName) return player.fullName;
    return `${player.lastName} ${player.firstName}`;
  }

  function getShortName(player) {
    const lastName = player.lastName || String(player.fullName || '').split(/\s+/)[0] || '';
    const firstName = player.firstName || String(player.fullName || '').split(/\s+/)[1] || '';
    if (!lastName) return getFullName(player);
    if (!firstName) return lastName;
    return `${lastName} ${firstName.slice(0, 1)}.`;
  }

  function getPlayer(playerId) {
    return TEAM_DATA.players.find((player) => player.id === playerId) || null;
  }

  function getActiveTeamId() {
    return window.SetkaTeams ? window.SetkaTeams.getActiveTeamId() : storage.load(STORAGE_KEYS.activeTeamId, TEAM_DATA.id);
  }

  function setActiveTeam(teamId) {
    if (window.SetkaTeams) {
      window.SetkaTeams.setActiveTeamId(teamId);
      TEAM_DATA = window.SetkaTeams.getActiveTeam();
    } else {
      storage.save(STORAGE_KEYS.activeTeamId, teamId);
    }

    state.currentPlayerId = '';
    state.currentMatch = null;
    state.results.cacheKey = '';
    state.results.cache = null;
    state.results.selectedMatchId = '';
    state.results.selectedPlayerId = '';
    state.results.selectedRole = '';
    hydrateLineup();
    renderProfileSwitcher();
    renderTeam();
    if (state.screen === 'stats') {
      enterStatsScreen();
    }
    if (state.screen === 'results') renderResults();
    if (state.screen === 'player') showScreen('team');
  }

  function getPlayerSnapshot(player, status) {
    return {
      playerId: player.id,
      id: player.id,
      teamId: player.teamId || TEAM_DATA.id,
      number: player.number,
      name: getFullName(player),
      fullName: getFullName(player),
      lastName: player.lastName || '',
      firstName: player.firstName || '',
      patronymic: player.patronymic || '',
      role: player.role,
      roleKey: player.roleKey,
      height: player.height,
      birthDate: player.birthDate,
      photo: player.photo,
      registrationAddress: player.registrationAddress || '',
      status
    };
  }

  function buildMatchRoster() {
    const initialLineup = Array.isArray(state.currentMatch?.startingLineup) && state.currentMatch.startingLineup.length
      ? state.currentMatch.startingLineup
      : state.statsLineup;
    const starterIds = new Set(getLineupPlayerIds(initialLineup));
    const substitutions = storage.load(STORAGE_KEYS.substitutions, [])
      .filter((item) => item.matchId === state.currentMatch?.id && (!item.teamId || item.teamId === TEAM_DATA.id));
    const substitutionIds = new Set(substitutions.map((item) => item.inPlayerId));
    const sourceRoster = Array.isArray(state.currentMatch?.roster) && state.currentMatch.roster.length
      ? state.currentMatch.roster
      : TEAM_DATA.players.map((player) => getPlayerSnapshot(player, starterIds.has(player.id) ? 'старт' : 'запас'));

    return sourceRoster.map((item) => {
      const playerId = item.playerId || item.id;
      const player = getPlayer(playerId);
      let status = starterIds.has(playerId) ? 'старт' : 'запас';
      if (substitutionIds.has(playerId)) status = 'выходил на замену';
      return player
        ? getPlayerSnapshot(player, status)
        : {
          ...item,
          playerId,
          id: playerId,
          status,
          teamId: item.teamId || TEAM_DATA.id
        };
    });
  }

  function getTodayInputDate() {
    const date = new Date();
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 10);
  }

  function getActiveAccount() {
    return storage.load(STORAGE_KEYS.activeAccount, null);
  }

  function getAccountText() {
    return `Профиль: ${TEAM_DATA.name}`;
  }

  function formatDate(value) {
    if (!value) return '—';
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('ru-RU');
  }

  function setVersions() {
    $('#welcome-version').textContent = APP_VERSION;
    $('#menu-version').textContent = APP_VERSION;
  }

  function renderAccount() {
    const accountText = getAccountText();
    $('#welcome-account').textContent = accountText;
    renderProfileSwitcher();
  }

  function renderProfileSwitcher() {
    const button = $('#team-profile-button');
    const menu = $('#team-profile-menu');
    if (!button || !menu) return;

    button.textContent = `Профиль: ${TEAM_DATA.name}`;
    menu.innerHTML = (window.SetkaTeams ? window.SetkaTeams.getTeams() : [TEAM_DATA]).map((team) => `
      <button type="button" role="menuitem" data-team-id="${escapeHtml(team.id)}" class="${team.id === TEAM_DATA.id ? 'active' : ''}">
        ${escapeHtml(team.name)}
      </button>
    `).join('');
  }

  function showScreen(screenName) {
    const previous = state.screen;
    state.screen = screenName;
    state.previousScreen = previous === screenName ? state.previousScreen : previous;

    $$('.screen').forEach((screen) => {
      screen.classList.toggle('hidden', screen.dataset.screen !== screenName);
    });

    closeSubstitution();
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    if (screenName === 'stats') {
      enterStatsScreen();
    } else {
      releaseWakeLock();
    }
  }

  function returnToMenu() {
    showScreen('menu');
  }

  function isShortPasswordEnabled() {
    const settings = storage.load(STORAGE_KEYS.settings, {});
    const enabled = Boolean(
      settings.shortPasswordEnabled ||
      settings.pinEnabled ||
      settings.accessPasswordEnabled
    );
    const password = String(settings.shortPassword || settings.pin || settings.accessPassword || '');
    return enabled && password.length > 0;
  }

  function validateShortPassword(value) {
    const settings = storage.load(STORAGE_KEYS.settings, {});
    const password = String(settings.shortPassword || settings.pin || settings.accessPassword || '');
    return String(value) === password;
  }

  function boot() {
    setVersions();
    renderAccount();
    renderTeam();
    hydrateLineup();
    bindEvents();

    setTimeout(() => {
      if (isShortPasswordEnabled()) {
        showScreen('pin');
        $('#pin-input')?.focus();
      } else {
        showScreen('menu');
      }
    }, 1100);
  }

  function bindEvents() {
    $$('[data-back]').forEach((button) => {
      button.addEventListener('click', returnToMenu);
    });

    $$('.menu-grid [data-route]').forEach((button) => {
      button.addEventListener('click', () => {
        const route = button.dataset.route;
        if (route === 'team') {
          showScreen('team');
          return;
        }

        if (route === 'stats') {
          showScreen('stats');
          return;
        }

        if (route === 'results') {
          openResultsHome();
          return;
        }

        showPlaceholder(route);
      });
    });

    $('#player-back')?.addEventListener('click', () => showScreen('team'));

    $('#team-profile-button')?.addEventListener('click', () => {
      const menu = $('#team-profile-menu');
      const button = $('#team-profile-button');
      if (!menu || !button) return;
      const isHidden = menu.classList.toggle('hidden');
      button.setAttribute('aria-expanded', String(!isHidden));
    });

    $('#team-profile-menu')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-team-id]');
      if (!button) return;
      $('#team-profile-menu')?.classList.add('hidden');
      $('#team-profile-button')?.setAttribute('aria-expanded', 'false');
      setActiveTeam(button.dataset.teamId);
    });

    document.addEventListener('click', (event) => {
      if (event.target.closest('.profile-switcher')) return;
      $('#team-profile-menu')?.classList.add('hidden');
      $('#team-profile-button')?.setAttribute('aria-expanded', 'false');
    });

    $('#team-season-stats-toggle')?.addEventListener('click', () => {
      const section = $('#team-season-stats');
      if (!section) return;
      section.classList.toggle('hidden');
      renderTeamSeasonStats();
    });

    $('#pin-submit')?.addEventListener('click', submitPin);
    $('#pin-input')?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') submitPin();
    });

    $('#substitution-close')?.addEventListener('click', closeSubstitution);
    $('#substitution-modal')?.addEventListener('click', (event) => {
      if (event.target.id === 'substitution-modal') closeSubstitution();
    });
    $('#match-setup')?.addEventListener('click', handleMatchSetupClick);
    $('#match-setup')?.addEventListener('change', handleMatchSetupChange);
    $('#finish-match-button')?.addEventListener('click', openFinishMatchModal);
    $('#delete-draft-button')?.addEventListener('click', deleteActiveMatchDraft);
    $('#finish-match-save')?.addEventListener('click', saveFinishedMatch);
    $('#finish-match-cancel')?.addEventListener('click', closeFinishMatchModal);
    $('#finish-match-modal')?.addEventListener('click', handleFinishModalClick);

    $('#results-content')?.addEventListener('click', handleResultsClick);
    $('#results-content')?.addEventListener('change', handleResultsChange);
    $('#player-card')?.addEventListener('change', handlePlayerCardFilterChange);

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && state.screen === 'stats') {
        requestWakeLock();
      }
    });
  }

  function submitPin() {
    const input = $('#pin-input');
    const error = $('#pin-error');
    if (!input || !error) return;

    if (validateShortPassword(input.value)) {
      input.value = '';
      error.classList.add('hidden');
      showScreen('menu');
      return;
    }

    error.classList.remove('hidden');
    input.select();
  }

  function showPlaceholder(route) {
    const title = MENU_ITEMS[route] || 'Раздел';
    $('#placeholder-title').textContent = title;
    $('#placeholder-text').textContent = `${title}: скоро будет. Модуль зарезервирован для следующего этапа.`;
    showScreen('placeholder');
  }

  function renderTeam() {
    $('#team-logo').textContent = TEAM_DATA.logoText;
    $('#team-name').textContent = TEAM_DATA.name;
    $('#team-subtitle').textContent = TEAM_DATA.description || TEAM_DATA.subtitle;

    const coachesList = $('#coaches-list');
    coachesList.innerHTML = '';
    TEAM_DATA.coaches.forEach((coach) => {
      const item = document.createElement('div');
      item.className = 'person-strip';
      item.innerHTML = `
        <strong>${escapeHtml(coach.name)}</strong>
        <span>${escapeHtml(coach.role)}</span>
      `;
      coachesList.appendChild(item);
    });

    const playersList = $('#players-list');
    playersList.innerHTML = '';
    TEAM_DATA.players.forEach((player) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'player-row';
      button.innerHTML = `
        ${renderAvatar(player, 'small')}
        <span class="player-number">№${player.number}</span>
        <span class="player-main">
          <strong>${escapeHtml(getFullName(player))}</strong>
          <small>${escapeHtml(formatDate(player.birthDate))} · ${escapeHtml(player.role)} · ${player.height ? `${player.height} см` : 'рост не указан'}</small>
          <small>${escapeHtml(getPlayerSeasonShort(player.id))}</small>
        </span>
        <span class="player-status">${escapeHtml(player.status || 'не указан')}</span>
      `;
      button.addEventListener('click', () => openPlayer(player.id));
      playersList.appendChild(button);
    });

    const socials = $('#social-links');
    socials.innerHTML = '';
    TEAM_DATA.socials.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'link-row';
      row.innerHTML = `<span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.value)}</strong>`;
      socials.appendChild(row);
    });

    const contacts = $('#team-contacts');
    contacts.innerHTML = '';
    TEAM_DATA.contacts.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'link-row';
      row.innerHTML = `<span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.value)}</strong>`;
      contacts.appendChild(row);
    });

    renderTeamSeasonStats();
  }

  function getActiveTeamMatches() {
    if (!window.SetkaStorageMatches) return [];
    return window.SetkaStorageMatches.getAll(TEAM_DATA)
      .filter((match) => !match.teamId || match.teamId === TEAM_DATA.id);
  }

  function getPlayerSeasonShort(playerId) {
    const matches = getActiveTeamMatches();
    const playerMatches = matches.filter((match) => (match.events || []).some((event) => event.playerId === playerId));
    const totalActions = playerMatches.reduce((sum, match) => {
      return sum + (match.events || []).filter((event) => event.playerId === playerId).length;
    }, 0);

    if (!totalActions) return 'статистики пока нет';
    return `${playerMatches.length} матчей · ${totalActions} действий`;
  }

  function renderTeamSeasonStats() {
    const target = $('#team-season-stats-content');
    if (!target) return;

    const matches = getActiveTeamMatches();
    const playerStats = window.SetkaStatsPlayers
      ? window.SetkaStatsPlayers.calculatePlayerStats(matches, TEAM_DATA.id)
      : [];

    if (!matches.length || playerStats.every((player) => player.totalActions === 0)) {
      target.innerHTML = '<div class="results-state compact">По игрокам пока нет сохранённой статистики.</div>';
      return;
    }

    target.innerHTML = playerStats.map((player) => `
      <button class="season-player-row" type="button" data-player-season-id="${escapeHtml(player.playerId)}">
        <span class="avatar small">${escapeHtml(player.number || '')}</span>
        <span>
          <strong>${escapeHtml(player.name)}</strong>
          <small>${escapeHtml(player.role || 'не указано')} · ${player.totalActions} действий · ошибок ${player.errors}</small>
        </span>
      </button>
    `).join('');

    target.querySelectorAll('[data-player-season-id]').forEach((button) => {
      button.addEventListener('click', () => openPlayer(button.dataset.playerSeasonId));
    });
  }

  function renderAvatar(player, size) {
    if (player.photo) {
      return `<img class="avatar ${size}" src="${escapeHtml(player.photo)}" alt="" />`;
    }

    return `<span class="avatar ${size}" aria-hidden="true">${player.number}</span>`;
  }

  function openPlayer(playerId) {
    state.currentPlayerId = playerId;
    state.playerStatsFilters = { matchId: '', tournament: '', opponent: '', dateFrom: '', dateTo: '' };
    renderPlayerCard(playerId);
    showScreen('player');
  }

  function renderPlayerCard(playerId) {
    const player = getPlayer(playerId);
    const card = $('#player-card');
    if (!player || !card) return;

    const season = getPlayerSeasonAnalytics(player.id);

    card.innerHTML = `
      <div class="player-photo">${renderAvatar(player, 'large')}</div>
      <div class="player-card-title">
        <h2>${escapeHtml(getFullName(player))}</h2>
        <p>№${player.number} · ${escapeHtml(player.role)}</p>
      </div>
      <dl class="player-facts">
        <div><dt>Команда</dt><dd>${escapeHtml(TEAM_DATA.name)}</dd></div>
        <div><dt>Рост</dt><dd>${player.height ? `${player.height} см` : 'не указан'}</dd></div>
        <div><dt>Дата рождения</dt><dd>${escapeHtml(formatDate(player.birthDate))}</dd></div>
        <div><dt>Амплуа</dt><dd>${escapeHtml(player.role)}</dd></div>
      </dl>
      <section class="season-stats" aria-label="Статистика за сезон">
        <h2>Статистика за сезон</h2>
        ${renderPlayerSeasonFilters(season.matches)}
        ${renderPlayerSeasonStats(season)}
      </section>
    `;
  }

  function getPlayerSeasonAnalytics(playerId) {
    const filters = state.playerStatsFilters;
    let matches = getActiveTeamMatches();
    if (filters.matchId) matches = matches.filter((match) => match.id === filters.matchId);
    if (filters.tournament) matches = matches.filter((match) => match.tournament === filters.tournament);
    if (filters.opponent) matches = matches.filter((match) => match.opponent === filters.opponent);
    if (filters.dateFrom) matches = matches.filter((match) => match.date >= filters.dateFrom);
    if (filters.dateTo) matches = matches.filter((match) => match.date <= filters.dateTo);

    const playerEvents = matches.flatMap((match) => (match.events || [])
      .filter((event) => event.playerId === playerId && (!event.teamId || event.teamId === TEAM_DATA.id))
      .map((event) => ({ ...event, match })));
    const playedMatches = matches.filter((match) => (match.events || []).some((event) => event.playerId === playerId));
    const setNumbers = new Set(playerEvents.map((event) => event.setNumber).filter(Boolean));

    return {
      matches,
      playedMatches,
      events: playerEvents,
      setCount: setNumbers.size,
      stats: window.SetkaStatsCore.calculateTeamStats(playerEvents),
      dynamics: matches.map((match) => ({
        matchId: match.id,
        date: match.date,
        opponent: match.opponent,
        totalActions: (match.events || []).filter((event) => event.playerId === playerId).length,
        errors: (match.events || []).filter((event) => event.playerId === playerId && event.actionType === 'error').length
      }))
    };
  }

  function renderPlayerSeasonFilters(matches) {
    const filters = state.playerStatsFilters;
    const tournaments = uniqueOptions(matches.map((match) => match.tournament));
    const opponents = uniqueOptions(matches.map((match) => match.opponent));
    return `
      <div class="player-season-filters">
        <select data-player-filter="matchId">
          ${option('', 'Все матчи', filters.matchId)}
          ${matches.map((match) => option(match.id, `${formatDate(match.date)} · ${match.opponent}`, filters.matchId)).join('')}
        </select>
        <select data-player-filter="tournament">
          ${option('', 'Все турниры', filters.tournament)}
          ${tournaments.map((value) => option(value, value, filters.tournament)).join('')}
        </select>
        <select data-player-filter="opponent">
          ${option('', 'Все соперники', filters.opponent)}
          ${opponents.map((value) => option(value, value, filters.opponent)).join('')}
        </select>
        <input type="date" value="${escapeHtml(filters.dateFrom)}" data-player-filter="dateFrom" aria-label="С даты">
        <input type="date" value="${escapeHtml(filters.dateTo)}" data-player-filter="dateTo" aria-label="По дату">
      </div>
    `;
  }

  function renderPlayerSeasonStats(season) {
    if (!season.events.length) {
      return '<div class="results-state compact">По этому игроку пока нет сохранённой статистики.</div>';
    }

    return `
      <div class="metric-grid">
        ${metricCard('Матчей', season.playedMatches.length)}
        ${metricCard('Партий', season.setCount)}
        ${metricCard('Действий', season.events.length)}
        ${metricCard('Среднее за матч', season.playedMatches.length ? Math.round((season.events.length / season.playedMatches.length) * 10) / 10 : 0)}
        ${metricCard('Ошибки', season.stats.errors.total)}
      </div>
      <div class="table-scroll">
        <table class="stats-table">
          <thead><tr><th>Действие</th><th>Всего</th><th>Плюс</th><th>Минус</th><th>Средне</th></tr></thead>
          <tbody>${window.SetkaStatsCore.ACTIONS.map((action) => renderActionStatsRow(season.stats.byAction[action.type])).join('')}</tbody>
        </table>
      </div>
      <div class="table-scroll">
        <table class="stats-table">
          <thead><tr><th>Матч</th><th>Действий</th><th>Ошибки</th></tr></thead>
          <tbody>${season.dynamics.map((item) => `<tr><td>${escapeHtml(formatDate(item.date))}<br><small>${escapeHtml(item.opponent)}</small></td><td>${item.totalActions}</td><td>${item.errors}</td></tr>`).join('')}</tbody>
        </table>
      </div>
    `;
  }

  function handlePlayerCardFilterChange(event) {
    const filter = event.target.dataset.playerFilter;
    if (!filter) return;
    state.playerStatsFilters[filter] = event.target.value;
    if (state.currentPlayerId) renderPlayerCard(state.currentPlayerId);
  }

  function getLineupPlayerIds(lineup) {
    return (Array.isArray(lineup) ? lineup : [])
      .map((slot) => slot?.playerId || slot?.id || '')
      .filter(Boolean);
  }

  function sortPlayersForLineup(players) {
    return players.slice().sort((a, b) => {
      const roleDiff = (ROLE_ORDER[a.roleKey] || ROLE_ORDER.unknown) - (ROLE_ORDER[b.roleKey] || ROLE_ORDER.unknown);
      return roleDiff || Number(a.number || 0) - Number(b.number || 0);
    });
  }

  function padLineupSlots(slots) {
    const result = slots.slice(0, 7);
    while (result.length < 7) {
      result.push({
        slotId: `${TEAM_DATA.id}-empty-${result.length + 1}`,
        label: 'Свободная строка',
        tone: 'unknown',
        playerId: ''
      });
    }
    return result;
  }

  function normalizeLineupSlots(lineup) {
    const source = Array.isArray(lineup) && lineup.length ? lineup : TEAM_DATA.starterSlots;
    return padLineupSlots(source.map((slot, index) => {
      const playerId = slot?.playerId || slot?.id || '';
      const player = getPlayer(playerId);
      return {
        slotId: slot?.slotId || `${TEAM_DATA.id}-slot-${index + 1}`,
        label: player?.role || slot?.label || slot?.role || 'Свободная строка',
        tone: player?.roleKey || slot?.tone || slot?.roleKey || 'unknown',
        playerId
      };
    }));
  }

  function createLineupSlots(players) {
    return padLineupSlots(sortPlayersForLineup(players).map((player, index) => ({
      slotId: `${TEAM_DATA.id}-match-slot-${index + 1}`,
      label: player.role || 'не указано',
      tone: player.roleKey || 'unknown',
      playerId: player.id
    })));
  }

  function isActiveStatsMatch(match) {
    return Boolean(match && (!match.teamId || match.teamId === TEAM_DATA.id) && match.status !== 'завершён');
  }

  function getStoredActiveMatchForTeam() {
    return storage.load(STORAGE_KEYS.matches, [])
      .filter((match) => isActiveStatsMatch(match))
      .sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')))[0] || null;
  }

  function hydrateLineup() {
    const savedMatch = storage.load(STORAGE_KEYS.currentMatch, null);
    const activeMatch = isActiveStatsMatch(savedMatch) ? savedMatch : getStoredActiveMatchForTeam();
    state.statsLineup = normalizeLineupSlots(TEAM_DATA.starterSlots);

    if (activeMatch) {
      const currentLineup = activeMatch.lineup || activeMatch.activeLineup || activeMatch.startingLineup || TEAM_DATA.starterSlots;
      const normalizedCurrentLineup = normalizeLineupSlots(currentLineup);
      const normalizedStartingLineup = Array.isArray(activeMatch.startingLineup) && activeMatch.startingLineup.length
        ? normalizeLineupSlots(activeMatch.startingLineup).filter((slot) => slot.playerId)
        : normalizedCurrentLineup.filter((slot) => slot.playerId);
      state.statsLineup = normalizedCurrentLineup;
      state.currentMatch = {
        ...activeMatch,
        teamId: activeMatch.teamId || TEAM_DATA.id,
        teamName: activeMatch.teamName || TEAM_DATA.name,
        ourTeam: activeMatch.ourTeam || TEAM_DATA.name,
        location: activeMatch.location || activeMatch.venue || '',
        venue: activeMatch.venue || activeMatch.location || '',
        lineup: normalizedCurrentLineup,
        startingLineup: normalizedStartingLineup
      };
    } else {
      state.currentMatch = null;
    }
  }

  function enterStatsScreen() {
    hydrateLineup();
    closeFinishMatchModal();

    const setup = $('#match-setup');
    const orientationHint = $('.orientation-hint');
    const workbench = $('.stats-workbench');

    if (state.currentMatch) {
      setup?.classList.add('hidden');
      orientationHint?.classList.remove('hidden');
      workbench?.classList.remove('hidden');
      renderStatsPanel();
      requestWakeLock();
      return;
    }

    releaseWakeLock();
    renderMatchSetup();
    setup?.classList.remove('hidden');
    orientationHint?.classList.add('hidden');
    workbench?.classList.add('hidden');
  }

  function ensureStatsMatch() {
    if (isActiveStatsMatch(state.currentMatch)) return true;
    hydrateLineup();
    if (isActiveStatsMatch(state.currentMatch)) return true;
    enterStatsScreen();
    alert('Сначала создайте матч для записи статистики.');
    return false;
  }

  function renderMatchSetup() {
    const setup = $('#match-setup');
    if (!setup) return;
    const starterIds = new Set(TEAM_DATA.starterSlots.map((slot) => slot.playerId));

    setup.innerHTML = `
      <header class="section-header">
        <button class="back-button" type="button" data-setup-action="back-menu">Меню</button>
        <h1>Новый матч</h1>
      </header>
      <section class="match-setup-hero">
        <div class="team-logo setup-logo">${escapeHtml(TEAM_DATA.logoText || TEAM_DATA.name.slice(0, 1))}</div>
        <div>
          <span>Активный профиль</span>
          <h2>${escapeHtml(TEAM_DATA.name)}</h2>
          <p>Создайте матч, выберите заявку и стартовый состав. После этого откроется рабочая панель статистики.</p>
        </div>
      </section>
      <section class="match-setup-section">
        <h2>Матч</h2>
        <div class="match-form-grid">
          <label>Соперник *
            <input id="match-opponent" type="text" autocomplete="off" placeholder="Название соперника">
          </label>
          <label>Дата *
            <input id="match-date" type="date" value="${getTodayInputDate()}">
          </label>
          <label>Турнир
            <input id="match-tournament" type="text" autocomplete="off" placeholder="Турнир или лига">
          </label>
          <label>Место
            <input id="match-location" type="text" autocomplete="off" placeholder="Площадка, город или выезд">
          </label>
          <label>Тип матча
            <select id="match-type">
              <option value="товарищеский">товарищеский</option>
              <option value="турнирный">турнирный</option>
              <option value="тренировка">тренировка</option>
              <option value="другой">другой</option>
            </select>
          </label>
          <label>Формат
            <select id="match-format">
              <option value="до 3 партий">до 3 партий</option>
              <option value="до 5 партий">до 5 партий</option>
            </select>
          </label>
          <label class="wide">Комментарий тренера
            <textarea id="match-comment" rows="3" placeholder="Необязательно"></textarea>
          </label>
        </div>
      </section>
      <section class="match-setup-section">
        <div class="results-section-head">
          <h2>Заявка и старт</h2>
          <span>До 7 игроков в старте</span>
        </div>
        <div class="roster-picker">
          ${TEAM_DATA.players.map((player) => {
            const isStarter = starterIds.has(player.id);
            return `
              <label class="roster-picker-row">
                ${renderAvatar(player, 'small')}
                <span class="roster-picker-main">
                  <strong>№${escapeHtml(player.number)} ${escapeHtml(getFullName(player))}</strong>
                  <small>${escapeHtml(player.role)}${player.height ? ` · ${escapeHtml(player.height)} см` : ''}</small>
                </span>
                <span class="roster-picker-controls">
                  <span><input type="checkbox" data-setup-participant value="${escapeHtml(player.id)}" checked> В заявке</span>
                  <span><input type="checkbox" data-setup-starter value="${escapeHtml(player.id)}"${isStarter ? ' checked' : ''}> Старт</span>
                </span>
              </label>
            `;
          }).join('')}
        </div>
        <p class="setup-note">Игроки вне заявки не попадут в запись статистики и результаты этого матча.</p>
      </section>
      <div class="match-setup-actions">
        <button class="primary-action" type="button" data-setup-action="start-match">Начать запись</button>
        <button class="secondary-button" type="button" data-setup-action="back-menu">Отмена</button>
      </div>
    `;
  }

  function handleMatchSetupClick(event) {
    const button = event.target.closest('[data-setup-action]');
    if (!button) return;
    const action = button.dataset.setupAction;
    if (action === 'back-menu') {
      returnToMenu();
      return;
    }
    if (action === 'start-match') {
      createMatchFromSetup();
    }
  }

  function handleMatchSetupChange(event) {
    const participant = event.target.closest('[data-setup-participant]');
    const starter = event.target.closest('[data-setup-starter]');

    if (participant && !participant.checked) {
      const starterInput = $$('[data-setup-starter]').find((input) => input.value === participant.value);
      if (starterInput) starterInput.checked = false;
    }

    if (starter) {
      const participantInput = $$('[data-setup-participant]').find((input) => input.value === starter.value);
      if (starter.checked && participantInput) participantInput.checked = true;
      const starterCount = $$('[data-setup-starter]:checked').length;
      if (starterCount > 7) {
        starter.checked = false;
        alert('В стартовом составе может быть не больше 7 строк с учётом либеро.');
      }
    }
  }

  function createMatchFromSetup() {
    const setup = $('#match-setup');
    const opponent = $('#match-opponent', setup)?.value.trim() || '';
    const date = $('#match-date', setup)?.value || getTodayInputDate();
    const tournament = $('#match-tournament', setup)?.value.trim() || '';
    const location = $('#match-location', setup)?.value.trim() || '';
    const matchType = $('#match-type', setup)?.value || 'товарищеский';
    const matchFormat = $('#match-format', setup)?.value || 'до 3 партий';
    const coachComment = $('#match-comment', setup)?.value.trim() || '';
    const participantIds = $$('[data-setup-participant]:checked', setup).map((input) => input.value);
    const starterIds = $$('[data-setup-starter]:checked', setup).map((input) => input.value).filter((id) => participantIds.includes(id));

    if (!opponent) {
      alert('Укажите соперника.');
      $('#match-opponent', setup)?.focus();
      return;
    }
    if (!participantIds.length) {
      alert('Выберите хотя бы одного игрока в заявку.');
      return;
    }
    if (starterIds.length > 7) {
      alert('В стартовом составе может быть не больше 7 игроков.');
      return;
    }
    if (starterIds.length < 6 && !confirm('В стартовом составе меньше 6 игроков. Начать запись всё равно?')) {
      return;
    }

    const participants = participantIds.map(getPlayer).filter(Boolean);
    const starters = sortPlayersForLineup(starterIds.map(getPlayer).filter(Boolean));
    const lineup = createLineupSlots(starters);
    const starterIdSet = new Set(starters.map((player) => player.id));
    const roster = participants.map((player) => getPlayerSnapshot(player, starterIdSet.has(player.id) ? 'старт' : 'запас'));
    const bench = participants
      .filter((player) => !starterIdSet.has(player.id))
      .map((player) => getPlayerSnapshot(player, 'запас'));
    const now = new Date().toISOString();
    const id = createId('match');

    state.currentSet = 1;
    state.statsLineup = lineup;
    state.currentMatch = {
      id,
      matchId: id,
      teamId: TEAM_DATA.id,
      teamName: TEAM_DATA.name,
      ourTeam: TEAM_DATA.name,
      opponent,
      date,
      tournament,
      location,
      venue: location,
      matchType,
      matchFormat,
      status: 'идёт матч',
      roster,
      startingLineup: lineup.filter((slot) => slot.playerId),
      lineup,
      bench,
      substitutions: [],
      sets: [],
      setScores: [],
      finalScore: '',
      result: '',
      coachComment,
      setNumber: state.currentSet,
      title: `${TEAM_DATA.name} — ${opponent}`,
      createdAt: now,
      updatedAt: now,
      events: []
    };

    saveCurrentMatch();
    enterStatsScreen();
    updateAutosave();
  }

  function saveCurrentMatch() {
    if (!state.currentMatch) return;
    state.currentMatch.teamId = state.currentMatch.teamId || TEAM_DATA.id;
    state.currentMatch.teamName = TEAM_DATA.name;
    state.currentMatch.ourTeam = TEAM_DATA.name;
    state.currentMatch.updatedAt = new Date().toISOString();
    state.currentMatch.location = state.currentMatch.location || state.currentMatch.venue || '';
    state.currentMatch.venue = state.currentMatch.venue || state.currentMatch.location || '';
    if (!Array.isArray(state.currentMatch.startingLineup) || !state.currentMatch.startingLineup.length) {
      state.currentMatch.startingLineup = state.statsLineup.filter((slot) => slot.playerId);
    }
    state.currentMatch.lineup = state.statsLineup;
    state.currentMatch.setNumber = state.currentSet;
    state.currentMatch.roster = buildMatchRoster();
    state.currentMatch.bench = getBenchRosterSnapshots();
    state.currentMatch.substitutions = storage.load(STORAGE_KEYS.substitutions, [])
      .filter((item) => item.matchId === state.currentMatch.id && (!item.teamId || item.teamId === TEAM_DATA.id));
    state.currentMatch.events = window.SetkaStorageEvents
      ? window.SetkaStorageEvents.getByMatch(state.currentMatch.id).filter((event) => !event.teamId || event.teamId === TEAM_DATA.id)
      : storage.load(STORAGE_KEYS.statsEvents, []).filter((event) => event.matchId === state.currentMatch.id && (!event.teamId || event.teamId === TEAM_DATA.id));
    storage.save(STORAGE_KEYS.currentMatch, state.currentMatch);
    if (window.SetkaStorageMatches) {
      window.SetkaStorageMatches.upsert(state.currentMatch);
    }
  }

  function renderStatsPanel() {
    const match = state.currentMatch;
    $('#stats-match-name').textContent = match ? `${TEAM_DATA.name} — ${match.opponent}` : TEAM_DATA.name;
    $('#stats-set-score').textContent = match
      ? `${formatDate(match.date)} · партия ${state.currentSet} · ${match.status || 'идёт матч'}`
      : `Партия ${state.currentSet}`;
    const finishButton = $('#finish-match-button');
    const deleteButton = $('#delete-draft-button');
    if (finishButton) finishButton.disabled = !match;
    if (deleteButton) deleteButton.disabled = !match;

    const grid = $('#stats-grid');
    grid.innerHTML = '';
    grid.appendChild(renderStatsHeader());

    state.statsLineup.forEach((slot, index) => {
      grid.appendChild(renderStatsRow(slot, index));
    });
  }

  function renderStatsHeader() {
    const header = document.createElement('div');
    header.className = 'stats-row stats-header-row';
    header.setAttribute('role', 'row');

    const playerCell = document.createElement('div');
    playerCell.className = 'stats-cell stats-player-header';
    playerCell.setAttribute('role', 'columnheader');
    playerCell.textContent = 'Игрок';
    header.appendChild(playerCell);

    ACTION_GROUPS.forEach((group) => {
      const cell = document.createElement('div');
      cell.className = 'stats-cell stats-action-header';
      cell.setAttribute('role', 'columnheader');
      cell.textContent = group.name;
      header.appendChild(cell);
    });

    return header;
  }

  function renderStatsRow(slot, index) {
    const player = getPlayer(slot.playerId);
    const row = document.createElement('div');
    row.className = `stats-row role-${slot.tone}`;
    row.setAttribute('role', 'row');

    const playerButton = document.createElement('button');
    playerButton.type = 'button';
    playerButton.className = 'stats-player-cell';
    playerButton.setAttribute('role', 'cell');
    playerButton.innerHTML = player ? `
      ${renderAvatar(player, 'tiny')}
      <span>
        <strong>${escapeHtml(getShortName(player))}</strong>
        <small>${escapeHtml(player.role)}</small>
      </span>
    ` : `
      <span class="avatar tiny">—</span>
      <span><strong>Пусто</strong><small>${escapeHtml(slot.label)}</small></span>
    `;
    playerButton.addEventListener('click', () => openSubstitution(index));
    row.appendChild(playerButton);

    ACTION_GROUPS.forEach((group) => {
      const cell = document.createElement('div');
      cell.className = `stats-cell stats-action-cell result-count-${group.results.length}`;
      cell.setAttribute('role', 'cell');

      group.results.forEach((result) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = group.type === 'error' ? 'stat-button stat-button-error' : 'stat-button';
        button.textContent = result.label;
        button.setAttribute('aria-label', `${group.name}: ${result.label}`);
        button.addEventListener('click', () => {
          if (!player) return;
          recordStatEvent(player, group, result, button);
        });
        cell.appendChild(button);
      });

      row.appendChild(cell);
    });

    return row;
  }

  function recordStatEvent(player, group, result, button) {
    if (!ensureStatsMatch()) return;

    const tapKey = `${player.id}:${group.type}:${result.code}`;
    const now = Date.now();
    if (state.lastTapKey === tapKey && now - state.lastTapAt < 260) {
      return;
    }

    state.lastTapKey = tapKey;
    state.lastTapAt = now;

    button.classList.remove('pressed');
    window.requestAnimationFrame(() => button.classList.add('pressed'));
    window.setTimeout(() => button.classList.remove('pressed'), 180);

    const event = {
      id: createId('event'),
      teamId: TEAM_DATA.id,
      matchId: state.currentMatch.id,
      playerId: player.id,
      playerNumber: player.number,
      playerName: getFullName(player),
      playerRole: player.role,
      actionType: group.type,
      actionName: group.name,
      actionResult: result.code,
      resultLabel: result.label,
      time: new Date().toISOString(),
      setNumber: state.currentSet,
      timestamp: new Date().toISOString()
    };

    if (state.currentMatch.status !== 'идёт матч') state.currentMatch.status = 'сохранён локально';
    if (window.SetkaStorageEvents) {
      window.SetkaStorageEvents.appendEvent(event);
    } else {
      storage.append(STORAGE_KEYS.statsEvents, event);
    }
    saveCurrentMatch();
    updateAutosave();

    if (navigator.vibrate) navigator.vibrate(8);
  }

  function updateAutosave() {
    const indicator = $('#autosave-indicator');
    if (!indicator) return;

    indicator.textContent = 'Сохранение';
    indicator.classList.add('saving');
    window.clearTimeout(state.autosaveTimer);
    state.autosaveTimer = window.setTimeout(() => {
      const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      indicator.textContent = `Сохранено ${time}`;
      indicator.classList.remove('saving');
    }, 220);
  }

  function openSubstitution(slotIndex) {
    state.substitutionSlotIndex = slotIndex;
    const currentSlot = state.statsLineup[slotIndex];
    const currentPlayer = getPlayer(currentSlot.playerId);
    const benchPlayers = getBenchPlayers();

    $('#substitution-current').textContent = currentPlayer
      ? `Сейчас в строке: ${getFullName(currentPlayer)}`
      : 'Строка свободна';

    const benchList = $('#bench-list');
    benchList.innerHTML = '';

    if (benchPlayers.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-note';
      empty.textContent = 'Скамейка пуста';
      benchList.appendChild(empty);
    } else {
      benchPlayers.forEach((player) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'bench-player';
        button.innerHTML = `
          ${renderAvatar(player, 'small')}
          <span>
            <strong>${escapeHtml(getFullName(player))}</strong>
            <small>№${player.number} · ${escapeHtml(player.role)} · ${player.height} см</small>
          </span>
        `;
        button.addEventListener('click', () => applySubstitution(slotIndex, player.id));
        benchList.appendChild(button);
      });
    }

    $('#substitution-modal').classList.remove('hidden');
  }

  function closeSubstitution() {
    const modal = $('#substitution-modal');
    if (modal) modal.classList.add('hidden');
    state.substitutionSlotIndex = -1;
  }

  function getBenchPlayers() {
    const activeIds = new Set(state.statsLineup.map((slot) => slot.playerId));
    const rosterIds = Array.isArray(state.currentMatch?.roster) && state.currentMatch.roster.length
      ? state.currentMatch.roster.map((player) => player.playerId || player.id)
      : TEAM_DATA.players.map((player) => player.id);
    return rosterIds
      .map(getPlayer)
      .filter((player) => player && !activeIds.has(player.id));
  }

  function getBenchRosterSnapshots() {
    const activeIds = new Set(state.statsLineup.map((slot) => slot.playerId).filter(Boolean));
    return getBenchPlayers().map((player) => getPlayerSnapshot(player, activeIds.has(player.id) ? 'старт' : 'запас'));
  }

  function applySubstitution(slotIndex, incomingPlayerId) {
    if (!ensureStatsMatch()) return;

    const slot = state.statsLineup[slotIndex];
    const outgoingPlayerId = slot.playerId;
    slot.playerId = incomingPlayerId;

    const substitution = {
      id: createId('substitution'),
      teamId: TEAM_DATA.id,
      matchId: state.currentMatch.id,
      slotId: slot.slotId,
      outPlayerId: outgoingPlayerId,
      inPlayerId: incomingPlayerId,
      time: new Date().toISOString(),
      setNumber: state.currentSet
    };

    if (window.SetkaStorageMatches) {
      window.SetkaStorageMatches.appendSubstitution(substitution);
    } else {
      storage.append(STORAGE_KEYS.substitutions, substitution);
    }

    if (state.currentMatch.status !== 'идёт матч') state.currentMatch.status = 'сохранён локально';
    saveCurrentMatch();
    updateAutosave();
    closeSubstitution();
    renderStatsPanel();
  }

  function getPlannedSetCount(match) {
    return String(match?.matchFormat || '').includes('5') ? 5 : 3;
  }

  function openFinishMatchModal() {
    if (!ensureStatsMatch()) return;
    const modal = $('#finish-match-modal');
    const form = $('#finish-match-form');
    if (!modal || !form) return;

    resetFinishModalButtons();
    $('#finish-match-title').textContent = 'Завершить матч';
    $('#finish-match-summary').textContent = `${TEAM_DATA.name} — ${state.currentMatch.opponent}`;
    const plannedSets = getPlannedSetCount(state.currentMatch);
    const existingSets = Array.isArray(state.currentMatch.sets) ? state.currentMatch.sets : [];
    const existingScores = Array.isArray(state.currentMatch.setScores) ? state.currentMatch.setScores : [];

    form.innerHTML = `
      <label>Результат
        <select id="finish-result">
          ${option('', 'Выберите результат', state.currentMatch.result || '')}
          ${option('победа', 'Победа', state.currentMatch.result || '')}
          ${option('поражение', 'Поражение', state.currentMatch.result || '')}
        </select>
      </label>
      <div class="finish-set-list">
        ${Array.from({ length: plannedSets }, (_, index) => {
          const existing = existingSets[index] || {};
          const scoreParts = typeof existingScores[index] === 'string' ? existingScores[index].split(/[:\-]/) : [];
          const ours = existing.ours ?? scoreParts[0] ?? '';
          const opponent = existing.opponent ?? scoreParts[1] ?? '';
          return `
            <div class="finish-set-row">
              <strong>Партия ${index + 1}</strong>
              <input type="number" min="0" inputmode="numeric" data-finish-ours="${index + 1}" value="${escapeHtml(ours)}" aria-label="Наши очки, партия ${index + 1}">
              <span>:</span>
              <input type="number" min="0" inputmode="numeric" data-finish-opponent="${index + 1}" value="${escapeHtml(opponent)}" aria-label="Очки соперника, партия ${index + 1}">
            </div>
          `;
        }).join('')}
      </div>
      <label>Комментарий тренера
        <textarea id="finish-comment" rows="3">${escapeHtml(state.currentMatch.coachComment || '')}</textarea>
      </label>
    `;

    modal.classList.remove('hidden');
  }

  function closeFinishMatchModal() {
    $('#finish-match-modal')?.classList.add('hidden');
  }

  function handleFinishModalClick(event) {
    if (event.target.id === 'finish-match-modal') {
      closeFinishMatchModal();
      return;
    }

    const actionButton = event.target.closest('[data-finish-action]');
    if (!actionButton) return;
    if (actionButton.dataset.finishAction === 'results') {
      closeFinishMatchModal();
      openResultsHome();
    }
    if (actionButton.dataset.finishAction === 'menu') {
      closeFinishMatchModal();
      returnToMenu();
    }
  }

  function collectFinishSets() {
    const form = $('#finish-match-form');
    const plannedSets = getPlannedSetCount(state.currentMatch);
    const sets = [];

    for (let setNumber = 1; setNumber <= plannedSets; setNumber += 1) {
      const oursRaw = $(`[data-finish-ours="${setNumber}"]`, form)?.value;
      const opponentRaw = $(`[data-finish-opponent="${setNumber}"]`, form)?.value;
      if (oursRaw === '' && opponentRaw === '') continue;
      const ours = Number(oursRaw || 0);
      const opponent = Number(opponentRaw || 0);
      sets.push({
        setNumber,
        ours,
        opponent,
        score: `${ours}:${opponent}`
      });
    }

    return sets;
  }

  function calculateFinalScoreFromSets(sets) {
    const score = sets.reduce((acc, set) => {
      if (set.ours > set.opponent) acc.ours += 1;
      if (set.opponent > set.ours) acc.opponent += 1;
      return acc;
    }, { ours: 0, opponent: 0 });
    return sets.length ? `${score.ours}:${score.opponent}` : '';
  }

  function saveFinishedMatch() {
    if (!state.currentMatch) return;
    const result = $('#finish-result')?.value || '';
    const sets = collectFinishSets();
    const setScores = sets.map((set) => set.score);
    const finalScore = calculateFinalScoreFromSets(sets);

    if (!result && finalScore) {
      const parsed = window.SetkaStatsSeason?.parseFinalScore(finalScore);
      state.currentMatch.result = parsed && parsed.ours > parsed.opponent ? 'победа' : 'поражение';
    } else {
      state.currentMatch.result = result;
    }

    state.currentMatch.status = 'завершён';
    state.currentMatch.sets = sets;
    state.currentMatch.setScores = setScores;
    state.currentMatch.finalScore = finalScore || state.currentMatch.finalScore || '—';
    state.currentMatch.coachComment = $('#finish-comment')?.value.trim() || state.currentMatch.coachComment || '';
    saveCurrentMatch();

    if (window.SetkaStorageMatches) {
      window.SetkaStorageMatches.clearCurrent(state.currentMatch.id);
    } else {
      storage.remove(STORAGE_KEYS.currentMatch);
    }

    state.results.cacheKey = '';
    state.currentMatch = null;
    state.statsLineup = normalizeLineupSlots(TEAM_DATA.starterSlots);
    releaseWakeLock();

    $('#finish-match-title').textContent = 'Матч сохранён';
    $('#finish-match-summary').textContent = 'Матч добавлен в раздел результатов.';
    $('#finish-match-form').innerHTML = `
      <div class="results-state compact">Статистика пересчитана и готова к просмотру.</div>
      <div class="modal-actions">
        <button class="primary-action" type="button" data-finish-action="results">Открыть результаты</button>
        <button class="secondary-button" type="button" data-finish-action="menu">Вернуться в меню</button>
      </div>
    `;
    $('#finish-match-save')?.classList.add('hidden');
    $('#finish-match-cancel')?.classList.add('hidden');
  }

  function resetFinishModalButtons() {
    $('#finish-match-save')?.classList.remove('hidden');
    $('#finish-match-cancel')?.classList.remove('hidden');
  }

  function deleteActiveMatchDraft() {
    if (!state.currentMatch) return;
    const matchId = state.currentMatch.id;
    if (!confirm('Удалить текущий матч и все записанные действия?')) return;

    if (window.SetkaStorageEvents) {
      window.SetkaStorageEvents.deleteByMatch(matchId);
    } else {
      const events = storage.load(STORAGE_KEYS.statsEvents, []);
      storage.save(STORAGE_KEYS.statsEvents, events.filter((event) => event.matchId !== matchId));
    }

    const substitutions = storage.load(STORAGE_KEYS.substitutions, []);
    storage.save(STORAGE_KEYS.substitutions, substitutions.filter((item) => item.matchId !== matchId));

    if (window.SetkaStorageMatches) {
      window.SetkaStorageMatches.deleteMatch(matchId);
    } else {
      const matches = storage.load(STORAGE_KEYS.matches, []);
      storage.save(STORAGE_KEYS.matches, matches.filter((match) => (match.id || match.matchId) !== matchId));
      storage.remove(STORAGE_KEYS.currentMatch);
    }

    state.currentMatch = null;
    state.results.cacheKey = '';
    state.statsLineup = normalizeLineupSlots(TEAM_DATA.starterSlots);
    enterStatsScreen();
  }

  function openResultsHome() {
    state.results.view = 'home';
    state.results.selectedMatchId = '';
    state.results.selectedPlayerId = '';
    state.results.selectedRole = '';
    showScreen('results');
    renderResults();
  }

  function getResultsData() {
    const matches = window.SetkaStorageMatches ? window.SetkaStorageMatches.getAll(TEAM_DATA) : [];
    const loadInfo = window.SetkaStorageMatches ? window.SetkaStorageMatches.getLoadInfo() : { damaged: 0, usedMock: false };
    const cacheKey = JSON.stringify({
      teamId: TEAM_DATA.id,
      ids: matches.map((match) => `${match.id}:${match.updatedAt}:${(match.events || []).length}`).join('|'),
      filters: state.results.filters
    });

    if (state.results.cacheKey === cacheKey && state.results.cache) {
      return state.results.cache;
    }

    const filteredMatches = filterMatches(matches);
    const data = {
      matches,
      filteredMatches,
      loadInfo,
      season: window.SetkaStatsSeason.calculateSeasonStats(filteredMatches, TEAM_DATA.id),
      best: window.SetkaStatsBest.getBestPerformers(filteredMatches, TEAM_DATA.id),
      tournaments: uniqueOptions(matches.map((match) => match.tournament)),
      opponents: uniqueOptions(matches.map((match) => match.opponent)),
      venues: uniqueOptions(matches.map((match) => match.location || match.venue))
    };

    state.results.cacheKey = cacheKey;
    state.results.cache = data;
    return data;
  }

  function uniqueOptions(values) {
    return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, 'ru'));
  }

  function filterMatches(matches) {
    const filters = state.results.filters;
    let result = matches.slice();

    if (filters.status === 'finished') {
      result = result.filter((match) => match.status === 'завершён');
    }
    if (filters.status === 'draft') {
      result = result.filter((match) => match.status === 'черновик' || match.status === 'идёт матч' || match.status === 'сохранён локально');
    }
    if (filters.tournament) {
      result = result.filter((match) => match.tournament === filters.tournament);
    }
    if (filters.opponent) {
      result = result.filter((match) => match.opponent === filters.opponent);
    }
    if (filters.venue) {
      result = result.filter((match) => (match.location || match.venue) === filters.venue);
    }
    if (filters.result) {
      result = result.filter((match) => {
        if (filters.result === 'none') return !match.result;
        return match.result === filters.result;
      });
    }
    if (filters.dateFrom) {
      result = result.filter((match) => match.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      result = result.filter((match) => match.date <= filters.dateTo);
    }
    if (filters.last) {
      result = result.slice(0, Number(filters.last));
    }

    return result;
  }

  function renderResults() {
    const content = $('#results-content');
    if (!content) return;

    try {
      if (state.results.view === 'match') {
        renderResultMatch(content);
        return;
      }
      if (state.results.view === 'player') {
        renderResultPlayer(content);
        return;
      }
      if (state.results.view === 'role') {
        renderResultRole(content);
        return;
      }
      if (state.results.view === 'compare') {
        renderResultComparison(content);
        return;
      }
      renderResultsHome(content);
    } catch (error) {
      content.innerHTML = `
        <div class="results-state error">
          <h2>Ошибка загрузки</h2>
          <p>Раздел результатов не смог обработать локальные данные. Данные статистики не удалены.</p>
        </div>
      `;
      console.error('Results render error', error);
    }
  }

  function renderResultsHome(content) {
    const data = getResultsData();
    const matches = data.filteredMatches;
    const firstId = matches[0]?.id || '';
    const secondId = matches[1]?.id || firstId;
    if (!state.results.compareIds.length && firstId) {
      state.results.compareIds = [firstId, secondId].filter(Boolean);
    }

    const noRealData = data.loadInfo.usedMock;
    content.innerHTML = `
      ${noRealData ? renderInfoBanner('Пока нет сохранённых матчей. Ниже показаны демонстрационные данные, чтобы можно было проверить аналитику.') : ''}
      ${data.loadInfo.damaged ? renderInfoBanner(`Есть повреждённые локальные записи: ${data.loadInfo.damaged}. Они пропущены.`) : ''}
      ${renderResultsFilters(data)}
      ${matches.length ? `
        ${renderSeasonSummary(data.season)}
        ${renderTeamStatsBlock(data.season.teamStats, 'Команда за период')}
        ${renderBestBlock(data.best)}
        ${renderComparisonSetup(data.matches)}
        <section class="results-section">
          <div class="results-section-head">
            <h2>Матчи</h2>
            <span>${matches.length}</span>
          </div>
          <div class="match-card-list">${matches.map(renderMatchCard).join('')}</div>
        </section>
      ` : `
        <div class="results-state">
          <h2>Нет матчей</h2>
          <p>Сохранённые матчи появятся после записи статистики.</p>
        </div>
      `}
    `;
  }

  function renderInfoBanner(text) {
    return `<div class="results-banner">${escapeHtml(text)}</div>`;
  }

  function renderResultsFilters(data) {
    const filters = state.results.filters;
    return `
      <section class="results-section">
        <div class="results-section-head">
          <h2>Фильтры</h2>
          <button class="text-button" type="button" data-results-action="reset-filters">Сбросить</button>
        </div>
        <div class="filters-grid">
          <label>Статус
            <select data-results-filter="status">
              ${option('all', 'Все матчи', filters.status)}
              ${option('finished', 'Завершённые', filters.status)}
              ${option('draft', 'Черновики', filters.status)}
            </select>
          </label>
          <label>Турнир
            <select data-results-filter="tournament">
              ${option('', 'Все турниры', filters.tournament)}
              ${data.tournaments.map((value) => option(value, value, filters.tournament)).join('')}
            </select>
          </label>
          <label>Соперник
            <select data-results-filter="opponent">
              ${option('', 'Все соперники', filters.opponent)}
              ${data.opponents.map((value) => option(value, value, filters.opponent)).join('')}
            </select>
          </label>
          <label>Место
            <select data-results-filter="venue">
              ${option('', 'Все места', filters.venue)}
              ${data.venues.map((value) => option(value, value, filters.venue)).join('')}
            </select>
          </label>
          <label>Результат
            <select data-results-filter="result">
              ${option('', 'Все результаты', filters.result)}
              ${option('победа', 'Победы', filters.result)}
              ${option('поражение', 'Поражения', filters.result)}
              ${option('none', 'Без результата', filters.result)}
            </select>
          </label>
          <label>С даты
            <input type="date" value="${escapeHtml(filters.dateFrom)}" data-results-filter="dateFrom">
          </label>
          <label>По дату
            <input type="date" value="${escapeHtml(filters.dateTo)}" data-results-filter="dateTo">
          </label>
          <label>Последние матчи
            <select data-results-filter="last">
              ${option('', 'Без ограничения', filters.last)}
              ${option('3', 'Последние 3', filters.last)}
              ${option('5', 'Последние 5', filters.last)}
              ${option('10', 'Последние 10', filters.last)}
            </select>
          </label>
          <button class="primary-action" type="button" data-results-action="export-team">Экспорт PDF</button>
        </div>
      </section>
    `;
  }

  function option(value, label, selected) {
    return `<option value="${escapeHtml(value)}"${String(value) === String(selected) ? ' selected' : ''}>${escapeHtml(label)}</option>`;
  }

  function renderSeasonSummary(season) {
    return `
      <section class="results-section">
        <div class="results-section-head">
          <h2>Сезон / период</h2>
          <span>${season.totalMatches} матчей</span>
        </div>
        <div class="metric-grid">
          ${metricCard('Матчей', season.totalMatches)}
          ${metricCard('Победы / поражения', `${season.wins} / ${season.losses}`)}
          ${metricCard('Партий', season.totalSets)}
          ${metricCard('Действий', season.totalActions)}
          ${metricCard('В среднем за матч', season.actionsPerMatch)}
          ${metricCard('Ошибки', season.teamStats.errors.total)}
        </div>
      </section>
    `;
  }

  function metricCard(label, value, extra = '') {
    return `<div class="metric-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>${extra ? `<small>${escapeHtml(extra)}</small>` : ''}</div>`;
  }

  function renderTeamStatsBlock(teamStats, title) {
    const actions = window.SetkaStatsCore.ACTIONS;
    return `
      <section class="results-section">
        <div class="results-section-head">
          <h2>${escapeHtml(title)}</h2>
          <span>${teamStats.totalActions} действий</span>
        </div>
        <div class="table-scroll">
          <table class="stats-table">
            <thead>
              <tr><th>Действие</th><th>Всего</th><th>Плюс</th><th>Минус</th><th>Средне</th></tr>
            </thead>
            <tbody>
              ${actions.map((action) => renderActionStatsRow(teamStats.byAction[action.type])).join('')}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  function renderActionStatsRow(stats) {
    if (!stats) return '';
    if (stats.type === 'error') {
      return `<tr><td>${stats.name}</td><td>${stats.total}</td><td colspan="3">Всего ошибок</td></tr>`;
    }
    return `
      <tr>
        <td>${stats.name}</td>
        <td>${stats.total}</td>
        <td>${stats.plus} · ${window.SetkaStatsCore.formatPercent(stats.plusPercent)}</td>
        <td>${stats.minus} · ${window.SetkaStatsCore.formatPercent(stats.minusPercent)}</td>
        <td>${stats.mode === 'triple' ? `${stats.neutral} · ${window.SetkaStatsCore.formatPercent(stats.neutralPercent)}` : '—'}</td>
      </tr>
    `;
  }

  function renderBestBlock(best) {
    if (!best.enoughData) {
      return `
        <section class="results-section">
          <div class="results-section-head"><h2>Лучшие показатели</h2></div>
          <div class="results-state compact">Недостаточно данных для честных выводов.</div>
        </section>
      `;
    }

    return `
      <section class="results-section">
        <div class="results-section-head"><h2>Лучшие показатели</h2></div>
        <div class="best-grid">
          ${bestItem('Лучший подающий', best.serve)}
          ${bestItem('Лучший принимающий', best.receive)}
          ${bestItem('Лучший атакующий', best.attack)}
          ${bestItem('Лучший блокирующий', best.block)}
          ${bestItem('Лучший в защите', best.defense)}
          ${bestItem('Самый активный', best.mostActive)}
          ${bestItem('Минимум ошибок', best.lowestErrors)}
          ${matchBestItem('Лучший матч команды', best.bestTeamMatch)}
          ${matchBestItem('Меньше всего ошибок', best.lowestErrorMatch)}
          ${setBestItem('Лучшая атака в партии', best.bestAttackSet)}
          ${setBestItem('Лучший приём в партии', best.bestReceiveSet)}
        </div>
      </section>
    `;
  }

  function bestItem(label, player) {
    return `<div class="best-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(player?.name || 'Недостаточно данных')}</strong><small>${player ? `${player.totalActions} действий` : ''}</small></div>`;
  }

  function matchBestItem(label, match) {
    return `<div class="best-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(match?.opponent || 'Недостаточно данных')}</strong><small>${match ? `${formatDate(match.date)} · ${match.finalScore || '—'}` : ''}</small></div>`;
  }

  function setBestItem(label, item) {
    return `<div class="best-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(item ? `${item.match.opponent}, партия ${item.set.setNumber}` : 'Недостаточно данных')}</strong><small>${item ? `${item.set.totalActions} действий` : ''}</small></div>`;
  }

  function renderComparisonSetup(matches) {
    const [first = '', second = ''] = state.results.compareIds;
    return `
      <section class="results-section">
        <div class="results-section-head">
          <h2>Сравнение матчей</h2>
          <button class="text-button" type="button" data-results-action="open-compare">Открыть</button>
        </div>
        ${matches.length < 2 ? '<div class="results-state compact">Недостаточно данных для сравнения.</div>' : `
          <div class="compare-controls">
            <select data-compare-index="0">
              ${matches.map((match) => option(match.id, `${formatDate(match.date)} · ${match.opponent}`, first || matches[0].id)).join('')}
            </select>
            <select data-compare-index="1">
              ${matches.map((match) => option(match.id, `${formatDate(match.date)} · ${match.opponent}`, second || matches[1]?.id || matches[0].id)).join('')}
            </select>
          </div>
          <p class="muted">Для сравнения последних матчей, турнира, соперника или места примените фильтры выше и откройте сравнение.</p>
        `}
      </section>
    `;
  }

  function renderMatchCard(match) {
    const teamStats = window.SetkaStatsCore.calculateTeamStats(match.events || []);
    const place = match.location || match.venue || 'Площадка не указана';
    return `
      <article class="match-card" data-match-id="${escapeHtml(match.id)}">
        <button class="match-card-main" type="button" data-results-action="open-match" data-match-id="${escapeHtml(match.id)}">
          <span class="match-date">${escapeHtml(formatDate(match.date))}</span>
          <strong>${escapeHtml(match.opponent)}</strong>
          <small>${escapeHtml(match.tournament)} · ${escapeHtml(place)}</small>
          <span class="match-score">${escapeHtml(match.finalScore || '—')}</span>
          <span class="match-sets">${escapeHtml((match.setScores || []).join(', ') || 'Партии не указаны')}</span>
        </button>
        <div class="match-card-meta">
          <span>${escapeHtml(match.status)}</span>
          ${match.result ? `<span class="${match.result === 'победа' ? 'success' : 'danger'}">${escapeHtml(match.result)}</span>` : ''}
          ${match.matchType ? `<span>${escapeHtml(match.matchType)}</span>` : ''}
          <span>${teamStats.totalActions} действий</span>
          ${match.isMock ? '<span>демо</span>' : ''}
        </div>
        <div class="action-pills">
          ${actionPill('Подачи', teamStats.byAction.serve.total)}
          ${actionPill('Приёмы', teamStats.byAction.receive.total)}
          ${actionPill('Атаки', teamStats.byAction.attack.total)}
          ${actionPill('Блоки', teamStats.byAction.block.total)}
          ${actionPill('Защита', teamStats.byAction.defense.total)}
          ${actionPill('Ошибки', teamStats.errors.total, 'danger')}
        </div>
      </article>
    `;
  }

  function actionPill(label, value, tone = '') {
    return `<span class="action-pill ${tone}"><b>${escapeHtml(value)}</b>${escapeHtml(label)}</span>`;
  }

  function getSelectedMatch() {
    const data = getResultsData();
    return data.matches.find((match) => match.id === state.results.selectedMatchId) || data.matches[0] || null;
  }

  function renderResultMatch(content) {
    const match = getSelectedMatch();
    if (!match) {
      content.innerHTML = '<div class="results-state"><h2>Матч не найден</h2></div>';
      return;
    }

    const teamStats = window.SetkaStatsCore.calculateTeamStats(match.events || []);
    const playerStats = window.SetkaStatsPlayers.calculatePlayerStats(match, TEAM_DATA.id);
    const roleStats = window.SetkaStatsRoles.calculateRoleStats(match, TEAM_DATA.id);
    const setStats = window.SetkaStatsSets.calculateSetStats(match, TEAM_DATA.id);
    const best = window.SetkaStatsBest.getBestPerformers([match], TEAM_DATA.id);
    const place = match.location || match.venue || 'Площадка не указана';

    content.innerHTML = `
      <section class="match-detail-hero">
        <button class="text-button" type="button" data-results-action="back-home">Все результаты</button>
        <div>
          <h2>${escapeHtml(match.ourTeam)} — ${escapeHtml(match.opponent)}</h2>
          <p>${escapeHtml(formatDate(match.date))} · ${escapeHtml(match.tournament)} · ${escapeHtml(place)}</p>
        </div>
        <div class="detail-score">${escapeHtml(match.finalScore || '—')}</div>
        <button class="primary-action" type="button" data-results-action="export-match" data-match-id="${escapeHtml(match.id)}">PDF матча</button>
      </section>

      <section class="results-section">
        <div class="metric-grid">
          ${metricCard('Статус', match.status)}
          ${metricCard('Результат', match.result || 'не указан')}
          ${metricCard('Тип', match.matchType || 'не указан')}
          ${metricCard('Формат', match.matchFormat || 'не указан')}
          ${metricCard('Партии', (match.setScores || []).join(', ') || '—')}
          ${metricCard('Действий', teamStats.totalActions)}
          ${metricCard('Ошибки', teamStats.errors.total)}
        </div>
      </section>
      ${match.coachComment ? `<section class="results-section"><div class="results-section-head"><h2>Комментарий тренера</h2></div><p class="muted">${escapeHtml(match.coachComment)}</p></section>` : ''}

      ${renderTeamStatsBlock(teamStats, 'Команда')}
      ${renderRosterBlock(match)}
      ${renderPlayersBlock(playerStats, match.id)}
      ${renderRolesBlock(roleStats, match.id)}
      ${renderSetsBlock(setStats)}
      ${renderBestBlock(best)}
      ${renderEventJournal(match)}
    `;
  }

  function renderRosterBlock(match) {
    const roster = match.roster || [];
    const starters = roster.filter((player) => player.status === 'старт');
    const subs = roster.filter((player) => player.status === 'выходил на замену');
    const bench = Array.isArray(match.bench) && match.bench.length
      ? match.bench
      : roster.filter((player) => player.status === 'запас');

    return `
      <details class="results-section" open>
        <summary>Состав</summary>
        <div class="roster-groups">
          ${rosterGroup('Стартовый состав', starters)}
          ${rosterGroup('Скамейка', bench)}
          ${rosterGroup('Выходили на замену', subs)}
          ${rosterGroup('В заявке', roster)}
        </div>
      </details>
    `;
  }

  function rosterGroup(title, players) {
    return `
      <div class="roster-group">
        <h3>${escapeHtml(title)}</h3>
        ${players.length ? `<div class="mini-list">${players.map((player) => `<span>№${escapeHtml(player.number)} ${escapeHtml(player.name)} · ${escapeHtml(player.role)}</span>`).join('')}</div>` : '<p class="muted">Нет данных</p>'}
      </div>
    `;
  }

  function renderPlayersBlock(players, matchId) {
    return `
      <details class="results-section" open>
        <summary>Игроки</summary>
        <div class="table-scroll">
          <table class="stats-table player-stats-table">
            <thead><tr><th>Игрок</th><th>Статус</th><th>Действий</th><th>Подача</th><th>Приём</th><th>Атака</th><th>Блок</th><th>Защита</th><th>Ошибки</th></tr></thead>
            <tbody>
              ${players.map((player) => `
                <tr>
                  <td><button class="table-link" type="button" data-results-action="open-player-result" data-match-id="${escapeHtml(matchId)}" data-player-id="${escapeHtml(player.playerId)}">№${escapeHtml(player.number)} ${escapeHtml(player.name)}<br><small>${escapeHtml(player.role)}</small></button></td>
                  <td>${escapeHtml(player.status)}</td>
                  <td>${player.totalActions}</td>
                  <td>${window.SetkaStatsCore.summarizeActionLine(player.byAction.serve)}</td>
                  <td>${window.SetkaStatsCore.summarizeActionLine(player.byAction.receive)}</td>
                  <td>${window.SetkaStatsCore.summarizeActionLine(player.byAction.attack)}</td>
                  <td>${window.SetkaStatsCore.summarizeActionLine(player.byAction.block)}</td>
                  <td>${window.SetkaStatsCore.summarizeActionLine(player.byAction.defense)}</td>
                  <td>${player.errors}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </details>
    `;
  }

  function renderRolesBlock(roles, matchId) {
    return `
      <details class="results-section" open>
        <summary>Амплуа</summary>
        <div class="role-card-grid">
          ${roles.map((role) => `
            <button class="role-card" type="button" data-results-action="open-role-result" data-match-id="${escapeHtml(matchId)}" data-role="${escapeHtml(role.role)}">
              <strong>${escapeHtml(role.role)}</strong>
              <span>${role.playerCount} игроков · ${role.totalActions} действий</span>
              <small>Вклад ${window.SetkaStatsCore.formatPercent(role.contributionPercent)}</small>
            </button>
          `).join('')}
        </div>
      </details>
    `;
  }

  function renderSetsBlock(setStats) {
    if (!setStats.hasSetData) {
      return `
        <details class="results-section" open>
          <summary>Партии</summary>
          <div class="results-state compact">Статистика по партиям появится после записи партий.</div>
        </details>
      `;
    }

    return `
      <details class="results-section" open>
        <summary>Партии</summary>
        <div class="set-card-list">
          ${setStats.sets.map((set) => `
            <div class="set-card">
              <strong>Партия ${escapeHtml(set.setNumber)} · ${escapeHtml(set.score)}</strong>
              <span>${set.totalActions} действий</span>
              <small>Лучшие: ${set.bestPlayers.map((player) => player.name).join(', ') || 'Недостаточно данных'}</small>
              <small>Проблемные действия: ${set.problemActions.map((action) => `${action.name} -${window.SetkaStatsCore.formatPercent(action.minusPercent)}`).join(', ') || 'нет'}</small>
            </div>
          `).join('')}
        </div>
      </details>
    `;
  }

  function renderEventJournal(match) {
    const filters = state.results.eventFilters;
    const players = window.SetkaStatsPlayers.calculatePlayerStats(match, TEAM_DATA.id).filter((player) => player.totalActions > 0);
    const roles = uniqueOptions((match.events || []).map((event) => event.playerRole));
    const sets = uniqueOptions((match.events || []).map((event) => event.setNumber ? String(event.setNumber) : ''));
    const events = filterEvents(match.events || []);

    return `
      <details class="results-section">
        <summary>Журнал действий</summary>
        <div class="journal-tools">
          <select data-event-filter="playerId">
            ${option('', 'Все игроки', filters.playerId)}
            ${players.map((player) => option(player.playerId, player.name, filters.playerId)).join('')}
          </select>
          <select data-event-filter="role">
            ${option('', 'Все амплуа', filters.role)}
            ${roles.map((role) => option(role, role, filters.role)).join('')}
          </select>
          <select data-event-filter="setNumber">
            ${option('', 'Все партии', filters.setNumber)}
            ${sets.map((set) => option(set, `Партия ${set}`, filters.setNumber)).join('')}
          </select>
          <select data-event-filter="actionType">
            ${option('', 'Все действия', filters.actionType)}
            ${window.SetkaStatsCore.ACTIONS.map((action) => option(action.type, action.name, filters.actionType)).join('')}
          </select>
          <select data-event-filter="result">
            ${option('', 'Все результаты', filters.result)}
            ${option('plus', '+', filters.result)}
            ${option('minus', '-', filters.result)}
            ${option('slash', '/', filters.result)}
            ${option('error', 'Ошибка', filters.result)}
          </select>
          <button class="secondary-button" type="button" data-results-action="delete-last-event" data-match-id="${escapeHtml(match.id)}">Удалить последнее</button>
        </div>
        ${events.length ? `
          <div class="table-scroll journal-scroll">
            <table class="stats-table">
              <thead><tr><th>Время</th><th>Партия</th><th>Игрок</th><th>Амплуа</th><th>Действие</th><th>Результат</th><th></th></tr></thead>
              <tbody>${events.map(renderEventRow).join('')}</tbody>
            </table>
          </div>
        ` : '<div class="results-state compact">Нет событий по выбранным фильтрам.</div>'}
      </details>
    `;
  }

  function filterEvents(events) {
    const filters = state.results.eventFilters;
    return events.filter((event) => {
      if (filters.playerId && event.playerId !== filters.playerId) return false;
      if (filters.role && event.playerRole !== filters.role) return false;
      if (filters.setNumber && String(event.setNumber || '') !== filters.setNumber) return false;
      if (filters.actionType && event.actionType !== filters.actionType) return false;
      if (filters.result && event.actionResult !== filters.result) return false;
      return true;
    }).slice().sort((a, b) => String(b.timestamp || b.time).localeCompare(String(a.timestamp || a.time)));
  }

  function renderEventRow(event) {
    const time = event.time ? new Date(event.time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '—';
    return `
      <tr>
        <td>${escapeHtml(time)}</td>
        <td>${escapeHtml(event.setNumber || '—')}</td>
        <td>${escapeHtml(event.playerName)}</td>
        <td>${escapeHtml(event.playerRole)}</td>
        <td>${escapeHtml(event.actionName || event.actionType)}</td>
        <td>${escapeHtml(event.resultLabel || event.actionResult)}</td>
        <td><button class="table-danger" type="button" data-results-action="delete-event" data-event-id="${escapeHtml(event.id)}">Удалить</button></td>
      </tr>
    `;
  }

  function renderResultPlayer(content) {
    const data = getResultsData();
    const match = data.matches.find((item) => item.id === state.results.selectedMatchId) || data.matches[0];
    const matchPlayers = window.SetkaStatsPlayers.calculatePlayerStats(match || {}, TEAM_DATA.id);
    const seasonPlayers = window.SetkaStatsPlayers.calculatePlayerStats(data.matches, TEAM_DATA.id);
    const player = matchPlayers.find((item) => item.playerId === state.results.selectedPlayerId)
      || seasonPlayers.find((item) => item.playerId === state.results.selectedPlayerId);
    if (!player) {
      content.innerHTML = '<div class="results-state"><h2>Игрок не найден</h2></div>';
      return;
    }

    const dynamics = window.SetkaStatsPlayers.calculatePlayerDynamics(player.playerId, data.matches, TEAM_DATA.id);
    const played = dynamics.filter((item) => item.totalActions > 0);
    const bestMatch = played.slice().sort((a, b) => b.totalActions - a.totalActions)[0];
    const worstMatch = played.slice().sort((a, b) => a.totalActions - b.totalActions)[0];

    content.innerHTML = `
      <section class="match-detail-hero">
        <button class="text-button" type="button" data-results-action="back-match">К матчу</button>
        <div><h2>${escapeHtml(player.name)}</h2><p>№${escapeHtml(player.number)} · ${escapeHtml(player.role)}</p></div>
        <button class="primary-action" type="button" data-results-action="export-player" data-player-id="${escapeHtml(player.playerId)}">PDF игрока</button>
      </section>
      <section class="results-section">
        <div class="metric-grid">
          ${metricCard('В выбранном матче', player.totalActions)}
          ${metricCard('Ошибки', player.errors)}
          ${metricCard('Лучший матч', bestMatch ? `${bestMatch.totalActions} действий` : 'Недостаточно данных', bestMatch?.opponent || '')}
          ${metricCard('Слабый матч', worstMatch ? `${worstMatch.totalActions} действий` : 'Недостаточно данных', worstMatch?.opponent || '')}
        </div>
      </section>
      ${renderTeamStatsBlock(window.SetkaStatsCore.calculateTeamStats((match?.events || []).filter((event) => event.playerId === player.playerId)), 'Статистика за матч')}
      ${renderTeamStatsBlock(window.SetkaStatsCore.calculateTeamStats(data.matches.flatMap((item) => item.events || []).filter((event) => event.playerId === player.playerId)), 'Статистика по всем матчам')}
      <section class="results-section">
        <div class="results-section-head"><h2>Динамика по матчам</h2></div>
        <div class="table-scroll">
          <table class="stats-table">
            <thead><tr><th>Дата</th><th>Соперник</th><th>Действий</th><th>Ошибки</th></tr></thead>
            <tbody>${dynamics.map((item) => `<tr><td>${escapeHtml(formatDate(item.date))}</td><td>${escapeHtml(item.opponent)}</td><td>${item.totalActions}</td><td>${item.teamStats.errors.total}</td></tr>`).join('')}</tbody>
          </table>
        </div>
      </section>
    `;
  }

  function renderResultRole(content) {
    const data = getResultsData();
    const match = data.matches.find((item) => item.id === state.results.selectedMatchId) || data.matches[0];
    const role = state.results.selectedRole;
    const roleMatches = data.matches.map((item) => ({
      ...item,
      events: (item.events || []).filter((event) => event.playerRole === role)
    }));
    const allRole = window.SetkaStatsRoles.calculateRoleStats(roleMatches, TEAM_DATA.id).find((item) => item.role === role);
    const matchRole = window.SetkaStatsRoles.calculateRoleStats(match || {}, TEAM_DATA.id).find((item) => item.role === role);

    content.innerHTML = `
      <section class="match-detail-hero">
        <button class="text-button" type="button" data-results-action="back-match">К матчу</button>
        <div><h2>${escapeHtml(role)}</h2><p>Аналитика по амплуа</p></div>
      </section>
      <section class="results-section">
        <div class="metric-grid">
          ${metricCard('Игроков в матче', matchRole?.playerCount || 0)}
          ${metricCard('Действий в матче', matchRole?.totalActions || 0)}
          ${metricCard('Вклад в матче', window.SetkaStatsCore.formatPercent(matchRole?.contributionPercent || 0))}
          ${metricCard('Действий за период', allRole?.totalActions || 0)}
        </div>
      </section>
      ${renderTeamStatsBlock(window.SetkaStatsCore.calculateTeamStats((match?.events || []).filter((event) => event.playerRole === role)), 'Амплуа в матче')}
      ${renderTeamStatsBlock(window.SetkaStatsCore.calculateTeamStats(data.matches.flatMap((item) => item.events || []).filter((event) => event.playerRole === role)), 'Амплуа за период')}
    `;
  }

  function renderResultComparison(content) {
    const data = getResultsData();
    const filterDriven = state.results.filters.last
      || state.results.filters.tournament
      || state.results.filters.opponent
      || state.results.filters.venue
      || state.results.filters.result
      || state.results.filters.status !== 'all'
      || state.results.filters.dateFrom
      || state.results.filters.dateTo;
    const selected = state.results.compareIds
      .map((id) => data.matches.find((match) => match.id === id))
      .filter(Boolean);
    const comparisonMatches = filterDriven && data.filteredMatches.length >= 2
      ? data.filteredMatches
      : selected.length >= 2
        ? selected
        : data.filteredMatches.slice(0, 2);
    const comparison = window.SetkaStatsCompare.compareMatches(comparisonMatches, TEAM_DATA.id);

    content.innerHTML = `
      <section class="match-detail-hero">
        <button class="text-button" type="button" data-results-action="back-home">Все результаты</button>
        <div><h2>Сравнение матчей</h2><p>${comparison.available ? `${comparison.rows.length} матча · ${filterDriven ? 'по текущим фильтрам' : 'выбранная пара'}` : comparison.reason}</p></div>
        <button class="primary-action" type="button" data-results-action="export-compare">PDF сравнения</button>
      </section>
      ${comparison.available ? `
        <section class="results-section">
          <div class="table-scroll">
            <table class="stats-table">
              <thead><tr><th>Матч</th><th>Действий</th><th>Подача +</th><th>Приём +</th><th>Атака +</th><th>Блок +</th><th>Защита +</th><th>Ошибки</th></tr></thead>
              <tbody>${comparison.rows.map((row) => `<tr><td>${escapeHtml(formatDate(row.date))}<br><small>${escapeHtml(row.opponent)}</small></td><td>${row.totalActions}</td><td>${window.SetkaStatsCore.formatPercent(row.serve.plusPercent)}</td><td>${window.SetkaStatsCore.formatPercent(row.receive.plusPercent)}</td><td>${window.SetkaStatsCore.formatPercent(row.attack.plusPercent)}</td><td>${window.SetkaStatsCore.formatPercent(row.block.plusPercent)}</td><td>${window.SetkaStatsCore.formatPercent(row.defense.plusPercent)}</td><td>${row.errors.total}</td></tr>`).join('')}</tbody>
            </table>
          </div>
        </section>
        <section class="results-section">
          <div class="results-section-head"><h2>Проблемные зоны</h2></div>
          <div class="best-grid">${comparison.problemZones.map((item) => `<div class="best-card problem"><span>${escapeHtml(item.action)}</span><strong>-${window.SetkaStatsCore.formatPercent(item.minusPercent)}</strong><small>${item.total} действий</small></div>`).join('')}</div>
        </section>
      ` : '<div class="results-state">Недостаточно данных для сравнения.</div>'}
    `;
  }

  function handleResultsChange(event) {
    const filter = event.target.dataset.resultsFilter;
    if (filter) {
      state.results.filters[filter] = event.target.value;
      state.results.cacheKey = '';
      renderResults();
      return;
    }

    const eventFilter = event.target.dataset.eventFilter;
    if (eventFilter) {
      state.results.eventFilters[eventFilter] = event.target.value;
      renderResults();
      return;
    }

    const compareIndex = event.target.dataset.compareIndex;
    if (compareIndex !== undefined) {
      state.results.compareIds[Number(compareIndex)] = event.target.value;
      renderResults();
    }
  }

  function handleResultsClick(event) {
    const button = event.target.closest('[data-results-action]');
    if (!button) return;
    const action = button.dataset.resultsAction;

    if (action === 'reset-filters') {
      state.results.filters = { status: 'all', tournament: '', opponent: '', venue: '', result: '', dateFrom: '', dateTo: '', last: '' };
      state.results.cacheKey = '';
      renderResults();
      return;
    }

    if (action === 'back-home') {
      state.results.view = 'home';
      state.results.selectedMatchId = '';
      renderResults();
      return;
    }

    if (action === 'back-match') {
      state.results.view = 'match';
      renderResults();
      return;
    }

    if (action === 'open-match') {
      state.results.view = 'match';
      state.results.selectedMatchId = button.dataset.matchId;
      state.results.eventFilters = { playerId: '', role: '', setNumber: '', actionType: '', result: '' };
      renderResults();
      return;
    }

    if (action === 'open-player-result') {
      state.results.view = 'player';
      state.results.selectedMatchId = button.dataset.matchId;
      state.results.selectedPlayerId = button.dataset.playerId;
      renderResults();
      return;
    }

    if (action === 'open-role-result') {
      state.results.view = 'role';
      state.results.selectedMatchId = button.dataset.matchId;
      state.results.selectedRole = button.dataset.role;
      renderResults();
      return;
    }

    if (action === 'open-compare') {
      state.results.view = 'compare';
      renderResults();
      return;
    }

    if (action === 'delete-event') {
      deleteResultsEvent(button.dataset.eventId);
      return;
    }

    if (action === 'delete-last-event') {
      deleteLastResultsEvent(button.dataset.matchId);
      return;
    }

    if (action === 'export-team') {
      const data = getResultsData();
      const ok = window.SetkaPdfExport.exportTeamPdf(data.filteredMatches, 'Выбранный период');
      if (!ok) alert('Окно печати заблокировано. Подготовлен HTML-файл, его можно открыть и сохранить в PDF.');
      return;
    }

    if (action === 'export-match') {
      const match = getSelectedMatch();
      const ok = window.SetkaPdfExport.exportMatchPdf(match);
      if (!ok) alert('Окно печати заблокировано. Подготовлен HTML-файл, его можно открыть и сохранить в PDF.');
      return;
    }

    if (action === 'export-player') {
      const data = getResultsData();
      const player = window.SetkaStatsPlayers.calculatePlayerStats(data.matches, TEAM_DATA.id)
        .find((item) => item.playerId === button.dataset.playerId);
      const ok = window.SetkaPdfExport.exportPlayerPdf(player, data.matches);
      if (!ok) alert('Окно печати заблокировано. Подготовлен HTML-файл, его можно открыть и сохранить в PDF.');
      return;
    }

    if (action === 'export-compare') {
      const data = getResultsData();
      const selected = state.results.compareIds
        .map((id) => data.matches.find((match) => match.id === id))
        .filter(Boolean);
      const comparison = window.SetkaStatsCompare.compareMatches(selected.length >= 2 ? selected : data.filteredMatches.slice(0, 2), TEAM_DATA.id);
      const ok = window.SetkaPdfExport.exportComparePdf(comparison);
      if (!ok) alert('Окно печати заблокировано. Подготовлен HTML-файл, его можно открыть и сохранить в PDF.');
    }
  }

  function deleteResultsEvent(eventId) {
    if (!eventId || !confirm('Удалить выбранное действие? Статистика будет пересчитана.')) return;
    if (window.SetkaStorageEvents?.deleteEvent(eventId)) {
      state.results.cacheKey = '';
      saveCurrentMatch();
      renderResults();
    }
  }

  function deleteLastResultsEvent(matchId) {
    if (!confirm('Удалить последнее действие в этом матче?')) return;
    const removed = window.SetkaStorageEvents?.deleteLast(matchId);
    if (removed) {
      state.results.cacheKey = '';
      saveCurrentMatch();
      renderResults();
    }
  }

  async function requestWakeLock() {
    if (!('wakeLock' in navigator) || state.wakeLock) return;

    try {
      state.wakeLock = await navigator.wakeLock.request('screen');
      state.wakeLock.addEventListener('release', () => {
        state.wakeLock = null;
      });
    } catch (error) {
      state.wakeLock = null;
    }
  }

  async function releaseWakeLock() {
    if (!state.wakeLock) return;

    try {
      await state.wakeLock.release();
    } catch (error) {
      // Wake Lock API может быть недоступен или уже освобождён.
    } finally {
      state.wakeLock = null;
    }
  }

  boot();
});
