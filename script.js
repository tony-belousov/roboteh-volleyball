document.addEventListener('DOMContentLoaded', () => {
  const APP_VERSION = '2026.05.22.1';
  const APP_NAME = 'Сетка';

  const STORAGE_KEYS = {
    activeAccount: 'setka.activeAccount',
    settings: 'setka.settings',
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

  const TEAM_DATA = {
    id: 'setka-demo-team',
    name: 'ВК «Сетка»',
    subtitle: 'Коммерческая команда · сезон 2026',
    logoText: 'С',
    contacts: [
      { label: 'Телефон', value: '+7 900 000-00-00' },
      { label: 'Почта', value: 'team@setka.example' }
    ],
    socials: [
      { label: 'Сообщество', value: 'vk.com/setka-team' },
      { label: 'Канал команды', value: 't.me/setka_team' }
    ],
    coaches: [
      { id: 'coach-1', name: 'Андрей Волков', role: 'Главный тренер' },
      { id: 'coach-2', name: 'Мария Соколова', role: 'Тренер по физической подготовке' }
    ],
    players: [
      {
        id: 'p10',
        number: 10,
        firstName: 'Никита',
        lastName: 'Иванов',
        role: 'диагональный',
        roleKey: 'diagonal',
        height: 196,
        birthDate: '1998-04-12',
        photo: ''
      },
      {
        id: 'p7',
        number: 7,
        firstName: 'Артём',
        lastName: 'Кузнецов',
        role: 'доигровщик',
        roleKey: 'outside',
        height: 190,
        birthDate: '1999-09-03',
        photo: ''
      },
      {
        id: 'p11',
        number: 11,
        firstName: 'Илья',
        lastName: 'Морозов',
        role: 'доигровщик',
        roleKey: 'outside',
        height: 188,
        birthDate: '2001-01-27',
        photo: ''
      },
      {
        id: 'p4',
        number: 4,
        firstName: 'Дмитрий',
        lastName: 'Соколов',
        role: 'центральный',
        roleKey: 'middle',
        height: 202,
        birthDate: '1997-11-18',
        photo: ''
      },
      {
        id: 'p5',
        number: 5,
        firstName: 'Павел',
        lastName: 'Орлов',
        role: 'центральный',
        roleKey: 'middle',
        height: 201,
        birthDate: '2000-06-09',
        photo: ''
      },
      {
        id: 'p1',
        number: 1,
        firstName: 'Максим',
        lastName: 'Лебедев',
        role: 'связующий',
        roleKey: 'setter',
        height: 185,
        birthDate: '1996-02-21',
        photo: ''
      },
      {
        id: 'p8',
        number: 8,
        firstName: 'Кирилл',
        lastName: 'Егоров',
        role: 'либеро',
        roleKey: 'libero',
        height: 178,
        birthDate: '2002-08-15',
        photo: ''
      },
      {
        id: 'p14',
        number: 14,
        firstName: 'Роман',
        lastName: 'Белов',
        role: 'диагональный',
        roleKey: 'diagonal',
        height: 194,
        birthDate: '2000-12-05',
        photo: ''
      },
      {
        id: 'p16',
        number: 16,
        firstName: 'Сергей',
        lastName: 'Фёдоров',
        role: 'доигровщик',
        roleKey: 'outside',
        height: 192,
        birthDate: '1995-07-19',
        photo: ''
      },
      {
        id: 'p3',
        number: 3,
        firstName: 'Антон',
        lastName: 'Громов',
        role: 'центральный',
        roleKey: 'middle',
        height: 199,
        birthDate: '1998-10-30',
        photo: ''
      },
      {
        id: 'p12',
        number: 12,
        firstName: 'Егор',
        lastName: 'Ковалёв',
        role: 'связующий',
        roleKey: 'setter',
        height: 184,
        birthDate: '2003-03-14',
        photo: ''
      },
      {
        id: 'p2',
        number: 2,
        firstName: 'Денис',
        lastName: 'Титов',
        role: 'либеро',
        roleKey: 'libero',
        height: 176,
        birthDate: '2001-05-22',
        photo: ''
      }
    ],
    starterSlots: [
      { slotId: 'slot-diagonal', label: 'диагональный', tone: 'diagonal', playerId: 'p10' },
      { slotId: 'slot-outside-1', label: 'доигровщик', tone: 'outside', playerId: 'p7' },
      { slotId: 'slot-outside-2', label: 'доигровщик', tone: 'outside', playerId: 'p11' },
      { slotId: 'slot-middle-1', label: 'центральный / 4', tone: 'middle', playerId: 'p4' },
      { slotId: 'slot-middle-2', label: 'центральный / 5', tone: 'middle', playerId: 'p5' },
      { slotId: 'slot-setter', label: 'связующий', tone: 'setter', playerId: 'p1' },
      { slotId: 'slot-libero', label: 'либеро', tone: 'libero', playerId: 'p8' }
    ]
  };

  const state = {
    screen: 'welcome',
    previousScreen: 'menu',
    currentPlayerId: '',
    currentSet: 1,
    statsLineup: [],
    currentMatch: null,
    substitutionSlotIndex: -1,
    lastTapKey: '',
    lastTapAt: 0,
    autosaveTimer: null,
    wakeLock: null
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
    return `${player.lastName} ${player.firstName}`;
  }

  function getShortName(player) {
    return `${player.lastName} ${player.firstName.slice(0, 1)}.`;
  }

  function getPlayer(playerId) {
    return TEAM_DATA.players.find((player) => player.id === playerId) || null;
  }

  function getActiveAccount() {
    return storage.load(STORAGE_KEYS.activeAccount, null);
  }

  function getAccountText() {
    const account = getActiveAccount();
    if (!account) return 'Аккаунт не выбран';
    return account.name || account.title || 'Активный аккаунт';
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
    $('#menu-account').textContent = accountText;
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
      ensureStatsMatch();
      renderStatsPanel();
      requestWakeLock();
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

        showPlaceholder(route);
      });
    });

    $('#player-back')?.addEventListener('click', () => showScreen('team'));

    $('#pin-submit')?.addEventListener('click', submitPin);
    $('#pin-input')?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') submitPin();
    });

    $('#substitution-close')?.addEventListener('click', closeSubstitution);
    $('#substitution-modal')?.addEventListener('click', (event) => {
      if (event.target.id === 'substitution-modal') closeSubstitution();
    });

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
    $('#team-subtitle').textContent = TEAM_DATA.subtitle;

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
          <small>${escapeHtml(player.role)} · ${player.height} см</small>
        </span>
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
  }

  function renderAvatar(player, size) {
    if (player.photo) {
      return `<img class="avatar ${size}" src="${escapeHtml(player.photo)}" alt="" />`;
    }

    return `<span class="avatar ${size}" aria-hidden="true">${player.number}</span>`;
  }

  function openPlayer(playerId) {
    state.currentPlayerId = playerId;
    renderPlayerCard(playerId);
    showScreen('player');
  }

  function renderPlayerCard(playerId) {
    const player = getPlayer(playerId);
    const card = $('#player-card');
    if (!player || !card) return;

    const statsCards = ACTION_GROUPS.filter((group) => group.type !== 'error')
      .map((group) => `
        <div class="season-stat">
          <strong>${escapeHtml(group.name)}</strong>
          <span>данные появятся после матчей</span>
        </div>
      `)
      .join('');

    card.innerHTML = `
      <div class="player-photo">${renderAvatar(player, 'large')}</div>
      <div class="player-card-title">
        <h2>${escapeHtml(getFullName(player))}</h2>
        <p>№${player.number} · ${escapeHtml(player.role)}</p>
      </div>
      <dl class="player-facts">
        <div><dt>Рост</dt><dd>${player.height} см</dd></div>
        <div><dt>Дата рождения</dt><dd>${escapeHtml(formatDate(player.birthDate))}</dd></div>
        <div><dt>Амплуа</dt><dd>${escapeHtml(player.role)}</dd></div>
      </dl>
      <section class="season-stats" aria-label="Статистика за сезон">
        <h2>Статистика за сезон</h2>
        <div class="season-grid">${statsCards}</div>
      </section>
    `;
  }

  function hydrateLineup() {
    const savedMatch = storage.load(STORAGE_KEYS.currentMatch, null);
    const savedLineup = Array.isArray(savedMatch?.lineup) ? savedMatch.lineup : null;

    state.statsLineup = TEAM_DATA.starterSlots.map((slot, index) => {
      const savedSlot = savedLineup?.[index];
      return {
        ...slot,
        playerId: savedSlot?.playerId || slot.playerId
      };
    });

    if (savedMatch) {
      state.currentMatch = {
        ...savedMatch,
        lineup: state.statsLineup
      };
    }
  }

  function ensureStatsMatch() {
    if (state.currentMatch) return;

    state.currentMatch = {
      id: createId('match'),
      teamId: TEAM_DATA.id,
      title: `${TEAM_DATA.name} · рабочая запись`,
      setNumber: state.currentSet,
      score: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lineup: state.statsLineup
    };

    saveCurrentMatch();
  }

  function saveCurrentMatch() {
    if (!state.currentMatch) return;
    state.currentMatch.updatedAt = new Date().toISOString();
    state.currentMatch.lineup = state.statsLineup;
    state.currentMatch.setNumber = state.currentSet;
    storage.save(STORAGE_KEYS.currentMatch, state.currentMatch);
  }

  function renderStatsPanel() {
    $('#stats-match-name').textContent = state.currentMatch?.title || TEAM_DATA.name;
    $('#stats-set-score').textContent = `Партия ${state.currentSet}`;

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
    ensureStatsMatch();

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
      matchId: state.currentMatch.id,
      playerId: player.id,
      playerName: getFullName(player),
      actionType: group.type,
      actionName: group.name,
      actionResult: result.code,
      resultLabel: result.label,
      time: new Date().toISOString(),
      setNumber: state.currentSet
    };

    storage.append(STORAGE_KEYS.statsEvents, event);
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
    return TEAM_DATA.players.filter((player) => !activeIds.has(player.id));
  }

  function applySubstitution(slotIndex, incomingPlayerId) {
    ensureStatsMatch();

    const slot = state.statsLineup[slotIndex];
    const outgoingPlayerId = slot.playerId;
    slot.playerId = incomingPlayerId;

    storage.append(STORAGE_KEYS.substitutions, {
      id: createId('substitution'),
      matchId: state.currentMatch.id,
      slotId: slot.slotId,
      outPlayerId: outgoingPlayerId,
      inPlayerId: incomingPlayerId,
      time: new Date().toISOString(),
      setNumber: state.currentSet
    });

    saveCurrentMatch();
    updateAutosave();
    closeSubstitution();
    renderStatsPanel();
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
