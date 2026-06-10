document.addEventListener('DOMContentLoaded', () => {
  const APP_VERSION = '2026.06.10.6';
  const APP_NAME = 'Сетка';

  const STORAGE_KEYS = {
    activeAccount: 'setka.activeAccount',
    activeTeamId: 'setka.activeTeamId',
    settings: 'setka.settings',
    matches: 'setka.matches',
    currentMatch: 'setka.currentMatch',
    statsEvents: 'setka.statsEvents',
    substitutions: 'setka.substitutions',
    statsTutorialSeen: 'setka.statsTutorialSeen'
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
  const ACTION_GROUP_BY_TYPE = Object.fromEntries(ACTION_GROUPS.map((group) => [group.type, group]));

  const STATS_TUTORIAL_STEPS = [
    {
      selector: '#stats-set-tabs',
      title: 'Выберите партию',
      text: 'Здесь выбирается текущая партия. Все новые действия будут записаны именно в неё.'
    },
    {
      selector: '#stats-score-panel .score-box',
      title: 'Следите за счётом',
      text: 'Счёт выбранной партии всегда виден рядом с рабочими кнопками.'
    },
    {
      selector: '#stats-score-panel .score-controls',
      title: 'Добавляйте очки',
      text: 'Крупные кнопки быстро меняют счёт вашей команды и соперника.'
    },
    {
      selector: '.stats-row:not(.stats-header-row)',
      title: 'Записывайте действия игрока',
      text: 'В карточке игрока выбирайте подачу, приём, атаку, блок, защиту или ошибку.'
    },
    {
      selector: '#undo-last-event-button',
      title: 'Отменяйте последнее действие',
      text: 'Если ошиблись во время матча, можно быстро отменить последнее записанное действие.'
    },
    {
      selector: '#stats-live-journal summary',
      title: 'Открывайте журнал',
      text: 'В журнале можно посмотреть, изменить или удалить записанные события.'
    },
    {
      selector: '',
      title: 'Готово',
      text: 'Можно начинать запись статистики матча.'
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
    statsTutorialStep: 0,
    statsJournalOpen: false,
    editingStatsEventId: '',
    pdfPreviewUrl: '',
    pdfReturnScreen: 'results',
    statsJournalFilters: {
      setNumber: '',
      playerId: '',
      actionType: ''
    },
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

  let statsJournalScrollFrame = 0;

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

  function showToast(message, tone = 'success', duration = 2800) {
    $$('.app-toast').forEach((item) => item.remove());
    const toast = document.createElement('div');
    toast.className = `app-toast ${['success', 'error', 'warning', 'info'].includes(tone) ? tone : 'info'}`;
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    document.body.appendChild(toast);
    window.setTimeout(() => toast.classList.add('visible'), 20);
    window.setTimeout(() => {
      toast.classList.remove('visible');
      window.setTimeout(() => toast.remove(), 220);
    }, duration);
  }

  function confirmModal({
    title,
    message,
    confirmText = 'Подтвердить',
    cancelText = 'Отмена',
    danger = false
  }) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'modal confirm-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.innerHTML = `
        <div class="modal-panel confirm-panel">
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(message)}</p>
          <div class="modal-actions">
            <button class="secondary-button" type="button" data-confirm-cancel>${escapeHtml(cancelText)}</button>
            <button class="${danger ? 'danger-action' : 'primary-action'}" type="button" data-confirm-ok>${escapeHtml(confirmText)}</button>
          </div>
        </div>
      `;

      const close = (value) => {
        document.removeEventListener('keydown', onKeydown);
        modal.remove();
        resolve(value);
      };
      const onKeydown = (event) => {
        if (event.key === 'Escape') close(false);
      };

      modal.addEventListener('click', (event) => {
        if (event.target === modal || event.target.closest('[data-confirm-cancel]')) close(false);
        if (event.target.closest('[data-confirm-ok]')) close(true);
      });
      document.addEventListener('keydown', onKeydown);
      document.body.appendChild(modal);
      modal.querySelector('[data-confirm-cancel]')?.focus();
    });
  }

  function renderEmptyState({ title, text, action = '', actionText = '', compact = false }) {
    return `
      <div class="results-state empty-state ${compact ? 'compact' : ''}">
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(text)}</p>
        ${action && actionText ? `<button class="primary-action state-action" type="button" data-results-action="${escapeHtml(action)}">${escapeHtml(actionText)}</button>` : ''}
      </div>
    `;
  }

  function renderErrorState({ title, text, action = '', actionText = 'Повторить' }) {
    return `
      <div class="results-state error">
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(text)}</p>
        ${action ? `<button class="secondary-button state-action" type="button" data-results-action="${escapeHtml(action)}">${escapeHtml(actionText)}</button>` : ''}
      </div>
    `;
  }

  function renderLoadingState(text = 'Загрузка данных') {
    return `
      <div class="results-loading" role="status">
        <span class="loader-dot" aria-hidden="true"></span>
        <strong>${escapeHtml(text)}</strong>
        <div class="loading-skeleton"></div>
        <div class="loading-skeleton short"></div>
      </div>
    `;
  }

  function notifyPdfResult(ok) {
    showToast(ok ? 'PDF сформирован' : 'Не удалось сформировать PDF', ok ? 'success' : 'error');
  }

  function executePdfExport(exporter) {
    showToast('Формирование PDF', 'info');
    try {
      notifyPdfResult(exporter());
    } catch (error) {
      console.error('PDF export error', error);
      showToast('PDF недоступен', 'error');
    }
  }

  function makeReportFileName(title = 'Сетка отчёт') {
    const base = String(title)
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
    return `${base || 'setka-report'}.html`;
  }

  function openPdfPreview(report = {}) {
    const html = String(report.html || '');
    if (!html) return false;

    if (state.pdfPreviewUrl) {
      URL.revokeObjectURL(state.pdfPreviewUrl);
      state.pdfPreviewUrl = '';
    }

    state.pdfReturnScreen = state.screen && state.screen !== 'pdf-preview'
      ? state.screen
      : state.pdfReturnScreen || 'results';

    const title = report.title || 'PDF-отчёт';
    const fileName = report.filename || makeReportFileName(title);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    state.pdfPreviewUrl = url;

    $('#pdf-preview-title').textContent = 'PDF-отчёт';
    $('#pdf-preview-subtitle').textContent = title;
    const download = $('#pdf-preview-download');
    if (download) {
      download.href = url;
      download.download = fileName;
    }
    const frame = $('#pdf-preview-frame');
    if (frame) frame.src = url;

    showScreen('pdf-preview');
    return true;
  }

  function closePdfPreview() {
    const frame = $('#pdf-preview-frame');
    if (frame) frame.removeAttribute('src');
    if (state.pdfPreviewUrl) {
      URL.revokeObjectURL(state.pdfPreviewUrl);
      state.pdfPreviewUrl = '';
    }
    showScreen(state.pdfReturnScreen || 'results');
  }

  window.SetkaPdfPreview = { openReport: openPdfPreview };
  window.SetkaShowToast = showToast;
  window.SetkaConfirmModal = confirmModal;

  function getFullName(player) {
    if (player.fullName) return player.fullName;
    return `${player.lastName} ${player.firstName}`;
  }

  function getPlayerDisplayName(player) {
    if (window.SetkaPlayerNames) return window.SetkaPlayerNames.getPlayerDisplayName(player);
    const lastName = player?.lastName || '';
    const firstName = player?.firstName || '';
    if (lastName && firstName) return `${lastName} ${firstName}`;
    const parts = String(player?.fullName || player?.name || '').trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).join(' ') || getFullName(player);
  }

  function getPlayerPhoto(player) {
    if (!player) return '';
    if (window.SetkaPlayerNames?.getPlayerPhoto) {
      return window.SetkaPlayerNames.getPlayerPhoto(player);
    }
    if (player.photo) return player.photo;
    if (player.teamId === 'robotech') return 'assets/placeholders/robotech-default.png';
    if (player.teamId === 'robotech_2') return 'assets/placeholders/robotech2-default.png';
    return '';
  }

  function getShortName(player) {
    const lastName = player.lastName || String(player.fullName || '').split(/\s+/)[0] || '';
    const firstName = player.firstName || String(player.fullName || '').split(/\s+/)[1] || '';
    if (!lastName) return getPlayerDisplayName(player);
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
      name: getPlayerDisplayName(player),
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

  function getCompactTeamLabel(team = TEAM_DATA) {
    if (team.id === 'robotech_2') return '2.0';
    return team.name || 'Профиль';
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

    const label = getCompactTeamLabel();
    button.innerHTML = `
      <span class="profile-name">${escapeHtml(label)}</span>
      <span class="profile-chevron" aria-hidden="true">▾</span>
    `;
    button.setAttribute('aria-label', `Выбор профиля: ${TEAM_DATA.name}`);
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
      closeStatsJournalMode();
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
    $('#team-start-match')?.addEventListener('click', () => showScreen('stats'));

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
    $('#undo-last-event-button')?.addEventListener('click', undoLastStatEvent);
    $('#stats-journal-top-button')?.addEventListener('click', openStatsJournalMode);
    $('#stats-set-tabs')?.addEventListener('click', handleStatsSetTabsClick);
    $('#stats-score-panel')?.addEventListener('click', handleStatsScoreClick);
    $('#stats-live-journal')?.addEventListener('change', handleStatsJournalChange);
    $('#stats-live-journal')?.addEventListener('click', handleStatsJournalClick);
    $('#stats-live-journal')?.addEventListener('toggle', handleStatsJournalToggle);
    window.addEventListener('resize', scheduleStatsJournalScrollUpdate);
    window.addEventListener('orientationchange', () => {
      window.setTimeout(scheduleStatsJournalScrollUpdate, 180);
    });
    window.visualViewport?.addEventListener('resize', scheduleStatsJournalScrollUpdate);
    $('#finish-match-save')?.addEventListener('click', saveFinishedMatch);
    $('#finish-match-cancel')?.addEventListener('click', closeFinishMatchModal);
    $('#finish-match-modal')?.addEventListener('click', handleFinishModalClick);
    $('#pdf-preview-back')?.addEventListener('click', closePdfPreview);

    $('#results-content')?.addEventListener('click', handleResultsClick);
    $('#results-content')?.addEventListener('change', handleResultsChange);
    $('#player-card')?.addEventListener('change', handlePlayerCardFilterChange);
    $('#placeholder-screen')?.addEventListener('click', handlePlaceholderClick);
    document.addEventListener('click', handleStatsTutorialClick);

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
    const actions = $('#placeholder-actions');
    if (actions) {
      actions.innerHTML = route === 'help'
        ? '<button class="primary-action" type="button" data-placeholder-action="start-stats-tutorial">Повторить обучение записи</button>'
        : '';
    }
    showScreen('placeholder');
  }

  function handlePlaceholderClick(event) {
    const button = event.target.closest('[data-placeholder-action]');
    if (!button) return;
    if (button.dataset.placeholderAction === 'start-stats-tutorial') {
      storage.remove(STORAGE_KEYS.statsTutorialSeen);
      showScreen('stats');
      window.setTimeout(() => {
        if (state.currentMatch) {
          startStatsTutorial(true);
        } else {
          showToast('Создайте матч, затем запустите обучение', 'info');
        }
      }, 120);
    }
  }

  function maybeStartStatsTutorial() {
    if (!state.currentMatch || state.screen !== 'stats') return;
    if (storage.load(STORAGE_KEYS.statsTutorialSeen, false)) return;
    startStatsTutorial(false);
  }

  function startStatsTutorial(force = false) {
    if (!state.currentMatch) return;
    if (!force && storage.load(STORAGE_KEYS.statsTutorialSeen, false)) return;
    state.statsTutorialStep = 0;
    renderStatsTutorialStep();
  }

  function clearStatsTutorialHighlight() {
    $$('.tutorial-highlight').forEach((node) => node.classList.remove('tutorial-highlight'));
  }

  function closeStatsTutorial(saveSeen = true) {
    clearStatsTutorialHighlight();
    $('#stats-tutorial-overlay')?.remove();
    if (saveSeen) storage.save(STORAGE_KEYS.statsTutorialSeen, true);
  }

  function renderStatsTutorialStep() {
    if (state.statsTutorialStep >= STATS_TUTORIAL_STEPS.length) {
      closeStatsTutorial(true);
      return;
    }

    clearStatsTutorialHighlight();
    const step = STATS_TUTORIAL_STEPS[state.statsTutorialStep];
    const target = step.selector ? $(step.selector) : null;
    if (target) {
      target.classList.add('tutorial-highlight');
      target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
    }

    let overlay = $('#stats-tutorial-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'stats-tutorial-overlay';
      overlay.className = 'stats-tutorial-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      document.body.appendChild(overlay);
    }

    const isLast = state.statsTutorialStep === STATS_TUTORIAL_STEPS.length - 1;
    overlay.innerHTML = `
      <div class="stats-tutorial-card">
        <span>Шаг ${state.statsTutorialStep + 1} из ${STATS_TUTORIAL_STEPS.length}</span>
        <h2>${escapeHtml(step.title)}</h2>
        <p>${escapeHtml(step.text)}</p>
        <div class="stats-tutorial-actions">
          <button class="secondary-button" type="button" data-tutorial-action="skip">Пропустить обучение</button>
          <button class="primary-action" type="button" data-tutorial-action="next">${isLast ? 'Готово' : 'Далее'}</button>
        </div>
      </div>
    `;
  }

  function handleStatsTutorialClick(event) {
    const button = event.target.closest('[data-tutorial-action]');
    if (!button) return;
    if (button.dataset.tutorialAction === 'skip') {
      closeStatsTutorial(true);
      return;
    }
    if (button.dataset.tutorialAction === 'next') {
      state.statsTutorialStep += 1;
      renderStatsTutorialStep();
    }
  }

  function teamLogoMarkup(team = TEAM_DATA, sizeClass = '') {
    const className = ['team-logo-image', sizeClass].filter(Boolean).join(' ');
    if (team.logo) {
      return `<img class="${escapeHtml(className)}" src="${escapeHtml(team.logo)}" alt="" loading="lazy">`;
    }
    return `<span>${escapeHtml(team.logoText || team.name.slice(0, 1))}</span>`;
  }

  function renderTeamLogoInto(element, team = TEAM_DATA) {
    if (!element) return;
    element.innerHTML = teamLogoMarkup(team);
  }

  function getTeamMetrics(matches) {
    const season = window.SetkaStatsSeason
      ? window.SetkaStatsSeason.calculateSeasonStats(matches, TEAM_DATA.id)
      : null;
    const best = window.SetkaStatsBest
      ? window.SetkaStatsBest.getBestPerformers(matches, TEAM_DATA.id)
      : null;
    const loadInfo = window.SetkaStorageMatches?.getLoadInfo?.() || {};

    return {
      season,
      best,
      hasSavedMatches: !loadInfo.usedMock,
      matchCount: matches.length,
      sourceLabel: loadInfo.usedMock ? 'демо-данные' : 'сохранённые матчи'
    };
  }

  function renderTeamQuickMetrics(metrics) {
    const target = $('#team-quick-metrics');
    if (!target) return;

    const season = metrics.season;
    const bestName = metrics.best?.mostActive?.totalActions > 0
      ? getPlayerDisplayName(metrics.best.mostActive)
      : 'Недостаточно данных';

    target.innerHTML = `
      ${metricCard('Игроков', TEAM_DATA.players.length, TEAM_DATA.name)}
      ${metricCard('Матчей', metrics.matchCount, metrics.sourceLabel)}
      ${metricCard('Победы / поражения', season ? `${season.wins} / ${season.losses}` : '0 / 0')}
      ${metricCard('Действий', season?.totalActions || 0)}
      ${metricCard('Ошибки', season?.teamStats?.errors?.total || 0)}
      ${metricCard('Активный игрок', bestName)}
    `;
  }

  function renderTeam() {
    const matches = getActiveTeamMatches();
    const metrics = getTeamMetrics(matches);

    renderTeamLogoInto($('#team-logo'), TEAM_DATA);
    $('#team-profile-badge').textContent = `Профиль: ${TEAM_DATA.name}`;
    $('#team-name').textContent = TEAM_DATA.name;
    $('#team-subtitle').textContent = TEAM_DATA.description || TEAM_DATA.subtitle;
    $('#team-hero-stats').innerHTML = `
      <span>${TEAM_DATA.players.length} игроков</span>
      <span>${metrics.matchCount} матчей</span>
      <span>${metrics.season?.totalActions || 0} действий</span>
    `;
    renderTeamQuickMetrics(metrics);

    const coachesList = $('#coaches-list');
    coachesList.innerHTML = '';
    const coaches = Array.isArray(TEAM_DATA.coaches) ? TEAM_DATA.coaches : [];
    if (!coaches.length) {
      coachesList.innerHTML = renderEmptyState({
        title: 'Тренеры не указаны',
        text: 'Тренерский состав можно будет заполнить позже.',
        compact: true
      });
    }
    coaches.forEach((coach) => {
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
    const playerStats = window.SetkaStatsPlayers
      ? window.SetkaStatsPlayers.calculatePlayerStats(matches, TEAM_DATA.id)
      : [];
    const playerStatsById = new Map(playerStats.map((item) => [item.playerId, item]));
    if (!TEAM_DATA.players.length) {
      playersList.innerHTML = renderEmptyState({
        title: 'Состав не заполнен',
        text: 'Добавьте игроков в команду.',
        compact: true
      });
    }
    TEAM_DATA.players.forEach((player) => {
      const seasonLine = getPlayerSeasonShortFromStats(playerStatsById.get(player.id));
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `player-row role-${player.roleKey || 'unknown'}`;
      button.innerHTML = `
        ${renderAvatar(player, 'small')}
        <span class="player-number">№${player.number}</span>
        <span class="player-main">
          <strong>${escapeHtml(getPlayerDisplayName(player))}</strong>
          <small>${escapeHtml(formatDate(player.birthDate))} · ${escapeHtml(player.role)} · ${player.height ? `${player.height} см` : 'рост не указан'}</small>
          <small>${escapeHtml(seasonLine)}</small>
        </span>
        <span class="player-status">${escapeHtml(player.status || 'не указан')}</span>
      `;
      button.addEventListener('click', () => openPlayer(player.id));
      playersList.appendChild(button);
    });

    const socialsTarget = $('#social-links');
    socialsTarget.innerHTML = '';
    const socialLinks = Array.isArray(TEAM_DATA.socials) ? TEAM_DATA.socials : [];
    const socialsData = socialLinks.length ? socialLinks : [{ label: 'Соцсети', value: 'Будет заполнено' }];
    socialsData.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'link-row';
      row.innerHTML = `<span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.value)}</strong>`;
      socialsTarget.appendChild(row);
    });

    const contacts = $('#team-contacts');
    contacts.innerHTML = '';
    const contactsSource = Array.isArray(TEAM_DATA.contacts) ? TEAM_DATA.contacts : [];
    const contactsData = contactsSource.length ? contactsSource : [{ label: 'Контакты', value: 'Будет заполнено' }];
    contactsData.forEach((item) => {
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

  function getPlayerSeasonShortFromStats(playerStats) {
    if (!playerStats || !playerStats.totalActions) return 'статистики пока нет';
    return `${playerStats.matches || 0} матчей · ${playerStats.totalActions} действий · ошибок ${playerStats.errors || 0}`;
  }

  function renderTeamSeasonStats() {
    const target = $('#team-season-stats-content');
    if (!target) return;

    const matches = getActiveTeamMatches();
    const playerStats = window.SetkaStatsPlayers
      ? window.SetkaStatsPlayers.calculatePlayerStats(matches, TEAM_DATA.id)
      : [];

    if (!matches.length || playerStats.every((player) => player.totalActions === 0)) {
      target.innerHTML = renderEmptyState({
        title: 'Статистики пока нет',
        text: 'Игроки появятся в статистике после сохранённого матча.',
        compact: true
      });
      return;
    }

    target.innerHTML = playerStats.map((player) => `
      <button class="season-player-row" type="button" data-player-season-id="${escapeHtml(player.playerId)}">
        <span class="avatar small">${escapeHtml(player.number || '')}</span>
        <span>
          <strong>${escapeHtml(getPlayerDisplayName(player))}</strong>
          <small>${escapeHtml(player.role || 'не указано')} · ${player.totalActions} действий · ошибок ${player.errors}</small>
        </span>
      </button>
    `).join('');

    target.querySelectorAll('[data-player-season-id]').forEach((button) => {
      button.addEventListener('click', () => openPlayer(button.dataset.playerSeasonId));
    });
  }

  function renderAvatar(player, size) {
    const photo = getPlayerPhoto(player);
    if (photo) {
      return `<img class="avatar ${size}" src="${escapeHtml(photo)}" alt="" loading="lazy" />`;
    }

    return `<span class="avatar ${size}" aria-hidden="true">${escapeHtml(player?.number || '')}</span>`;
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
      <div class="player-card-hero role-${escapeHtml(player.roleKey || 'unknown')}">
        <div class="player-photo">${renderAvatar(player, 'large')}</div>
        <div class="player-card-title">
          <span>${escapeHtml(TEAM_DATA.name)}</span>
          <h2>${escapeHtml(getPlayerDisplayName(player))}</h2>
          <p>№${player.number} · ${escapeHtml(player.role)}</p>
        </div>
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
        ${renderPlayerMatchesList(season.playedMatches, player.id)}
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
    const playedMatches = matches.filter((match) => (match.events || [])
      .some((event) => event.playerId === playerId && (!event.teamId || event.teamId === TEAM_DATA.id)));
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
        totalActions: (match.events || []).filter((event) => event.playerId === playerId && (!event.teamId || event.teamId === TEAM_DATA.id)).length,
        errors: (match.events || []).filter((event) => event.playerId === playerId && event.actionType === 'error' && (!event.teamId || event.teamId === TEAM_DATA.id)).length
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
          ${matches.map((match) => option(match.id, `${formatDate(match.date)} · ${match.opponent || 'Соперник не указан'}`, filters.matchId)).join('')}
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
      return renderEmptyState({
        title: 'Статистики пока нет',
        text: 'Игрок появится в статистике после сохранённого матча.',
        compact: true
      });
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
          <tbody>${season.dynamics.map((item) => `<tr><td data-label="Матч">${escapeHtml(formatDate(item.date))}<br><small>${escapeHtml(item.opponent || 'Соперник не указан')}</small></td><td data-label="Действий">${item.totalActions}</td><td data-label="Ошибки">${item.errors}</td></tr>`).join('')}</tbody>
        </table>
      </div>
    `;
  }

  function renderPlayerMatchesList(matches, playerId) {
    if (!matches.length) return '';

    return `
      <div class="player-match-list">
        <h3>Матчи игрока</h3>
        ${matches.map((match) => {
          const events = (match.events || []).filter((event) => event.playerId === playerId && (!event.teamId || event.teamId === TEAM_DATA.id));
          const errors = events.filter((event) => event.actionType === 'error').length;
          return `
            <div class="player-match-row">
              <span>${escapeHtml(formatDate(match.date))}</span>
              <strong>${escapeHtml(match.opponent)}</strong>
              <small>${events.length} действий · ошибок ${errors}</small>
            </div>
          `;
        }).join('')}
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

  function normalizeSetNumber(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 1;
    return Math.min(5, Math.max(1, Math.round(parsed)));
  }

  function normalizeScoreValue(value) {
    if (value === '' || value === null || typeof value === 'undefined') return 0;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return Math.round(parsed);
  }

  function createEmptySets() {
    return Array.from({ length: 5 }, (_, index) => {
      const setNumber = index + 1;
      return {
        setNumber,
        ourScore: 0,
        opponentScore: 0,
        ours: 0,
        opponent: 0,
        score: '0:0'
      };
    });
  }

  function normalizeMatchSets(match) {
    const bySet = new Map();
    const source = Array.isArray(match?.sets) && match.sets.length
      ? match.sets
      : Array.isArray(match?.setScores)
        ? match.setScores
        : [];

    source.forEach((item, index) => {
      const fallbackNumber = index + 1;
      if (typeof item === 'string') {
        const parts = item.split(/[:\-]/);
        const setNumber = normalizeSetNumber(fallbackNumber);
        const ourScore = normalizeScoreValue(parts[0]);
        const opponentScore = normalizeScoreValue(parts[1]);
        bySet.set(setNumber, { setNumber, ourScore, opponentScore, ours: ourScore, opponent: opponentScore, score: `${ourScore}:${opponentScore}` });
        return;
      }

      if (item && typeof item === 'object') {
        const parts = typeof item.score === 'string' ? item.score.split(/[:\-]/) : [];
        const setNumber = normalizeSetNumber(item.setNumber || item.number || fallbackNumber);
        const ourScore = normalizeScoreValue(item.ourScore ?? item.ours ?? parts[0]);
        const opponentScore = normalizeScoreValue(item.opponentScore ?? item.opponent ?? parts[1]);
        bySet.set(setNumber, { ...item, setNumber, ourScore, opponentScore, ours: ourScore, opponent: opponentScore, score: `${ourScore}:${opponentScore}` });
      }
    });

    return createEmptySets().map((item) => bySet.get(item.setNumber) || item);
  }

  function ensureMatchSets(match = state.currentMatch) {
    if (!match) return createEmptySets();
    const sets = normalizeMatchSets(match);
    match.sets = sets;
    return sets;
  }

  function getSetScore(match = state.currentMatch, setNumber = state.currentSet) {
    const sets = ensureMatchSets(match);
    return sets.find((set) => Number(set.setNumber) === Number(setNumber)) || sets[0];
  }

  function getVisibleSetScores(match = state.currentMatch) {
    return ensureMatchSets(match)
      .filter((set) => Number(set.ourScore || set.ours || 0) > 0 || Number(set.opponentScore || set.opponent || 0) > 0)
      .map((set) => `${set.ourScore}:${set.opponentScore}`);
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
      state.currentSet = normalizeSetNumber(activeMatch.currentSet || activeMatch.setNumber || 1);
      state.currentMatch = {
        ...activeMatch,
        teamId: activeMatch.teamId || TEAM_DATA.id,
        teamName: activeMatch.teamName || TEAM_DATA.name,
        ourTeam: activeMatch.ourTeam || TEAM_DATA.name,
        location: activeMatch.location || activeMatch.venue || '',
        venue: activeMatch.venue || activeMatch.location || '',
        currentSet: state.currentSet,
        setNumber: state.currentSet,
        sets: normalizeMatchSets(activeMatch),
        setScores: getVisibleSetScores(activeMatch),
        lineup: normalizedCurrentLineup,
        startingLineup: normalizedStartingLineup
      };
    } else {
      state.currentSet = 1;
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
      window.setTimeout(() => maybeStartStatsTutorial(), 180);
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
    showToast('Сначала создайте матч для записи статистики', 'info');
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
        <div class="team-logo setup-logo">${teamLogoMarkup(TEAM_DATA, 'compact')}</div>
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
          ${TEAM_DATA.players.length ? TEAM_DATA.players.map((player) => {
            const isStarter = starterIds.has(player.id);
            return `
              <label class="roster-picker-row">
                ${renderAvatar(player, 'small')}
                <span class="roster-picker-main">
                  <strong>№${escapeHtml(player.number)} ${escapeHtml(getPlayerDisplayName(player))}</strong>
                  <small>${escapeHtml(player.role)}${player.height ? ` · ${escapeHtml(player.height)} см` : ''}</small>
                </span>
                <span class="roster-picker-controls">
                  <span><input type="checkbox" data-setup-participant value="${escapeHtml(player.id)}" checked> В заявке</span>
                  <span><input type="checkbox" data-setup-starter value="${escapeHtml(player.id)}"${isStarter ? ' checked' : ''}> Старт</span>
                </span>
              </label>
            `;
          }).join('') : renderEmptyState({
            title: 'Состав не заполнен',
            text: 'Добавьте игроков в команду.',
            compact: true
          })}
        </div>
        <p class="setup-note">Игроки вне заявки не попадут в запись статистики и результаты этого матча.</p>
      </section>
      <div class="match-setup-actions">
        <button class="primary-action" type="button" data-setup-action="quick-start-match">Начать быструю запись</button>
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
      return;
    }
    if (action === 'quick-start-match') {
      createQuickMatchDraft();
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
        showToast('В стартовом составе может быть не больше 7 игроков', 'warning');
      }
    }
  }

  async function createMatchFromSetup() {
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
      showToast('Укажите соперника', 'warning');
      $('#match-opponent', setup)?.focus();
      return;
    }
    if (!participantIds.length) {
      showToast('Выберите хотя бы одного игрока в заявку', 'warning');
      return;
    }
    if (starterIds.length > 7) {
      showToast('В стартовом составе может быть не больше 7 игроков', 'warning');
      return;
    }
    if (starterIds.length < 6) {
      const ok = await confirmModal({
        title: 'Начать неполным составом?',
        message: 'В стартовом составе меньше 6 игроков. Можно продолжить, если это осознанная запись.',
        confirmText: 'Начать',
        cancelText: 'Отмена'
      });
      if (!ok) return;
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
      sets: createEmptySets(),
      setScores: [],
      finalScore: '',
      result: '',
      coachComment,
      currentSet: state.currentSet,
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

  function createQuickMatchDraft() {
    const participants = TEAM_DATA.players.slice();
    if (!participants.length) {
      showToast('Состав не заполнен', 'warning');
      return;
    }

    const starterIds = TEAM_DATA.starterSlots.map((slot) => slot.playerId || slot.id).filter(Boolean);
    const starters = sortPlayersForLineup(
      (starterIds.length ? starterIds.map(getPlayer).filter(Boolean) : participants.slice(0, 6))
    ).slice(0, 7);
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
      opponent: 'Соперник не указан',
      date: getTodayInputDate(),
      tournament: '',
      location: '',
      venue: '',
      matchType: 'товарищеский',
      matchFormat: 'до 3 партий',
      status: 'идёт матч',
      roster,
      startingLineup: lineup.filter((slot) => slot.playerId),
      lineup,
      bench,
      substitutions: [],
      sets: createEmptySets(),
      setScores: [],
      finalScore: '',
      result: '',
      coachComment: '',
      currentSet: state.currentSet,
      setNumber: state.currentSet,
      title: `${TEAM_DATA.name} — соперник`,
      createdAt: now,
      updatedAt: now,
      events: []
    };

    saveCurrentMatch();
    enterStatsScreen();
    updateAutosave('saved');
    showToast('Быстрая запись начата', 'success');
  }

  function saveCurrentMatch() {
    if (!state.currentMatch) return false;

    try {
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
      state.currentMatch.currentSet = state.currentSet;
      state.currentMatch.setNumber = state.currentSet;
      state.currentMatch.sets = ensureMatchSets();
      state.currentMatch.setScores = getVisibleSetScores();
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
      return true;
    } catch (error) {
      console.error('Autosave error', error);
      updateAutosave('error');
      showToast('Не удалось сохранить данные', 'error');
      return false;
    }
  }

  function setCurrentSet(value) {
    const nextSet = normalizeSetNumber(value);
    if (state.currentSet === nextSet) {
      return;
    }

    state.currentSet = nextSet;
    if (state.currentMatch) {
      ensureMatchSets();
      state.currentMatch.currentSet = state.currentSet;
      state.currentMatch.setNumber = state.currentSet;
      saveCurrentMatch();
    }

    renderStatsPanel();
    updateAutosave();
  }

  function renderStatsSetTabs() {
    const container = $('#stats-set-tabs');
    if (!container) return;
    const sets = ensureMatchSets();
    container.innerHTML = sets.map((set) => `
      <button
        type="button"
        class="${Number(set.setNumber) === Number(state.currentSet) ? 'active' : ''}"
        data-stats-set-tab="${escapeHtml(set.setNumber)}"
        aria-pressed="${Number(set.setNumber) === Number(state.currentSet)}"
      >
        <strong>${escapeHtml(set.setNumber)}</strong>
        <span>${escapeHtml(set.ourScore)}:${escapeHtml(set.opponentScore)}</span>
      </button>
    `).join('');
  }

  function renderStatsScorePanel() {
    const panel = $('#stats-score-panel');
    if (!panel) return;
    const score = getSetScore();
    panel.innerHTML = `
      <div class="score-box">
        <span>Партия ${escapeHtml(state.currentSet)}</span>
        <strong>${escapeHtml(score.ourScore)}:${escapeHtml(score.opponentScore)}</strong>
      </div>
      <div class="score-controls" aria-label="Изменить счёт партии ${escapeHtml(state.currentSet)}">
        <button type="button" data-score-action="our-minus" aria-label="Уменьшить наш счёт">−</button>
        <button type="button" data-score-action="our-plus" aria-label="Добавить очко ${escapeHtml(TEAM_DATA.name)}">${escapeHtml(TEAM_DATA.logoText || 'М')}</button>
        <button type="button" data-score-action="opponent-plus" aria-label="Добавить очко сопернику">С</button>
        <button type="button" data-score-action="opponent-minus" aria-label="Уменьшить счёт соперника">−</button>
      </div>
    `;
  }

  function changeCurrentSetScore(action) {
    if (!ensureStatsMatch()) return;
    const score = getSetScore();
    if (!score) return;
    if (action === 'our-plus') score.ourScore += 1;
    if (action === 'our-minus') score.ourScore = Math.max(0, score.ourScore - 1);
    if (action === 'opponent-plus') score.opponentScore += 1;
    if (action === 'opponent-minus') score.opponentScore = Math.max(0, score.opponentScore - 1);
    score.ours = score.ourScore;
    score.opponent = score.opponentScore;
    score.score = `${score.ourScore}:${score.opponentScore}`;
    saveCurrentMatch();
    renderStatsSetTabs();
    renderStatsScorePanel();
    const title = $('#stats-set-score');
    if (title) title.textContent = `Партия ${state.currentSet} · ${score.score}`;
    updateAutosave();
  }

  function getCurrentMatchEvents() {
    if (!state.currentMatch) return [];
    const events = window.SetkaStorageEvents
      ? window.SetkaStorageEvents.getByMatch(state.currentMatch.id)
      : storage.load(STORAGE_KEYS.statsEvents, []).filter((event) => event.matchId === state.currentMatch.id);
    return events
      .filter((event) => !event.teamId || event.teamId === TEAM_DATA.id)
      .map((event) => ({ ...event, setNumber: normalizeSetNumber(event.setNumber || 1) }))
      .sort((a, b) => String(b.timestamp || b.time || '').localeCompare(String(a.timestamp || a.time || '')));
  }

  function getActionGroup(type) {
    return ACTION_GROUP_BY_TYPE[type] || ACTION_GROUPS[0];
  }

  function getResultOption(actionType, resultCode) {
    const group = getActionGroup(actionType);
    return group.results.find((result) => result.code === resultCode) || group.results[0];
  }

  function getStatsJournalPlayers(events) {
    const ids = new Set();
    const players = [];
    const addPlayer = (player) => {
      if (!player || ids.has(player.id)) return;
      ids.add(player.id);
      players.push(player);
    };

    state.statsLineup.forEach((slot) => addPlayer(getPlayer(slot.playerId)));
    (state.currentMatch?.roster || []).forEach((item) => addPlayer(getPlayer(item.playerId || item.id)));
    events.forEach((event) => addPlayer(getPlayer(event.playerId)));
    TEAM_DATA.players.forEach(addPlayer);
    return players;
  }

  function renderActionOptions(value) {
    return ACTION_GROUPS.map((group) => option(group.type, group.name, value)).join('');
  }

  function renderResultOptions(actionType, value) {
    const group = getActionGroup(actionType);
    return group.results.map((result) => option(result.code, result.label, value)).join('');
  }

  function renderPlayerOptions(players, value) {
    return players.map((player) => option(player.id, `№${player.number} ${getPlayerDisplayName(player)}`, value)).join('');
  }

  function filterStatsJournalEvents(events) {
    const filters = state.statsJournalFilters;
    return events.filter((event) => {
      if (filters.setNumber && String(event.setNumber || 1) !== filters.setNumber) return false;
      if (filters.playerId && event.playerId !== filters.playerId) return false;
      if (filters.actionType && event.actionType !== filters.actionType) return false;
      return true;
    });
  }

  function resetStatsJournalScrollArea() {
    const listNode = $('#stats-journal-list');
    if (!listNode) return;
    listNode.style.removeProperty('height');
    listNode.style.removeProperty('max-height');
    listNode.style.removeProperty('flex');
    listNode.style.removeProperty('overflow-y');
    listNode.style.removeProperty('overflow-x');
    listNode.style.removeProperty('-webkit-overflow-scrolling');
  }

  function updateStatsJournalScrollArea() {
    statsJournalScrollFrame = 0;
    const details = $('#stats-live-journal');
    const listNode = $('#stats-journal-list');
    const workbench = $('.stats-workbench');
    if (!details || !listNode || !workbench?.classList.contains('journal-mode') || !details.open) {
      resetStatsJournalScrollArea();
      return;
    }

    const visualViewport = window.visualViewport;
    const viewportHeight = visualViewport?.height || window.innerHeight || document.documentElement.clientHeight || 0;
    const listTop = listNode.getBoundingClientRect().top;
    const bottomReserve = 18;
    const availableHeight = Math.max(132, Math.floor(viewportHeight - listTop - bottomReserve));

    listNode.style.height = `${availableHeight}px`;
    listNode.style.maxHeight = `${availableHeight}px`;
    listNode.style.flex = '0 0 auto';
    listNode.style.overflowX = 'hidden';
    listNode.style.overflowY = 'auto';
    listNode.style.setProperty('-webkit-overflow-scrolling', 'touch');
  }

  function scheduleStatsJournalScrollUpdate() {
    if (statsJournalScrollFrame) window.cancelAnimationFrame(statsJournalScrollFrame);
    statsJournalScrollFrame = window.requestAnimationFrame(updateStatsJournalScrollArea);
  }

  function closeStatsJournalMode() {
    const details = $('#stats-live-journal');
    if (details) details.open = false;
    state.statsJournalOpen = false;
    state.editingStatsEventId = '';
    $('.stats-workbench')?.classList.remove('journal-mode');
    const label = $('.journal-summary-state');
    if (label) label.textContent = 'Открыть';
    resetStatsJournalScrollArea();
  }

  function applyStatsJournalMode(isOpen) {
    state.statsJournalOpen = Boolean(isOpen);
    $('.stats-workbench')?.classList.toggle('journal-mode', state.statsJournalOpen);
    const label = $('.journal-summary-state');
    if (label) label.textContent = state.statsJournalOpen ? 'Назад к записи' : 'Открыть';
    if (!state.statsJournalOpen) state.editingStatsEventId = '';
    if (state.statsJournalOpen) scheduleStatsJournalScrollUpdate();
    else resetStatsJournalScrollArea();
  }

  function openStatsJournalMode() {
    const details = $('#stats-live-journal');
    if (!details) return;
    details.open = true;
    applyStatsJournalMode(true);
    renderStatsJournal();
  }

  function handleStatsJournalToggle(event) {
    applyStatsJournalMode(event.currentTarget.open);
    if (event.currentTarget.open) renderStatsJournal();
  }

  function getCompactEventPlayerName(event, players = []) {
    const player = players.find((item) => item.id === event.playerId);
    if (player) return getShortName(player);
    const parts = String(event.playerName || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'Игрок';
    return parts[1] ? `${parts[0]} ${parts[1].slice(0, 1)}.` : parts[0];
  }

  function getCompactActionText(group, result) {
    if (group.type === 'error') return 'Ошибка';
    return `${group.name} ${result.label}`;
  }

  function renderStatsJournal() {
    const filtersNode = $('#stats-journal-filters');
    const listNode = $('#stats-journal-list');
    if (!filtersNode || !listNode) return;
    const events = getCurrentMatchEvents();
    const players = getStatsJournalPlayers(events);
    const filters = state.statsJournalFilters;

    filtersNode.innerHTML = `
      <select data-stats-journal-filter="setNumber" aria-label="Фильтр партии">
        ${option('', 'Все партии', filters.setNumber)}
        ${[1, 2, 3, 4, 5].map((setNumber) => option(String(setNumber), `Партия ${setNumber}`, filters.setNumber)).join('')}
      </select>
      <select data-stats-journal-filter="playerId" aria-label="Фильтр игрока">
        ${option('', 'Все игроки', filters.playerId)}
        ${renderPlayerOptions(players, filters.playerId)}
      </select>
      <select data-stats-journal-filter="actionType" aria-label="Фильтр действия">
        ${option('', 'Все действия', filters.actionType)}
        ${renderActionOptions(filters.actionType)}
      </select>
    `;

    const filtered = filterStatsJournalEvents(events);
    if (!events.length) {
      listNode.innerHTML = renderEmptyState({
        title: 'Журнал пуст',
        text: 'Запишите первое действие игрока, и оно появится здесь.',
        compact: true
      });
      scheduleStatsJournalScrollUpdate();
      return;
    }
    if (!filtered.length) {
      listNode.innerHTML = renderEmptyState({
        title: 'Нет действий',
        text: 'Измените фильтры журнала.',
        compact: true
      });
      scheduleStatsJournalScrollUpdate();
      return;
    }

    listNode.innerHTML = filtered.map((event) => renderStatsJournalEvent(event, players)).join('');
    scheduleStatsJournalScrollUpdate();
  }

  function renderStatsJournalEvent(event, players) {
    const group = getActionGroup(event.actionType);
    const result = getResultOption(group.type, event.actionResult);
    const time = event.timestamp || event.time
      ? new Date(event.timestamp || event.time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      : '—';
    const playerName = getCompactEventPlayerName(event, players);
    const actionText = getCompactActionText(group, result);
    const isEditing = state.editingStatsEventId === event.id;

    return `
      <article class="stats-journal-event ${isEditing ? 'editing' : ''}" data-stats-event-id="${escapeHtml(event.id)}">
        <div class="stats-journal-event-head">
          <strong>Партия ${escapeHtml(event.setNumber || 1)} · ${escapeHtml(playerName)}</strong>
          <span>${escapeHtml(actionText)} · ${escapeHtml(time)}</span>
        </div>
        ${isEditing ? `<div class="stats-event-edit">
          <select data-event-field="setNumber" aria-label="Партия события">
            ${[1, 2, 3, 4, 5].map((setNumber) => option(String(setNumber), `Партия ${setNumber}`, String(event.setNumber || 1))).join('')}
          </select>
          <select data-event-field="playerId" aria-label="Игрок события">
            ${renderPlayerOptions(players, event.playerId)}
          </select>
          <select data-event-field="actionType" aria-label="Действие события">
            ${renderActionOptions(group.type)}
          </select>
          <select data-event-field="actionResult" aria-label="Результат действия">
            ${renderResultOptions(group.type, result.code)}
          </select>
        </div>` : ''}
        <div class="stats-journal-actions">
          ${isEditing
            ? '<button class="secondary-button" type="button" data-stats-journal-action="save-event">Готово</button><button class="text-button" type="button" data-stats-journal-action="cancel-event">Отмена</button>'
            : '<button class="secondary-button" type="button" data-stats-journal-action="edit-event">Изм.</button>'}
          <button class="text-button danger-outline" type="button" data-stats-journal-action="delete-event">Удалить</button>
        </div>
      </article>
    `;
  }

  function renderStatsPanel() {
    const match = state.currentMatch;
    const score = match ? getSetScore(match) : null;
    $('#stats-match-name').textContent = match ? match.opponent : TEAM_DATA.name;
    $('#stats-set-score').textContent = match
      ? `Партия ${state.currentSet} · ${score ? score.score : '0:0'}`
      : `Партия ${state.currentSet}`;
    renderStatsSetTabs();
    renderStatsScorePanel();
    renderStatsJournal();
    applyStatsJournalMode($('#stats-live-journal')?.open);
    const finishButton = $('#finish-match-button');
    const deleteButton = $('#delete-draft-button');
    const undoButton = $('#undo-last-event-button');
    const journalButton = $('#stats-journal-top-button');
    if (finishButton) finishButton.disabled = !match;
    if (deleteButton) deleteButton.disabled = !match;
    if (undoButton) undoButton.disabled = !match || !getCurrentMatchEvents().length;
    if (journalButton) journalButton.disabled = !match;

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
      cell.dataset.actionLabel = group.name;

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

    const timestamp = new Date().toISOString();
    const event = {
      id: createId('event'),
      teamId: TEAM_DATA.id,
      matchId: state.currentMatch.id,
      playerId: player.id,
      playerNumber: player.number,
      playerName: getPlayerDisplayName(player),
      playerRole: player.role,
      playerPhoto: getPlayerPhoto(player),
      actionType: group.type,
      actionName: group.name,
      actionResult: result.code,
      resultLabel: result.label,
      time: timestamp,
      setNumber: state.currentSet,
      timestamp,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    if (state.currentMatch.status !== 'идёт матч') state.currentMatch.status = 'сохранён локально';
    if (window.SetkaStorageEvents) {
      window.SetkaStorageEvents.appendEvent(event);
    } else {
      storage.append(STORAGE_KEYS.statsEvents, event);
    }
    const saved = saveCurrentMatch();
    renderStatsJournal();
    const undoButton = $('#undo-last-event-button');
    if (undoButton) undoButton.disabled = false;
    updateAutosave(saved ? 'saved' : 'error');
    showToast(`${group.name} ${result.label} · ${getShortName(player)}`, 'info', 1200);

    if (navigator.vibrate) navigator.vibrate(8);
  }

  async function undoLastStatEvent() {
    if (!ensureStatsMatch()) return;
    const removed = window.SetkaStorageEvents?.deleteLast(state.currentMatch.id, TEAM_DATA.id);
    if (!removed) {
      showToast('Нет действий для отмены', 'warning');
      return;
    }
    saveCurrentMatch();
    state.results.cacheKey = '';
    renderStatsPanel();
    updateAutosave('saved');
    showToast('Действие отменено', 'info');
  }

  function handleStatsSetTabsClick(event) {
    const button = event.target.closest('[data-stats-set-tab]');
    if (!button) return;
    setCurrentSet(button.dataset.statsSetTab);
  }

  function handleStatsScoreClick(event) {
    const button = event.target.closest('[data-score-action]');
    if (!button) return;
    changeCurrentSetScore(button.dataset.scoreAction);
  }

  function handleStatsJournalChange(event) {
    const filter = event.target.dataset.statsJournalFilter;
    if (filter) {
      state.statsJournalFilters[filter] = event.target.value;
      renderStatsJournal();
      return;
    }

    const field = event.target.dataset.eventField;
    if (field !== 'actionType') return;
    const card = event.target.closest('[data-stats-event-id]');
    const resultSelect = $('[data-event-field="actionResult"]', card);
    if (resultSelect) {
      resultSelect.innerHTML = renderResultOptions(event.target.value, getResultOption(event.target.value, '').code);
    }
  }

  async function handleStatsJournalClick(event) {
    const button = event.target.closest('[data-stats-journal-action]');
    if (!button) return;
    const card = button.closest('[data-stats-event-id]');
    const eventId = card?.dataset.statsEventId || '';
    if (!eventId) return;

    if (button.dataset.statsJournalAction === 'edit-event') {
      state.editingStatsEventId = eventId;
      renderStatsJournal();
      return;
    }

    if (button.dataset.statsJournalAction === 'cancel-event') {
      state.editingStatsEventId = '';
      renderStatsJournal();
      return;
    }

    if (button.dataset.statsJournalAction === 'save-event') {
      saveStatsJournalEvent(card, eventId);
      return;
    }

    if (button.dataset.statsJournalAction === 'delete-event') {
      await deleteStatsJournalEvent(eventId);
    }
  }

  function saveStatsJournalEvent(card, eventId) {
    const playerId = $('[data-event-field="playerId"]', card)?.value || '';
    const player = getPlayer(playerId);
    const actionType = $('[data-event-field="actionType"]', card)?.value || '';
    const group = getActionGroup(actionType);
    const resultCode = $('[data-event-field="actionResult"]', card)?.value || '';
    const result = getResultOption(actionType, resultCode);
    const setNumber = normalizeSetNumber($('[data-event-field="setNumber"]', card)?.value || 1);

    if (!player || !group || !result) {
      showToast('Не удалось обновить действие', 'error');
      return;
    }

    const updated = window.SetkaStorageEvents?.updateEvent(eventId, {
      teamId: TEAM_DATA.id,
      playerId: player.id,
      playerNumber: player.number,
      playerName: getPlayerDisplayName(player),
      playerRole: player.role,
      playerPhoto: getPlayerPhoto(player),
      setNumber,
      actionType: group.type,
      actionName: group.name,
      actionResult: result.code,
      resultLabel: result.label
    }, TEAM_DATA.id);

    if (!updated) {
      showToast('Не удалось сохранить действие', 'error');
      return;
    }

    saveCurrentMatch();
    state.results.cacheKey = '';
    state.editingStatsEventId = '';
    renderStatsPanel();
    updateAutosave('saved');
    showToast('Действие обновлено', 'success');
  }

  async function deleteStatsJournalEvent(eventId) {
    const ok = await confirmModal({
      title: 'Удалить действие?',
      message: 'Это действие будет удалено из статистики матча. Это нельзя отменить.',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      danger: true
    });
    if (!ok) return;

    if (window.SetkaStorageEvents?.deleteEvent(eventId, TEAM_DATA.id)) {
      saveCurrentMatch();
      state.results.cacheKey = '';
      state.editingStatsEventId = '';
      renderStatsPanel();
      updateAutosave('saved');
      showToast('Действие удалено');
      return;
    }

    showToast('Не удалось удалить действие', 'error');
  }

  function updateAutosave(status = 'saving') {
    const indicator = $('#autosave-indicator');
    if (!indicator) return;

    window.clearTimeout(state.autosaveTimer);
    indicator.classList.remove('saving', 'error');

    if (status === 'error') {
      indicator.textContent = 'Ошибка сохранения';
      indicator.classList.add('error');
      return;
    }

    if (status === 'saved') {
      const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      indicator.textContent = `Сохранено ${time}`;
      return;
    }

    indicator.textContent = 'Сохраняем...';
    indicator.classList.add('saving');
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
      ? `Сейчас в строке: ${getPlayerDisplayName(currentPlayer)}`
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
            <strong>${escapeHtml(getPlayerDisplayName(player))}</strong>
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
    showToast('Матч сохранён');
  }

  function resetFinishModalButtons() {
    $('#finish-match-save')?.classList.remove('hidden');
    $('#finish-match-cancel')?.classList.remove('hidden');
  }

  async function deleteActiveMatchDraft() {
    if (!state.currentMatch) return;
    const matchId = state.currentMatch.id;
    const ok = await confirmModal({
      title: 'Удалить черновик?',
      message: 'Текущий матч и все записанные действия будут удалены. Это действие нельзя отменить.',
      confirmText: 'Удалить',
      danger: true
    });
    if (!ok) return;

    if (window.SetkaStorageEvents) {
      window.SetkaStorageEvents.deleteByMatch(matchId, TEAM_DATA.id);
    } else {
      const events = storage.load(STORAGE_KEYS.statsEvents, []);
      storage.save(STORAGE_KEYS.statsEvents, events.filter((event) => event.matchId !== matchId || (event.teamId && event.teamId !== TEAM_DATA.id)));
    }

    const substitutions = storage.load(STORAGE_KEYS.substitutions, []);
    storage.save(STORAGE_KEYS.substitutions, substitutions.filter((item) => item.matchId !== matchId || (item.teamId && item.teamId !== TEAM_DATA.id)));

    if (window.SetkaStorageMatches) {
      window.SetkaStorageMatches.deleteMatch(matchId, TEAM_DATA.id);
      window.SetkaStorageMatches.deleteSubstitutionsByMatch?.(matchId, TEAM_DATA.id);
    } else {
      const matches = storage.load(STORAGE_KEYS.matches, []);
      storage.save(STORAGE_KEYS.matches, matches.filter((match) => (match.id || match.matchId) !== matchId || (match.teamId && match.teamId !== TEAM_DATA.id)));
      storage.remove(STORAGE_KEYS.currentMatch);
    }

    state.currentMatch = null;
    state.results.cacheKey = '';
    state.statsLineup = normalizeLineupSlots(TEAM_DATA.starterSlots);
    enterStatsScreen();
    showToast('Черновик удалён');
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
      content.innerHTML = renderErrorState({
        title: 'Не удалось загрузить результаты',
        text: 'Раздел результатов не смог обработать локальные данные. Данные статистики не удалены.',
        action: 'retry-results'
      });
      showToast('Ошибка загрузки данных', 'error');
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
      ${noRealData ? renderEmptyState({
        title: 'Матчей пока нет',
        text: 'Создайте первый матч и начните запись статистики.',
        action: 'open-stats-setup',
        actionText: 'Записать матч'
      }) : ''}
      ${noRealData ? renderInfoBanner('Ниже показаны демонстрационные данные, чтобы можно было проверить аналитику.') : ''}
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
        ${renderEmptyState({
          title: noRealData ? 'Матчей пока нет' : 'Матчи не найдены',
          text: noRealData ? 'Создайте первый матч и начните запись статистики.' : 'Измените фильтры или сбросьте выбранный период.',
          action: noRealData ? 'open-stats-setup' : 'reset-filters',
          actionText: noRealData ? 'Записать матч' : 'Сбросить фильтры'
        })}
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
      return `<tr><td data-label="Действие">${stats.name}</td><td data-label="Всего">${stats.total}</td><td data-label="Итог" colspan="3">Всего ошибок</td></tr>`;
    }
    return `
      <tr>
        <td data-label="Действие">${stats.name}</td>
        <td data-label="Всего">${stats.total}</td>
        <td data-label="Плюс">${stats.plus} · ${window.SetkaStatsCore.formatPercent(stats.plusPercent)}</td>
        <td data-label="Минус">${stats.minus} · ${window.SetkaStatsCore.formatPercent(stats.minusPercent)}</td>
        <td data-label="Средне">${stats.mode === 'triple' ? `${stats.neutral} · ${window.SetkaStatsCore.formatPercent(stats.neutralPercent)}` : '—'}</td>
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
    return `<div class="best-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(item ? `${item.match.opponent}, ${formatSetLabel(item.set.setNumber)}` : 'Недостаточно данных')}</strong><small>${item ? `${item.set.totalActions} действий` : ''}</small></div>`;
  }

  function formatSetLabel(setNumber) {
    return Number.isFinite(Number(setNumber)) ? `Партия ${setNumber}` : String(setNumber || 'Партия не указана');
  }

  function renderComparisonSetup(matches) {
    const [first = '', second = ''] = state.results.compareIds;
    return `
      <section class="results-section">
        <div class="results-section-head">
          <h2>Сравнение матчей</h2>
          <button class="text-button" type="button" data-results-action="open-compare">Открыть</button>
        </div>
        ${matches.length < 2 ? renderEmptyState({
          title: 'Недостаточно данных',
          text: 'Для сравнения нужно минимум два сохранённых матча.',
          compact: true
        }) : `
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
        ${match.isMock ? '' : `
          <div class="match-card-actions">
            <button class="text-button danger-outline" type="button" data-results-action="delete-match" data-match-id="${escapeHtml(match.id)}">Удалить матч</button>
          </div>
        `}
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
      content.innerHTML = renderErrorState({
        title: 'Не удалось открыть матч',
        text: 'Матч не найден или был удалён.',
        action: 'back-home',
        actionText: 'Все результаты'
      });
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
        <div class="match-detail-actions">
          <button class="primary-action" type="button" data-results-action="export-match" data-match-id="${escapeHtml(match.id)}">PDF матча</button>
          ${match.isMock ? '' : `<button class="text-button danger-outline" type="button" data-results-action="delete-match" data-match-id="${escapeHtml(match.id)}">Удалить матч</button>`}
        </div>
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
      ${renderRolesBlock(roleStats, match.id)}
      ${renderSetsBlock(setStats)}
      ${renderBestBlock(best)}
      ${renderRosterBlock(match)}
      ${renderPlayersBlock(playerStats, match.id)}
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

    if (!roster.length) {
      return `
        <details class="results-section" open>
          <summary>Состав</summary>
          ${renderEmptyState({
            title: 'Состав не заполнен',
            text: 'Добавьте игроков в команду.',
            compact: true
          })}
        </details>
      `;
    }

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
        ${players.length ? `<div class="mini-list">${players.map(renderRosterMiniPlayer).join('')}</div>` : '<p class="muted">Нет данных</p>'}
      </div>
    `;
  }

  function renderRosterMiniPlayer(player) {
    return `
      <span class="mini-player">
        ${renderAvatar(player, 'tiny')}
        <span>
          <strong>№${escapeHtml(player.number)} ${escapeHtml(getPlayerDisplayName(player))}</strong>
          <small>${escapeHtml(player.role)}</small>
        </span>
      </span>
    `;
  }

  function renderPlayersBlock(players, matchId) {
    return `
      <details class="results-section" open>
        <summary>Игроки</summary>
        <div class="player-result-cards">
          ${players.map((player) => renderPlayerResultCard(player, matchId)).join('')}
        </div>
        <div class="table-scroll">
          <table class="stats-table player-stats-table">
            <thead><tr><th>Игрок</th><th>Статус</th><th>Действий</th><th>Подача</th><th>Приём</th><th>Атака</th><th>Блок</th><th>Защита</th><th>Ошибки</th></tr></thead>
            <tbody>
              ${players.map((player) => `
                <tr>
                  <td data-label="Игрок"><button class="table-link" type="button" data-results-action="open-player-result" data-match-id="${escapeHtml(matchId)}" data-player-id="${escapeHtml(player.playerId)}">№${escapeHtml(player.number)} ${escapeHtml(getPlayerDisplayName(player))}<br><small>${escapeHtml(player.role)}</small></button></td>
                  <td data-label="Статус">${escapeHtml(player.status)}</td>
                  <td data-label="Действий">${player.totalActions}</td>
                  <td data-label="Подача">${window.SetkaStatsCore.summarizeActionLine(player.byAction.serve)}</td>
                  <td data-label="Приём">${window.SetkaStatsCore.summarizeActionLine(player.byAction.receive)}</td>
                  <td data-label="Атака">${window.SetkaStatsCore.summarizeActionLine(player.byAction.attack)}</td>
                  <td data-label="Блок">${window.SetkaStatsCore.summarizeActionLine(player.byAction.block)}</td>
                  <td data-label="Защита">${window.SetkaStatsCore.summarizeActionLine(player.byAction.defense)}</td>
                  <td data-label="Ошибки">${player.errors}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </details>
    `;
  }

  function renderPlayerResultCard(player, matchId) {
    return `
      <button class="player-result-card" type="button" data-results-action="open-player-result" data-match-id="${escapeHtml(matchId)}" data-player-id="${escapeHtml(player.playerId)}">
        ${renderAvatar(player, 'small')}
        <span class="player-result-main">
          <strong>№${escapeHtml(player.number)} ${escapeHtml(getPlayerDisplayName(player))}</strong>
          <small>${escapeHtml(player.role || 'амплуа не указано')} · ${escapeHtml(player.status || 'статус не указан')}</small>
        </span>
        <span class="player-result-total">${player.totalActions}</span>
        <span class="player-result-line">
          <span>Подача: ${window.SetkaStatsCore.summarizeActionLine(player.byAction.serve)}</span>
          <span>Приём: ${window.SetkaStatsCore.summarizeActionLine(player.byAction.receive)}</span>
          <span>Атака: ${window.SetkaStatsCore.summarizeActionLine(player.byAction.attack)}</span>
          <span>Ошибки: ${player.errors}</span>
        </span>
      </button>
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
              <strong>${escapeHtml(formatSetLabel(set.setNumber))} · ${escapeHtml(set.score)}</strong>
              <span>${set.totalActions} действий</span>
              <small>Лучшие: ${set.bestPlayers.map((player) => getPlayerDisplayName(player)).join(', ') || 'Недостаточно данных'}</small>
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
    const sets = uniqueOptions((match.events || []).map((event) => event.setNumber ? String(event.setNumber) : 'unknown'));
    const events = filterEvents(match.events || []);

    return `
      <details class="results-section">
        <summary>Журнал действий</summary>
        <div class="journal-tools">
          <select data-event-filter="playerId">
            ${option('', 'Все игроки', filters.playerId)}
            ${players.map((player) => option(player.playerId, getPlayerDisplayName(player), filters.playerId)).join('')}
          </select>
          <select data-event-filter="role">
            ${option('', 'Все амплуа', filters.role)}
            ${roles.map((role) => option(role, role, filters.role)).join('')}
          </select>
          <select data-event-filter="setNumber">
            ${option('', 'Все партии', filters.setNumber)}
            ${sets.map((set) => option(set, set === 'unknown' ? 'Партия не указана' : `Партия ${set}`, filters.setNumber)).join('')}
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
          <div class="event-card-list">
            ${events.map(renderEventCard).join('')}
          </div>
          <div class="table-scroll journal-scroll">
            <table class="stats-table">
              <thead><tr><th>Время</th><th>Партия</th><th>Игрок</th><th>Амплуа</th><th>Действие</th><th>Результат</th><th></th></tr></thead>
              <tbody>${events.map(renderEventRow).join('')}</tbody>
            </table>
          </div>
        ` : renderEmptyState({
          title: (match.events || []).length ? 'Нет событий по фильтрам' : 'Журнал пуст',
          text: (match.events || []).length ? 'Измените фильтры журнала действий.' : 'Действия появятся здесь во время записи статистики.',
          compact: true
        })}
      </details>
    `;
  }

  function filterEvents(events) {
    const filters = state.results.eventFilters;
    return events.filter((event) => {
      if (filters.playerId && event.playerId !== filters.playerId) return false;
      if (filters.role && event.playerRole !== filters.role) return false;
      const eventSet = event.setNumber ? String(event.setNumber) : 'unknown';
      if (filters.setNumber && eventSet !== filters.setNumber) return false;
      if (filters.actionType && event.actionType !== filters.actionType) return false;
      if (filters.result && event.actionResult !== filters.result) return false;
      return true;
    }).slice().sort((a, b) => String(b.timestamp || b.time).localeCompare(String(a.timestamp || a.time)));
  }

  function renderEventRow(event) {
    const time = event.time ? new Date(event.time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '—';
    return `
      <tr>
        <td data-label="Время">${escapeHtml(time)}</td>
        <td data-label="Партия">${escapeHtml(event.setNumber || 'не указана')}</td>
        <td data-label="Игрок">${escapeHtml(getPlayerDisplayName(event.playerName))}</td>
        <td data-label="Амплуа">${escapeHtml(event.playerRole)}</td>
        <td data-label="Действие">${escapeHtml(event.actionName || event.actionType)}</td>
        <td data-label="Результат">${escapeHtml(event.resultLabel || event.actionResult)}</td>
        <td data-label="Действие"><button class="table-danger" type="button" data-results-action="delete-event" data-event-id="${escapeHtml(event.id)}">Удалить</button></td>
      </tr>
    `;
  }

  function renderEventCard(event) {
    const time = event.time ? new Date(event.time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '—';
    return `
      <article class="event-card">
        ${renderAvatar({
          teamId: event.teamId || TEAM_DATA.id,
          photo: event.playerPhoto,
          number: event.playerNumber || ''
        }, 'tiny')}
        <div>
          <strong>${escapeHtml(getPlayerDisplayName(event.playerName))}</strong>
          <small>${escapeHtml(event.playerRole || 'амплуа не указано')}</small>
        </div>
        <span>${escapeHtml(event.actionName || event.actionType)} · ${escapeHtml(event.resultLabel || event.actionResult)}</span>
        <small>${escapeHtml(time)} · ${event.setNumber ? `Партия ${escapeHtml(event.setNumber)}` : 'Партия не указана'}</small>
        <button class="table-danger" type="button" data-results-action="delete-event" data-event-id="${escapeHtml(event.id)}">Удалить</button>
      </article>
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
      content.innerHTML = renderErrorState({
        title: 'Игрок не найден',
        text: 'Статистика игрока недоступна или матч был удалён.',
        action: 'back-match',
        actionText: 'К матчу'
      });
      return;
    }

    const dynamics = window.SetkaStatsPlayers.calculatePlayerDynamics(player.playerId, data.matches, TEAM_DATA.id);
    const played = dynamics.filter((item) => item.totalActions > 0);
    const bestMatch = played.slice().sort((a, b) => b.totalActions - a.totalActions)[0];
    const worstMatch = played.slice().sort((a, b) => a.totalActions - b.totalActions)[0];

    content.innerHTML = `
      <section class="match-detail-hero">
        <button class="text-button" type="button" data-results-action="back-match">К матчу</button>
        <div><h2>${escapeHtml(getPlayerDisplayName(player))}</h2><p>№${escapeHtml(player.number)} · ${escapeHtml(player.role)}</p></div>
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
            <tbody>${dynamics.map((item) => `<tr><td data-label="Дата">${escapeHtml(formatDate(item.date))}</td><td data-label="Соперник">${escapeHtml(item.opponent)}</td><td data-label="Действий">${item.totalActions}</td><td data-label="Ошибки">${item.teamStats.errors.total}</td></tr>`).join('')}</tbody>
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
              <tbody>${comparison.rows.map((row) => `<tr><td data-label="Матч">${escapeHtml(formatDate(row.date))}<br><small>${escapeHtml(row.opponent)}</small></td><td data-label="Действий">${row.totalActions}</td><td data-label="Подача +">${window.SetkaStatsCore.formatPercent(row.serve.plusPercent)}</td><td data-label="Приём +">${window.SetkaStatsCore.formatPercent(row.receive.plusPercent)}</td><td data-label="Атака +">${window.SetkaStatsCore.formatPercent(row.attack.plusPercent)}</td><td data-label="Блок +">${window.SetkaStatsCore.formatPercent(row.block.plusPercent)}</td><td data-label="Защита +">${window.SetkaStatsCore.formatPercent(row.defense.plusPercent)}</td><td data-label="Ошибки">${row.errors.total}</td></tr>`).join('')}</tbody>
            </table>
          </div>
        </section>
        <section class="results-section">
          <div class="results-section-head"><h2>Проблемные зоны</h2></div>
          <div class="best-grid">${comparison.problemZones.map((item) => `<div class="best-card problem"><span>${escapeHtml(item.action)}</span><strong>-${window.SetkaStatsCore.formatPercent(item.minusPercent)}</strong><small>${item.total} действий</small></div>`).join('')}</div>
        </section>
      ` : renderEmptyState({
        title: 'Недостаточно данных',
        text: 'Для сравнения нужно минимум два сохранённых матча.'
      })}
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

    if (action === 'retry-results') {
      state.results.cacheKey = '';
      state.results.cache = null;
      renderResults();
      return;
    }

    if (action === 'open-stats-setup') {
      showScreen('stats');
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

    if (action === 'delete-match') {
      deleteResultsMatch(button.dataset.matchId);
      return;
    }

    if (action === 'export-team') {
      const data = getResultsData();
      executePdfExport(() => window.SetkaPdfExport.exportTeamPdf(data.filteredMatches, 'Выбранный период'));
      return;
    }

    if (action === 'export-match') {
      const match = getSelectedMatch();
      executePdfExport(() => window.SetkaPdfExport.exportMatchPdf(match));
      return;
    }

    if (action === 'export-player') {
      const data = getResultsData();
      const player = window.SetkaStatsPlayers.calculatePlayerStats(data.matches, TEAM_DATA.id)
        .find((item) => item.playerId === button.dataset.playerId);
      if (!player) {
        showToast('Нет данных для PDF игрока', 'warning');
        return;
      }
      executePdfExport(() => window.SetkaPdfExport.exportPlayerPdf(player, data.matches));
      return;
    }

    if (action === 'export-compare') {
      const data = getResultsData();
      const selected = state.results.compareIds
        .map((id) => data.matches.find((match) => match.id === id))
        .filter(Boolean);
      const comparison = window.SetkaStatsCompare.compareMatches(selected.length >= 2 ? selected : data.filteredMatches.slice(0, 2), TEAM_DATA.id);
      executePdfExport(() => window.SetkaPdfExport.exportComparePdf(comparison));
    }
  }

  async function deleteResultsEvent(eventId) {
    if (!eventId) return;
    const ok = await confirmModal({
      title: 'Удалить действие?',
      message: 'Статистика матча будет пересчитана.',
      confirmText: 'Удалить',
      danger: true
    });
    if (!ok) return;
    if (window.SetkaStorageEvents?.deleteEvent(eventId, TEAM_DATA.id)) {
      state.results.cacheKey = '';
      saveCurrentMatch();
      renderResults();
      showToast('Действие удалено');
      window.setTimeout(() => showToast('Статистика обновлена', 'info'), 220);
    } else {
      showToast('Не удалось удалить действие', 'error');
    }
  }

  async function deleteLastResultsEvent(matchId) {
    const ok = await confirmModal({
      title: 'Удалить последнее действие?',
      message: 'Последнее действие в этом матче будет удалено, статистика пересчитается.',
      confirmText: 'Удалить',
      danger: true
    });
    if (!ok) return;
    const removed = window.SetkaStorageEvents?.deleteLast(matchId, TEAM_DATA.id);
    if (removed) {
      state.results.cacheKey = '';
      saveCurrentMatch();
      renderResults();
      showToast('Последнее действие удалено');
      window.setTimeout(() => showToast('Статистика обновлена', 'info'), 220);
    } else {
      showToast('Не удалось удалить действие', 'error');
    }
  }

  async function deleteResultsMatch(matchId) {
    const data = getResultsData();
    const match = data.matches.find((item) => item.id === matchId);
    if (!match) {
      showToast('Матч не найден', 'warning');
      return;
    }

    if (match.isMock) {
      showToast('Демонстрационный матч не удаляется', 'warning');
      return;
    }

    if (match.teamId && match.teamId !== TEAM_DATA.id) {
      showToast('Матч относится к другому профилю', 'warning');
      return;
    }

    const ok = await confirmModal({
      title: 'Удалить матч?',
      message: 'Матч и вся связанная статистика будут удалены. Это действие нельзя отменить.',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      danger: true
    });
    if (!ok) return;

    const content = $('#results-content');
    if (content) content.innerHTML = renderLoadingState('Удаление матча');

    let removedMatch = false;
    let removedEvents = 0;
    try {
      removedMatch = window.SetkaStorageMatches?.deleteMatch(match.id, TEAM_DATA.id);
      removedEvents = window.SetkaStorageEvents?.deleteByMatch(match.id, TEAM_DATA.id) || 0;
      window.SetkaStorageMatches?.deleteSubstitutionsByMatch?.(match.id, TEAM_DATA.id);
    } catch (error) {
      console.error('Match delete error', error);
      if (content) {
        content.innerHTML = renderErrorState({
          title: 'Не удалось удалить матч',
          text: 'Локальное хранилище вернуло ошибку. Данные не были намеренно очищены.',
          action: 'retry-results'
        });
      }
      showToast('Не удалось удалить матч', 'error');
      return;
    }

    if (state.currentMatch && state.currentMatch.id === match.id) {
      state.currentMatch = null;
      state.statsLineup = [];
      state.currentSet = 1;
    }

    state.results.cacheKey = '';
    state.results.cache = null;
    state.results.selectedMatchId = '';
    state.results.compareIds = state.results.compareIds.filter((id) => id !== match.id);
    state.results.view = 'home';
    renderResults();
    renderTeam();
    showToast(removedMatch || removedEvents ? 'Матч удалён' : 'Матч уже был удалён', removedMatch || removedEvents ? 'success' : 'warning');
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
