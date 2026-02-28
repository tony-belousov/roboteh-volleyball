document.addEventListener('DOMContentLoaded', () => {
  console.log('🔥 DOMContentLoaded – скрипт запущен');

  window.addEventListener('error', (e) => console.error('❌ JS error:', e?.error || e?.message || e));
  window.addEventListener('unhandledrejection', (e) => console.error('❌ Unhandled rejection:', e?.reason || e));

  // ==========================================================
  // APP VERSION (чётко)
  // ==========================================================
  const APP_VERSION = '2026.03.01.1'; // меняй при релизах
  const verEl = document.querySelector('#app-version');
  if (verEl) verEl.textContent = APP_VERSION;

  // ==========================================================
  // STATE
  // ==========================================================
  let team1Name = 'Команда 1';
  let team2Name = 'Команда 2';

  let currentTeam = 'robotex';
  let selectedPlayers = {};      // zone -> player (для совместимости)
  let selectedLineup = [];       // 6 игроков
  let currentMatch = null;
  let currentSet = 1;

  let quickSelectedPlayer = null;
  let quickSelectedAction = null;
  let luxPlayersGridEl = null;

  // Для согласования таблицы и модалки посещаемости
  let attendanceDisplayedDates = []; // массив displayDate "DD.MM.YYYY"

  // ==========================================================
  // DATA: players + schedule
  // ==========================================================
  const rawPlayersRobotex = [
    "Байнжиян Роман","Биркин Александр","Жученко Иван","Кудряшов Егор",
    "Лебедев Владимир","Несоленов Андрей","Окрименко Сергей",
    "Сивенцев Артем","Сурков Олег","Тистимиров Дмитрий",
    "Урехбадзе Георгий","Шеин Александр"
  ];

  const rawPlayersRobotex2 = [
    "Белоусов Антон","Головин Максим","Мищенко Илья","Рзаев Алексей",
    "Стариков Евгений","Тюрин Дмитрий","Чарыев Мерген",
    "Чернышев Александр","Шляхтин Егор","Яковлев Александр"
  ];

  const rawAllPlayers = [...rawPlayersRobotex, ...rawPlayersRobotex2];

  // ✅ ВАЖНО: Прошедшие матчи (с результатами) сохраняем как есть.
  // ✅ Предстоящие (пустой score) — удалили старые и вставили новые из скрина.
  // Добавили поле competition: "Область" | "Город"
  // Добавили place (Место)
  const matchesData = [
    // ===== ПРОШЕДШИЕ (оставляем) =====
    { date: "05.10.2025", time: "10:00", team1: "Роботех", team2: "Роботех 2.0", score: "3:0", sets: "25:15, 27:25, 25:12", competition: "", place: "" },
    { date: "25.10.2025", time: "11:50", team1: "Таганрог", team2: "Роботех 2.0", score: "3:0", sets: "25:12, 25:22, 25:15", competition: "", place: "" },
    { date: "25.10.2025", time: "13:40", team1: "ЮФУ-Таганрог", team2: "Роботех", score: "0:3", sets: "15:25, 18:25, 23:25", competition: "", place: "" },
    { date: "29.11.2025", time: "13:40", team1: "Роботех 2.0", team2: "Бонум", score: "3:1", sets: "25:20, 19:25, 25:15, 25:19", competition: "", place: "" },
    { date: "29.11.2025", time: "15:30", team1: "Роботех", team2: "Луч Азов", score: "3:0", sets: "25:18, 25:18, 25:17", competition: "", place: "" },
    { date: "17.01.2026", time: "11:50", team1: "Роботех", team2: "Таганрог", score: "3:1", sets: "23:25, 25:14, 25:20, 25:17", competition: "", place: "" },
    { date: "17.01.2026", time: "19:10", team1: "РГУПС", team2: "Роботех 2.0", score: "1:3", sets: "18:25, 25:21, 24:26, 22:25", competition: "", place: "" },
    { date: "24.01.2026", time: "19:10", team1: "Бонум", team2: "Роботех", score: "0:3", sets: "9:25, 16:25, 23:25", competition: "", place: "" },
    { date: "01.02.2026", time: "19:30", team1: "Азия", team2: "Роботех 2.0", score: "2:3", sets: "25:20, 26:28, 21:25, 25:14, 9:15", competition: "", place: "" },
    { date: "14.02.2026", time: "19:10", team1: "Азия", team2: "Роботех", score: "0:3", sets: "21:25, 22:25, 8:25", competition: "", place: "" },
    { date: "15.02.2026", time: "19:30", team1: "Ростов-Дон", team2: "Роботех 2.0", score: "3:0", sets: "25:20, 25:20, 25:13", competition: "", place: "" },
    { date: "22.02.2026", time: "18:00", team1: "Роботех", team2: "Феникс", score: "3:0", sets: "25:9, 25:18, 25:18", competition: "", place: "" },

    // ===== ПРЕДСТОЯЩИЕ (НОВЫЕ ИЗ СКРИНА) =====
    // Фиолетовый = Область, Синий = Город
    { date: "01.03.2026", time: "10:00", team1: "ДГТУ", team2: "Роботех", score: "", sets: "", competition: "Область", place: "Дачная, 8а" },
    { date: "01.03.2026", time: "15:00", team1: "Атом", team2: "Роботех 2.0", score: "", sets: "", competition: "Область", place: "Дачная, 8а" },

    { date: "07.03.2026", time: "17:20", team1: "Ростов-Дон", team2: "Роботех", score: "", sets: "", competition: "Город", place: "" },
    { date: "08.03.2026", time: "19:10", team1: "ПСП", team2: "Роботех 2.0", score: "", sets: "", competition: "Город", place: "" },

    { date: "14.03.2026", time: "12:20", team1: "Роботех", team2: "Роботех 2.0", score: "", sets: "", competition: "Область", place: "Динамо" },

    { date: "15.03.2026", time: "17:00", team1: "Роботех", team2: "Таганрог", score: "", sets: "", competition: "Область", place: "Дачная, 8а" },
    { date: "15.03.2026", time: "19:10", team1: "Роботех 2.0", team2: "Феникс", score: "", sets: "", competition: "Город", place: "Суворовский" },

    { date: "21.03.2026", time: "19:10", team1: "СШОР-5", team2: "Роботех", score: "", sets: "", competition: "Город", place: "" },
    { date: "21.03.2026", time: "—", team1: "Новочеркасск", team2: "Роботех", score: "", sets: "", competition: "Область", place: "Новочеркасск" },
    { date: "21.03.2026", time: "—", team1: "Таганрог", team2: "Роботех 2.0", score: "", sets: "", competition: "Область", place: "Новочеркасск" },

    { date: "22.03.2026", time: "13:20", team1: "Сборная 10", team2: "Роботех", score: "", sets: "", competition: "Область", place: "Динамо" },
    { date: "22.03.2026", time: "15:20", team1: "Роботех 2.0", team2: "Новочеркасск", score: "", sets: "", competition: "Область", place: "Динамо" },
    { date: "22.03.2026", time: "19:10", team1: "Роботех", team2: "РГУПС", score: "", sets: "", competition: "Город", place: "" },

    { date: "28.03.2026", time: "15:30", team1: "Роботех 2.0", team2: "ЮФУ-Таганрог", score: "", sets: "", competition: "Город", place: "" },
    { date: "28.03.2026", time: "19:10", team1: "Роботех", team2: "ПСП", score: "", sets: "", competition: "Город", place: "" },

    { date: "29.03.2026", time: "13:20", team1: "ДГТУ", team2: "Роботех 2.0", score: "", sets: "", competition: "Область", place: "Динамо" },
    { date: "29.03.2026", time: "15:20", team1: "Роботех", team2: "Ростов-Волей 2", score: "", sets: "", competition: "Область", place: "Динамо" },
    { date: "29.03.2026", time: "17:00", team1: "Роботех", team2: "Атом", score: "", sets: "", competition: "Область", place: "Дачная, 8а" },

    { date: "05.04.2026", time: "10:00", team1: "Сборная 10", team2: "Роботех 2.0", score: "", sets: "", competition: "Область", place: "Дачная, 8а" },
    { date: "18.04.2026", time: "12:30", team1: "Роботех 2.0", team2: "Ростов-Волей 2", score: "", sets: "", competition: "Область", place: "Динамо" },

    { date: "Без даты", time: "—", team1: "Роботех 2.0", team2: "СШОР-5", score: "", sets: "", competition: "Город", place: "" },
  ];

  // ==========================================================
  // HELPERS
  // ==========================================================
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  function getSurname(fullName) {
    const parts = String(fullName || '').trim().split(' ');
    return parts[0] || String(fullName || '');
  }

  function sortPlayersBySurname(players) {
    return players.slice().sort((a, b) => {
      const sa = getSurname(a);
      const sb = getSurname(b);
      if (sa < sb) return -1;
      if (sa > sb) return 1;
      return a.localeCompare(b);
    });
  }

  const allPlayers = sortPlayersBySurname(rawAllPlayers);
  const playersRobotex = sortPlayersBySurname(rawPlayersRobotex);
  const playersRobotex2 = sortPlayersBySurname(rawPlayersRobotex2);

  const actionTranslations = {
    receive: 'Приём',
    attack: 'Атака',
    defense: 'Защита',
    block: 'Блок',
    serve: 'Подача'
  };

  const optionsMap = {
    receive: ['Качество','Ошибка','Пропуск'],
    attack: ['Очко','Ошибка','Пропуск'],
    defense: ['Качество','Ошибка','Пропуск'],
    block: ['Блок','Ошибка','Смягчение'],
    serve: ['Эйс','Ошибка','Парашут']
  };

  function showScreen(cls) {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const screens = ['main-menu','score-screen','stats-screen','history-screen','help-screen','schedule-screen','attendance-screen'];
    screens.forEach(c => {
      const el = document.querySelector('.' + c);
      if (!el) return;
      el.classList.toggle('hidden', c !== cls);
      el.classList.toggle('visible', c === cls);
      if (c === cls) el.scrollTop = 0;
      if (c === cls) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });
    $('#attendance-modal')?.classList.add('hidden');
    $('#player-swap-modal')?.classList.add('hidden');
  }

  // ==========================================================
  // NAVIGATION
  // ==========================================================
  $$('.back-button').forEach(btn => btn.addEventListener('click', () => showScreen('main-menu')));

  $('#start-score')?.addEventListener('click', () => showScreen('score-screen'));
  $('#match-stats')?.addEventListener('click', () => {
    showScreen('stats-screen');
    $('.match-info')?.classList.remove('hidden');
    $('.lineup-selection')?.classList.add('hidden');
    $('.stats-main')?.classList.add('hidden');
    $('.stats-review')?.classList.add('hidden');
  });
  $('#schedule')?.addEventListener('click', () => { showScreen('schedule-screen'); renderSchedule(); });
  $('#attendance')?.addEventListener('click', () => { showScreen('attendance-screen'); renderAttendance(); });
  $('#history')?.addEventListener('click', () => { showScreen('history-screen'); loadHistory(); });
  $('#help')?.addEventListener('click', () => showScreen('help-screen'));

  // ==========================================================
  // SCORE
  // ==========================================================
  let team1Score = 0, team2Score = 0, team1SetScore = 0, team2SetScore = 0;

  $('#start-match')?.addEventListener('click', () => {
    team1Name = $('#team1-name').value || 'Команда 1';
    team2Name = $('#team2-name').value || 'Команда 2';
    $('#team1-title').textContent = team1Name;
    $('#team2-title').textContent = team2Name;

    $('.team-inputs')?.classList.add('hidden');
    $('.score-board')?.classList.remove('hidden');

    $('#winner-message')?.classList.add('hidden');
    team1Score = team2Score = team1SetScore = team2SetScore = 0;
    updateScores();
  });

  function updateScores() {
    $('.team1 .score').textContent = team1Score;
    $('.team2 .score').textContent = team2Score;
    $('#team1-set-score').textContent = team1SetScore;
    $('#team2-set-score').textContent = team2SetScore;
  }

  $$('.score').forEach(el => {
    el.addEventListener('click', () => {
      el.dataset.team === '1' ? team1Score++ : team2Score++;
      checkSetWinner();
      updateScores();
    });
  });

  function checkSetWinner() {
    const isFifth = team1SetScore + team2SetScore === 4;
    const target = isFifth ? 15 : 25;
    if ((team1Score >= target || team2Score >= target) && Math.abs(team1Score - team2Score) >= 2) {
      team1Score > team2Score ? team1SetScore++ : team2SetScore++;
      team1Score = team2Score = 0;
      if (team1SetScore === 3 || team2SetScore === 3) {
        showWinner(team1SetScore === 3 ? team1Name : team2Name);
      }
    }
  }

  function showWinner(name) {
    $('#winner-message').textContent = `Победа ${name}!`;
    $('#winner-message')?.classList.remove('hidden');
  }

  // ==========================================================
  // STATS: START / LINEUP
  // ==========================================================
  $('#start-stats')?.addEventListener('click', () => {
    const date = $('#match-date').value;
    const opponent = $('#opponent').value;
    currentTeam = $('#team-select').value;

    if (!date || !opponent) return alert('Заполните дату и соперника');

    const matchID = (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(16).slice(2)}`);

    currentMatch = {
      matchID,
      date,
      opponent,
      team: currentTeam,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sets: {1:[],2:[],3:[],4:[],5:[]},
      events: [],
      playersByZone: {},
      lineup: []
    };

    selectedLineup = [];
    selectedPlayers = {};
    quickSelectedPlayer = null;
    quickSelectedAction = null;

    $('.match-info')?.classList.add('hidden');
    $('.lineup-selection')?.classList.remove('hidden');
    renderLineupSelection();
  });

  function renderLineupSelection() {
    const container = $('#lineup-players-list');
    container.innerHTML = '';

    const players = currentTeam === 'robotex' ? playersRobotex : playersRobotex2;

    players.forEach(player => {
      const div = document.createElement('div');
      div.className = 'player-item';
      div.textContent = player;
      div.addEventListener('click', () => togglePlayerSelection(player, div));
      container.appendChild(div);
    });

    updateSelectedCount();
    $('#confirm-lineup').disabled = true;
  }

  function togglePlayerSelection(player, element) {
    if (selectedLineup.includes(player)) {
      selectedLineup = selectedLineup.filter(p => p !== player);
      element.classList.remove('selected');
    } else {
      if (selectedLineup.length < 6) {
        selectedLineup.push(player);
        element.classList.add('selected');
      } else {
        alert('Можно выбрать только 6 игроков');
      }
    }
    updateSelectedCount();
    $('#confirm-lineup').disabled = selectedLineup.length !== 6;
  }

  function updateSelectedCount() {
    $('#selected-count').textContent = selectedLineup.length;
  }

  $('#confirm-lineup')?.addEventListener('click', () => {
    if (!currentMatch) return;

    currentMatch.lineup = [...selectedLineup];

    selectedPlayers = {};
    currentMatch.playersByZone = {};
    for (let i = 0; i < selectedLineup.length; i++) {
      const zone = String(i + 1);
      selectedPlayers[zone] = selectedLineup[i];
      currentMatch.playersByZone[zone] = selectedLineup[i];
      const el = $(`.zone-${zone}`);
      if (el) el.textContent = getSurname(selectedLineup[i]);
    }

    $('.lineup-selection')?.classList.add('hidden');
    $('.stats-main')?.classList.remove('hidden');

    currentSet = 1;
    $('#current-set') && ($('#current-set').textContent = '1');

    initQuickModeUI();
    renderEvents();
  });

  // ==========================================================
  // QUICK MODE UI
  // ==========================================================
  function initQuickModeUI() {
    const host = $('.stats-main');
    if (!host) return;

    host.classList.add('quick-mode');
    if (host.querySelector('.lux-shell')) return; // не плодим

    const shell = document.createElement('div');
    shell.className = 'lux-shell';

    const grid = document.createElement('div');
    grid.className = 'lux-grid';

    // TOP
    const top = document.createElement('div');
    top.className = 'lux-top';

    const topbar = document.createElement('div');
    topbar.className = 'lux-topbar';

    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = 'Партия';

    const pill = document.createElement('div');
    pill.className = 'pill';

    const setBtn = document.createElement('div');
    setBtn.className = 'set';
    setBtn.id = 'lux-set-btn';
    setBtn.textContent = String(currentSet);
    setBtn.addEventListener('click', () => $('#set-dropdown')?.classList.toggle('hidden'));

    const who = document.createElement('div');
    who.id = 'lux-who';
    who.textContent = quickSelectedPlayer ? getSurname(quickSelectedPlayer) : 'Игрок';

    pill.appendChild(setBtn);
    pill.appendChild(who);

    topbar.appendChild(title);
    topbar.appendChild(pill);
    top.appendChild(topbar);

    // ACTIONS
    const actions = document.createElement('div');
    actions.className = 'lux-actions';

    ['receive','attack','defense','block','serve'].forEach(action => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'lux-action action-btn';
      b.textContent = actionTranslations[action] || action;
      b.addEventListener('click', (e) => {
        e.preventDefault();
        quickSelectedAction = action;
        openResultSheet(action);
      });
      actions.appendChild(b);
    });

    // PLAYERS
    const playersWrap = document.createElement('div');
    playersWrap.className = 'lux-players';

    const playersGrid = document.createElement('div');
    playersGrid.className = 'lux-players-grid';

    selectedLineup.forEach(player => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'lux-player';
      b.textContent = getSurname(player);
      b.addEventListener('click', (e) => {
        e.preventDefault();
        quickSelectedPlayer = player;
        $('#lux-who') && ($('#lux-who').textContent = getSurname(player));
        Array.from(playersGrid.querySelectorAll('button')).forEach(x => x.classList.toggle('active', x === b));
      });
      playersGrid.appendChild(b);
    });

    // default first
    if (selectedLineup[0]) {
      quickSelectedPlayer = selectedLineup[0];
      $('#lux-who') && ($('#lux-who').textContent = getSurname(selectedLineup[0]));
      playersGrid.querySelector('button')?.classList.add('active');
    }

    playersWrap.appendChild(playersGrid);

    // swap button
    const swapBtn = document.createElement('button');
    swapBtn.type = 'button';
    swapBtn.className = 'lux-action secondary-btn';
    swapBtn.textContent = 'Замена игрока';
    swapBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openSwapModal();
    });
    playersWrap.appendChild(swapBtn);

    luxPlayersGridEl = playersGrid;

    // JOURNAL
    const journal = document.createElement('div');
    journal.className = 'lux-journal';

    const eventsPanel = $('.events-panel');
    if (eventsPanel) journal.appendChild(eventsPanel);

    // SAVE button (переносим существующую)
    const saveWrap = document.createElement('div');
    saveWrap.className = 'lux-save';
    const saveBtn = $('#save-stats');
    if (saveBtn) saveWrap.appendChild(saveBtn);

    grid.appendChild(top);
    grid.appendChild(actions);
    grid.appendChild(playersWrap);
    grid.appendChild(journal);
    grid.appendChild(saveWrap);

    shell.appendChild(grid);
    host.insertBefore(shell, host.firstChild);

    // undo handler
    // (делегирование ниже тоже есть, но пусть будет)
    $('#undo-last')?.addEventListener('click', () => undoLastEvent());

    // sync set display
    $$('.set-option').forEach(opt => {
      opt.addEventListener('click', () => {
        setBtn.textContent = String(currentSet);
      });
    });
  }

  // ==========================================================
  // PLAYER SWAP
  // ==========================================================
  function openSwapModal() {
    if (!currentMatch) return;
    const modal = $('#player-swap-modal');
    const list = $('#swap-players-list');
    const cur = $('#swap-current');

    if (!modal || !list || !cur) return alert('Модалка замены не найдена (проверь index.html)');

    const oldPlayer = quickSelectedPlayer || selectedLineup[0];
    if (!oldPlayer) return alert('Сначала выберите игрока для замены');

    cur.textContent = getSurname(oldPlayer);
    list.innerHTML = '';

    const pool = (currentTeam === 'robotex') ? playersRobotex : playersRobotex2;

    pool.filter(p => p !== oldPlayer).forEach(p => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'player-item';
      b.textContent = p;
      b.addEventListener('click', () => {
        applySwap(oldPlayer, p);
        closeSwapModal();
      });
      list.appendChild(b);
    });

    modal.classList.remove('hidden');
  }

  function closeSwapModal() {
    $('#player-swap-modal')?.classList.add('hidden');
  }

  $('#swap-cancel')?.addEventListener('click', () => closeSwapModal());

  function applySwap(oldPlayer, newPlayer) {
    const idx = selectedLineup.indexOf(oldPlayer);
    if (idx === -1) return;

    const idx2 = selectedLineup.indexOf(newPlayer);
    if (idx2 !== -1) {
      [selectedLineup[idx], selectedLineup[idx2]] = [selectedLineup[idx2], selectedLineup[idx]];
    } else {
      selectedLineup[idx] = newPlayer;
    }

    if (currentMatch) {
      currentMatch.lineup = [...selectedLineup];
      for (let i=0; i<6; i++){
        const zone = String(i+1);
        selectedPlayers[zone] = selectedLineup[i];
        currentMatch.playersByZone[zone] = selectedLineup[i];
      }
    }

    if (quickSelectedPlayer === oldPlayer) {
      quickSelectedPlayer = newPlayer;
      const who = $('#lux-who');
      if (who) who.textContent = getSurname(newPlayer);
    }

    if (luxPlayersGridEl) {
      luxPlayersGridEl.innerHTML = '';
      selectedLineup.forEach(player => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'lux-player';
        b.textContent = getSurname(player);
        b.addEventListener('click', (e) => {
          e.preventDefault();
          quickSelectedPlayer = player;
          $('#lux-who') && ($('#lux-who').textContent = getSurname(player));
          Array.from(luxPlayersGridEl.querySelectorAll('button')).forEach(x => x.classList.toggle('active', x === b));
        });
        if (player === quickSelectedPlayer) b.classList.add('active');
        luxPlayersGridEl.appendChild(b);
      });
    }
  }

  // ==========================================================
  // RESULTS SHEET + EVENTS
  // ==========================================================
  function openResultSheet(action) {
    if (!currentMatch) return;
    if (!quickSelectedPlayer) return alert('Сначала выберите игрока');

    const opts = optionsMap[action];
    if (!opts) return;

    const backdrop = document.createElement('div');
    backdrop.className = 'sheet-backdrop';
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) backdrop.remove();
    });

    const sheet = document.createElement('div');
    sheet.className = 'sheet';

    const h = document.createElement('h4');
    h.textContent = `${getSurname(quickSelectedPlayer)} • ${actionTranslations[action]}`;
    sheet.appendChild(h);

    const grid = document.createElement('div');
    grid.className = 'sheet-grid';

    opts.forEach(result => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = result;
      b.addEventListener('click', () => {
        addEvent(action, result);
        backdrop.remove();
      });
      grid.appendChild(b);
    });

    sheet.appendChild(grid);

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'sheet-close secondary';
    close.textContent = 'Закрыть';
    close.addEventListener('click', () => backdrop.remove());

    sheet.appendChild(close);
    backdrop.appendChild(sheet);
    document.body.appendChild(backdrop);
  }

  function addEvent(action, result) {
    if (!currentMatch) return;

    const ev = {
      id: crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      set: currentSet,
      player: quickSelectedPlayer,
      action,
      result,
      ts: new Date().toISOString()
    };

    currentMatch.events.push(ev);
    currentMatch.sets[currentSet].push({ set: currentSet, player: ev.player, action: ev.action, result: ev.result });

    currentMatch.updatedAt = new Date().toISOString();
    renderEvents();
  }

  function renderEvents() {
    const list = $('#events-list');
    const undoBtn = $('#undo-last');
    if (!list || !currentMatch) return;

    const events = currentMatch.events || [];
    list.innerHTML = '';

    if (events.length === 0) {
      list.innerHTML = `<div style="opacity:.75;padding:10px;">Пока нет событий<br><span style="opacity:.6;font-size:12px;">Начните фиксировать касания</span></div>`;
      if (undoBtn) undoBtn.disabled = true;
      return;
    }

    const ordered = events.slice().reverse();

    ordered.forEach(ev => {
      const row = document.createElement('div');
      row.className = 'event-row';

      const left = document.createElement('div');
      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = `${getSurname(ev.player)} • ${actionTranslations[ev.action] || ev.action} • ${ev.result}`;
      const sub = document.createElement('div');
      sub.className = 'sub';
      sub.textContent = `Партия ${ev.set}`;
      left.appendChild(meta);
      left.appendChild(sub);

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'del';
      del.textContent = 'Удалить';
      del.addEventListener('click', () => deleteEvent(ev.id));

      row.appendChild(left);
      row.appendChild(del);
      list.appendChild(row);
    });

    if (undoBtn) undoBtn.disabled = false;
  }

  function deleteEvent(eventId) {
    if (!currentMatch) return;
    const idx = currentMatch.events.findIndex(e => e.id === eventId);
    if (idx === -1) return;

    const ev = currentMatch.events[idx];
    currentMatch.events.splice(idx, 1);

    const arr = currentMatch.sets[ev.set] || [];
    const idx2 = arr.findIndex(a => a.player === ev.player && a.action === ev.action && a.result === ev.result);
    if (idx2 !== -1) arr.splice(idx2, 1);

    currentMatch.updatedAt = new Date().toISOString();
    renderEvents();
  }

  function undoLastEvent() {
    if (!currentMatch || !currentMatch.events || currentMatch.events.length === 0) return;
    const ev = currentMatch.events[currentMatch.events.length - 1];
    deleteEvent(ev.id);
  }

  // партия
  $('#current-set')?.addEventListener('click', () => $('#set-dropdown')?.classList.toggle('hidden'));
  $$('.set-option').forEach(opt => opt.addEventListener('click', () => {
    currentSet = Number(opt.dataset.set);
    $('#current-set').textContent = String(currentSet);
    $('#set-dropdown')?.classList.add('hidden');
    // обновим pill если есть
    const luxSet = $('#lux-set-btn');
    if (luxSet) luxSet.textContent = String(currentSet);
  }));

  // ==========================================================
  // SAVE + REVIEW + HISTORY
  // ==========================================================
  function saveMatchToHistory(match) {
    const history = JSON.parse(localStorage.getItem('matchHistory') || '[]');
    history.push(match);
    localStorage.setItem('matchHistory', JSON.stringify(history));
  }

  function generateExcel(match) {
    const data = [["Партия","Игрок","Действие","Результат"]];
    for (let s = 1; s <= 5; s++) {
      (match.sets[s] || []).forEach(e => data.push([s, e.player, e.action, e.result]));
    }
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Статистика");
    XLSX.writeFile(wb, `статистика_${match.date}_${match.opponent}.xlsx`);
  }

  // ✅ ГЛАВНЫЙ ФИКС: делегирование кликов (кнопка сохранения точно работает)
  document.addEventListener('click', (e) => {
    const t = e.target;

    if (t && t.id === 'save-stats') {
      e.preventDefault();
      if (!currentMatch) return;

      if ((currentMatch.lineup || []).length !== 6) {
        alert('Состав не выбран (нужно 6 игроков).');
        return;
      }

      saveMatchToHistory(currentMatch);
      showReviewScreen(currentMatch);
      return;
    }

    if (t && t.id === 'download-excel') {
      e.preventDefault();
      if (!currentMatch) return alert('Нет данных для экспорта');
      generateExcel(currentMatch);
      return;
    }

    if (t && t.id === 'undo-last') {
      e.preventDefault();
      undoLastEvent();
      return;
    }
  });

  function showReviewScreen(match) {
    $('.stats-main')?.classList.add('hidden');
    $('.stats-review')?.classList.remove('hidden');

    $('#review-match-info').textContent =
      `${match.date} — (${match.team === 'robotex' ? 'РОБОТЕХ' : 'РОБОТЕХ 2.0'}) vs (${match.opponent})`;

    const playerStats = {};
    const setStats = {1:{},2:{},3:{},4:{},5:{}};

    const playersSet = new Set();
    for (let s=1; s<=5; s++){
      (match.sets[s]||[]).forEach(a => playersSet.add(a.player));
    }

    playersSet.forEach(p => {
      playerStats[p] = {
        pointsBySet: {1:0,2:0,3:0,4:0,5:0},
        totalPoints: 0,
        totalErrors: 0,
        serves: { total:0, aces:0, errors:0 },
        receives: { total:0, errors:0, positive:0, excellent:0 },
        attacks: { total:0, points:0, errors:0 },
        blocks: 0
      };
    });

    for (let s=1; s<=5; s++){
      const actions = match.sets[s] || [];
      actions.forEach(a => {
        const ps = playerStats[a.player] || (playerStats[a.player] = {
          pointsBySet: {1:0,2:0,3:0,4:0,5:0},
          totalPoints: 0,
          totalErrors: 0,
          serves: { total:0, aces:0, errors:0 },
          receives: { total:0, errors:0, positive:0, excellent:0 },
          attacks: { total:0, points:0, errors:0 },
          blocks: 0
        });

        if (a.action === 'attack' && a.result === 'Очко') ps.pointsBySet[s]++;
        if (a.action === 'serve'  && a.result === 'Эйс') ps.pointsBySet[s]++;
        if (a.action === 'block'  && a.result === 'Блок') ps.pointsBySet[s]++;

        if (a.result === 'Очко' || a.result === 'Эйс' || a.result === 'Блок') ps.totalPoints++;
        if (a.result === 'Ошибка') ps.totalErrors++;

        if (a.action === 'serve') {
          ps.serves.total++;
          if (a.result === 'Эйс') ps.serves.aces++;
          if (a.result === 'Ошибка') ps.serves.errors++;
        }
        if (a.action === 'receive') {
          ps.receives.total++;
          if (a.result === 'Ошибка') ps.receives.errors++;
          if (a.result === 'Качество' || a.result === 'Пропуск') ps.receives.positive++;
          if (a.result === 'Качество') ps.receives.excellent++;
        }
        if (a.action === 'attack') {
          ps.attacks.total++;
          if (a.result === 'Очко') ps.attacks.points++;
          if (a.result === 'Ошибка') ps.attacks.errors++;
        }
        if (a.action === 'block' && a.result === 'Блок') ps.blocks++;
      });
    }

    for (let s=1; s<=5; s++){
      setStats[s] = {
        points: { serve:0, attack:0, block:0 },
        serves: { total:0, errors:0, points:0 },
        receives: { total:0, errors:0, positive:0, excellent:0 },
        attacks: { total:0, errors:0, points:0 },
        blocks: 0
      };
      (match.sets[s]||[]).forEach(a => {
        const ss = setStats[s];
        if (a.action === 'serve' && a.result === 'Эйс') ss.points.serve++;
        if (a.action === 'attack' && a.result === 'Очко') ss.points.attack++;
        if (a.action === 'block' && a.result === 'Блок') ss.points.block++;

        if (a.action === 'serve') {
          ss.serves.total++;
          if (a.result === 'Ошибка') ss.serves.errors++;
          if (a.result === 'Эйс') ss.serves.points++;
        }
        if (a.action === 'receive') {
          ss.receives.total++;
          if (a.result === 'Ошибка') ss.receives.errors++;
          if (a.result === 'Качество' || a.result === 'Пропуск') ss.receives.positive++;
          if (a.result === 'Качество') ss.receives.excellent++;
        }
        if (a.action === 'attack') {
          ss.attacks.total++;
          if (a.result === 'Ошибка') ss.attacks.errors++;
          if (a.result === 'Очко') ss.attacks.points++;
        }
        if (a.action === 'block' && a.result === 'Блок') ss.blocks++;
      });
    }

    let html = '';

    html += '<h4>Статистика по игрокам</h4>';
    html += '<div style="overflow:auto;border-radius:18px;border:1px solid rgba(255,255,255,0.06)">';
    html += '<table class="review-table">';
    html += '<tr><th rowspan="2">Игрок</th><th colspan="5">Партия</th><th colspan="2">Очки</th><th colspan="3">Подача</th><th colspan="4">Приём</th><th colspan="5">Атака</th><th colspan="1">Блок</th></tr>';
    html += '<tr>';
    for (let i=1;i<=5;i++) html += `<th class="${i===5?'group-end':''}">${i}</th>`;
    html += '<th>Все</th><th class="group-end">Н-П</th>';
    html += '<th>Все</th><th>Эйс</th><th class="group-end">Ош</th>';
    html += '<th>Все</th><th>Ош</th><th>Пзт%</th><th class="group-end">Отл%</th>';
    html += '<th>Все</th><th>Очки</th><th>Ош</th><th>Отл%</th><th class="group-end">%ош</th>';
    html += '<th>Очки</th>';
    html += '</tr>';

    Object.entries(playerStats).forEach(([player, st]) => {
      html += '<tr>';
      html += `<td>${getSurname(player)}</td>`;
      for (let i=1;i<=5;i++) html += `<td class="${i===5?'group-end':''}">${st.pointsBySet[i]||0}</td>`;

      const netPoints = st.totalPoints - st.totalErrors;
      const cls = netPoints < 0 ? 'negative-points' : (netPoints > 0 ? 'positive-points' : '');
      html += `<td>${st.totalPoints}</td>`;
      html += `<td class="${cls} group-end">${netPoints}</td>`;

      html += `<td>${st.serves.total}</td><td>${st.serves.aces}</td><td class="group-end">${st.serves.errors}</td>`;

      const pzt = st.receives.total ? Math.round(st.receives.positive/st.receives.total*100) : 0;
      const otl = st.receives.total ? Math.round(st.receives.excellent/st.receives.total*100) : 0;
      html += `<td>${st.receives.total}</td><td>${st.receives.errors}</td><td>${pzt}%</td><td class="group-end">${otl}%</td>`;

      const attOtl = st.attacks.total ? Math.round(st.attacks.points/st.attacks.total*100) : 0;
      const attErr = st.attacks.total ? Math.round(st.attacks.errors/st.attacks.total*100) : 0;
      html += `<td>${st.attacks.total}</td><td>${st.attacks.points}</td><td>${st.attacks.errors}</td><td>${attOtl}%</td><td class="group-end">${attErr}%</td>`;

      html += `<td>${st.blocks}</td>`;
      html += '</tr>';
    });

    html += '</table></div>';

    html += '<h4 style="margin-top:14px;">Статистика по партиям</h4>';
    html += '<div style="overflow:auto;border-radius:18px;border:1px solid rgba(255,255,255,0.06)">';
    html += '<table class="review-table">';
    html += '<tr><th rowspan="2">Партия</th><th colspan="3">Очки</th><th colspan="3">Подача</th><th colspan="4">Приём</th><th colspan="4">Атака</th><th>Блок</th></tr>';
    html += '<tr>';
    html += '<th>На под</th><th>В ат</th><th class="group-end">На бл</th>';
    html += '<th>Все</th><th>Ош</th><th class="group-end">Очки</th>';
    html += '<th>Все</th><th>Ош</th><th>Пзт%</th><th class="group-end">Отл%</th>';
    html += '<th>Все</th><th>Ош</th><th>Очки</th><th class="group-end">Отл%</th>';
    html += '<th>Очки</th></tr>';

    for (let s=1;s<=5;s++){
      const ss = setStats[s];
      if (!ss) continue;
      if (ss.serves.total===0 && ss.receives.total===0 && ss.attacks.total===0 && ss.blocks===0) continue;

      const pztSet = ss.receives.total ? Math.round(ss.receives.positive/ss.receives.total*100) : 0;
      const otlSet = ss.receives.total ? Math.round(ss.receives.excellent/ss.receives.total*100) : 0;
      const attOtlSet = ss.attacks.total ? Math.round(ss.attacks.points/ss.attacks.total*100) : 0;

      html += `<tr><td>${s}</td>`;
      html += `<td>${ss.points.serve}</td><td>${ss.points.attack}</td><td class="group-end">${ss.points.block}</td>`;
      html += `<td>${ss.serves.total}</td><td>${ss.serves.errors}</td><td class="group-end">${ss.serves.points}</td>`;
      html += `<td>${ss.receives.total}</td><td>${ss.receives.errors}</td><td>${pztSet}%</td><td class="group-end">${otlSet}%</td>`;
      html += `<td>${ss.attacks.total}</td><td>${ss.attacks.errors}</td><td>${ss.attacks.points}</td><td class="group-end">${attOtlSet}%</td>`;
      html += `<td>${ss.blocks}</td></tr>`;
    }

    html += '</table></div>';

    html += `
      <div class="legend">
        <strong>Легенда:</strong><br>
        <strong>Очки</strong> — сумма (Эйс + Очко в атаке + Очко блоком).<br>
        <strong>Н-П</strong> — (Очки − Ошибки).<br>
        <strong>Ош</strong> — результат «Ошибка».<br>
        <strong>Пзт%</strong> — позитивный приём (Качество + Пропуск) / Все × 100.<br>
        <strong>Отл%</strong> — отличный приём (Качество) / Все × 100.<br>
        <strong>%ош</strong> — Ошибки / Все × 100 (для атаки).<br>
      </div>
    `;

    $('#review-content').innerHTML = html;
  }

  $('#edit-match-btn')?.addEventListener('click', () => {
    if (!currentMatch) return;

    $('.stats-review')?.classList.add('hidden');
    $('.stats-main')?.classList.remove('hidden');
    currentSet = 1;
    quickSelectedPlayer = (currentMatch.lineup && currentMatch.lineup[0]) ? currentMatch.lineup[0] : null;
    selectedLineup = currentMatch.lineup || selectedLineup;

    if (!currentMatch.playersByZone || Object.keys(currentMatch.playersByZone).length === 0) {
      currentMatch.playersByZone = {};
      for (let i=0;i<6;i++){
        const zone = String(i+1);
        currentMatch.playersByZone[zone] = selectedLineup[i] || '';
      }
    }
    selectedPlayers = { ...currentMatch.playersByZone };

    initQuickModeUI();
    renderEvents();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  $('#new-match-btn')?.addEventListener('click', () => {
    $('.stats-review')?.classList.add('hidden');
    $('.match-info')?.classList.remove('hidden');
    $('#match-date').value = '';
    $('#opponent').value = '';
    $('#team-select').value = 'robotex';
  });

  function loadHistory() {
    const list = $('#history-list');
    if (!list) return;
    list.innerHTML = '';
    const history = JSON.parse(localStorage.getItem('matchHistory') || '[]');

    history.forEach((match, index) => {
      const div = document.createElement('div');
      div.className = 'player-item';
      div.style.cursor = 'pointer';
      div.innerHTML = `${match.date} — ${match.opponent} <span style="opacity:.65;font-weight:600;">(${match.matchID ? 'ID есть' : 'без ID'})</span> <button data-index="${index}" style="margin-left:10px;">Удалить</button>`;

      div.querySelector('button').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteMatch(index);
      });

      div.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') return;

        currentMatch = match;
        currentSet = 1;
        selectedLineup = match.lineup || [];
        selectedPlayers = match.playersByZone ? { ...match.playersByZone } : {};
        quickSelectedPlayer = null;

        showScreen('stats-screen');
        $('.match-info')?.classList.add('hidden');
        $('.lineup-selection')?.classList.add('hidden');
        $('.stats-main')?.classList.add('hidden');
        $('.stats-review')?.classList.remove('hidden');

        showReviewScreen(match);
      });

      list.appendChild(div);
    });
  }

  function deleteMatch(index) {
    const history = JSON.parse(localStorage.getItem('matchHistory') || '[]');
    history.splice(index, 1);
    localStorage.setItem('matchHistory', JSON.stringify(history));
    loadHistory();
  }

  // ==========================================================
  // SCHEDULE + FILTER + BEAUTIFY
  // ==========================================================
  function parseDate(dateStr) {
    if (!dateStr || dateStr.trim() === '' || dateStr === 'Без даты') return null;
    let clean = dateStr.replace(/\s*\([^)]*\)/, '').trim();
    let parts = clean.split('.');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return null;
  }

  function formatScoreForTeam(score, isOurTeamFirst) {
    if (!score || score.trim() === '') return score;
    const parts = score.split(':');
    if (parts.length === 2) return isOurTeamFirst ? score : `${parts[1]}:${parts[0]}`;
    return score;
  }

  function getTeamFilterValue() {
    return ($('#schedule-team-filter')?.value || 'both');
  }

  function renderSchedule() {
    const ourTeams = ['Роботех', 'Роботех 2.0'];
    const todayStr = new Date().toISOString().slice(0,10);
    const filter = getTeamFilterValue();

    const teamData = {
      'Роботех': { upcoming: [], past: [] },
      'Роботех 2.0': { upcoming: [], past: [] }
    };

    matchesData.forEach(m => {
      ourTeams.forEach(team => {
        if (m.team1 === team || m.team2 === team) {
          const dateParsed = parseDate(m.date);
          const isPast = dateParsed && dateParsed <= todayStr && m.score && m.score.trim() !== '';
          const isOurTeamFirst = (m.team1 === team);

          const matchInfo = {
            date: m.date || 'Дата не указана',
            time: m.time || '—',
            opponent: m.team1 === team ? m.team2 : m.team1,
            score: m.score || '—',
            isOurTeamFirst,
            competition: m.competition || '',
            place: m.place || ''
          };

          if (isPast) teamData[team].past.push(matchInfo);
          else teamData[team].upcoming.push(matchInfo);
        }
      });
    });

    ourTeams.forEach(team => {
      teamData[team].upcoming.sort((a,b) => (parseDate(a.date)||'9999-99-99').localeCompare(parseDate(b.date)||'9999-99-99'));
      teamData[team].past.sort((a,b) => (parseDate(b.date)||'0000-00-00').localeCompare(parseDate(a.date)||'0000-00-00'));
    });

    function badge(comp){
      if (!comp) return '';
      const cls = comp === 'Область' ? 'badge-oblast' : 'badge-city';
      return `<span class="badge ${cls}">${comp}</span>`;
    }

    let html = '<div class="schedule-container">';

    function col(team){
      if (filter === 'robotex' && team !== 'Роботех') return '';
      if (filter === 'robotex2' && team !== 'Роботех 2.0') return '';

      let out = `<div class="schedule-column"><h3>${team}</h3>`;

      out += '<div class="schedule-subsection"><h4>Предстоящие</h4>';
      if (teamData[team].upcoming.length === 0) out += '<p style="opacity:.75;">Нет предстоящих матчей</p>';
      else{
        out += `
          <table class="schedule-table schedule-table--pretty">
            <tr>
              <th>Дата</th><th>Время</th><th>Соперник</th><th>Тип</th><th>Место</th>
            </tr>`;
        teamData[team].upcoming.forEach(m => {
          out += `
            <tr>
              <td>${m.date}</td>
              <td>${m.time}</td>
              <td class="td-strong">${m.opponent}</td>
              <td>${badge(m.competition)}</td>
              <td>${m.place || '—'}</td>
            </tr>`;
        });
        out += '</table>';
      }
      out += '</div>';

      out += '<div class="schedule-subsection" style="margin-top:12px;"><h4>Прошедшие</h4>';
      if (teamData[team].past.length === 0) out += '<p style="opacity:.75;">Нет прошедших матчей</p>';
      else{
        out += `
          <table class="schedule-table schedule-table--pretty">
            <tr>
              <th>Дата</th><th>Время</th><th>Соперник</th><th>Счёт</th>
            </tr>`;
        teamData[team].past.forEach(m => {
          out += `
            <tr>
              <td>${m.date}</td>
              <td>${m.time}</td>
              <td class="td-strong">${m.opponent}</td>
              <td class="td-score">${formatScoreForTeam(m.score, m.isOurTeamFirst)}</td>
            </tr>`;
        });
        out += '</table>';
      }
      out += '</div></div>';
      return out;
    }

    html += col('Роботех');
    html += col('Роботех 2.0');

    html += '</div>';
    $('#schedule-content').innerHTML = html;
  }

  $('#schedule-team-filter')?.addEventListener('change', () => renderSchedule());

  // ==========================================================
  // ATTENDANCE (по месяцам)
  // ==========================================================
  function getAttendanceKey(dateStr) { return `attendance_${dateStr}`; }
  function saveAttendanceForDate(dateStr, presentPlayers) {
    localStorage.setItem(getAttendanceKey(dateStr), JSON.stringify(presentPlayers));
  }
  function loadAttendanceForDate(dateStr) {
    const data = localStorage.getItem(getAttendanceKey(dateStr));
    return data ? JSON.parse(data) : [];
  }

  // ✅ календарь 2026 по Пт/Вс (как было), но теперь удобно по месяцам
  const TRAINING_START_DATE = '2026-02-01';
  const TRAINING_END_DATE   = '2026-12-31';

  function fmtDDMMYYYY(d){
    const dd = String(d.getDate()).padStart(2,'0');
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  }
  function convertDisplayDateToStorage(displayDate) {
    const parts = displayDate.split('.');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  function getAllTrainingDatesFull() {
    const dates = [];
    let current = new Date(TRAINING_START_DATE);
    const end = new Date(TRAINING_END_DATE);

    while (current <= end) {
      const day = current.getDay();
      if (day === 5 || day === 0) dates.push(fmtDDMMYYYY(current)); // Пт/Вс
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  function monthTitleRu(year, monthIdx){
    const months = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
    return `${months[monthIdx]} ${year}`;
  }

  // состояние текущего месяца в посещаемости (по умолчанию: месяц текущей даты, но в 2026)
  let attYear = 2026;
  let attMonthIdx = 1; // Февраль (0=янв)

  // если сегодня 2026 — ставим текущий месяц, иначе остаётся февраль
  (function initAttendanceMonth(){
    const now = new Date();
    if (now.getFullYear() === 2026) attMonthIdx = now.getMonth();
    updateAttendanceMonthTitle();
  })();

  function updateAttendanceMonthTitle(){
    const titleEl = $('#att-month-title');
    if (titleEl) titleEl.textContent = monthTitleRu(attYear, attMonthIdx);
  }

  function getTrainingDatesForMonth(year, monthIdx){
    const all = getAllTrainingDatesFull();
    return all.filter(d => {
      const [dd,mm,yyyy] = d.split('.');
      return Number(yyyy) === year && (Number(mm)-1) === monthIdx;
    });
  }

  function renderAttendance() {
    const container = $('#attendance-content');
    if (!container) return;

    updateAttendanceMonthTitle();

    attendanceDisplayedDates = getTrainingDatesForMonth(attYear, attMonthIdx);

    let html = '<div style="overflow:auto;border-radius:18px;border:1px solid rgba(255,255,255,0.06)">';
    html += '<table class="attendance-table"><tr><th>Игрок</th>';
    attendanceDisplayedDates.forEach(date => html += `<th>${date}</th>`);
    html += '</tr>';

    allPlayers.forEach(player => {
      const surname = getSurname(player);
      html += '<tr>';
      html += `<td>${surname}</td>`;
      attendanceDisplayedDates.forEach(date => {
        const storageDate = convertDisplayDateToStorage(date);
        const presentList = loadAttendanceForDate(storageDate);
        const isPresent = presentList.includes(player);
        const className = isPresent ? 'present' : 'absent';
        const symbol = isPresent ? '✅' : '❌';
        html += `<td class="${className}">${symbol}</td>`;
      });
      html += '</tr>';
    });

    html += '</table></div>';
    container.innerHTML = html;
  }

  $('#att-prev-month')?.addEventListener('click', () => {
    attMonthIdx -= 1;
    if (attMonthIdx < 0) { attMonthIdx = 11; attYear -= 1; }
    // ограничим 2026 (чтобы не улетать)
    if (attYear < 2026) { attYear = 2026; attMonthIdx = 0; }
    renderAttendance();
  });

  $('#att-next-month')?.addEventListener('click', () => {
    attMonthIdx += 1;
    if (attMonthIdx > 11) { attMonthIdx = 0; attYear += 1; }
    if (attYear > 2026) { attYear = 2026; attMonthIdx = 11; }
    renderAttendance();
  });

  function openAttendanceModal(mode) {
    const modal = $('#attendance-modal');
    const title = $('#modal-title');
    const dateSelectorDiv = $('#modal-date-selector');
    const playersDiv = $('#modal-players-list');
    if (!modal || !title || !dateSelectorDiv || !playersDiv) return;

    // ✅ теперь даты не “последние 10”, а текущий выбранный месяц
    const dates = attendanceDisplayedDates && attendanceDisplayedDates.length
      ? attendanceDisplayedDates.slice()
      : getTrainingDatesForMonth(attYear, attMonthIdx);

    if (dates.length === 0) {
      alert('Нет доступных дат в этом месяце');
      return;
    }

    function isFilled(d){
      return loadAttendanceForDate(convertDisplayDateToStorage(d)).length > 0;
    }

    let availableDates = [];
    if (mode === 'fill') {
      availableDates = dates.filter(d => !isFilled(d));
      if (availableDates.length === 0) {
        alert('В этом месяце нет незаполненных тренировок.');
        return;
      }
      title.textContent = 'Выберите дату и отметьте присутствующих';
    } else {
      availableDates = dates.filter(d => isFilled(d));
      if (availableDates.length === 0) {
        alert('В этом месяце нет заполненных тренировок.');
        return;
      }
      title.textContent = 'Выберите дату для изменения';
    }

    dateSelectorDiv.innerHTML = '<select id="modal-date-select"></select>';
    const select = $('#modal-date-select');
    availableDates.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = d;
      select.appendChild(opt);
    });

    function renderPlayerListForDate(displayDate, selectedPlayersArray) {
      playersDiv.innerHTML = '';
      allPlayers.forEach(player => {
        const div = document.createElement('div');
        div.className = 'modal-player-item';
        div.textContent = player;
        if (selectedPlayersArray.includes(player)) div.classList.add('selected');
        div.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          div.classList.toggle('selected');
        });
        playersDiv.appendChild(div);
      });
      $('#modal-done').dataset.date = displayDate;
    }

    select.addEventListener('change', () => {
      const storageDate = convertDisplayDateToStorage(select.value);
      const present = loadAttendanceForDate(storageDate);
      renderPlayerListForDate(select.value, present);
    });

    const firstDate = select.value;
    const storageDate = convertDisplayDateToStorage(firstDate);
    const present = loadAttendanceForDate(storageDate);
    renderPlayerListForDate(firstDate, present);

    modal.classList.remove('hidden');
  }

  $('#fill-attendance')?.addEventListener('click', () => openAttendanceModal('fill'));
  $('#edit-attendance')?.addEventListener('click', () => openAttendanceModal('edit'));

  $('#modal-done')?.addEventListener('click', () => {
    const displayDate = $('#modal-done').dataset.date;
    if (!displayDate) return alert('Сначала выберите дату');

    const storageDate = convertDisplayDateToStorage(displayDate);
    const selectedItems = $$('#modal-players-list .modal-player-item.selected');
    const presentPlayers = Array.from(selectedItems).map(el => el.textContent);

    saveAttendanceForDate(storageDate, presentPlayers);
    $('#attendance-modal')?.classList.add('hidden');
    renderAttendance();
  });

  $('#modal-cancel')?.addEventListener('click', () => $('#attendance-modal')?.classList.add('hidden'));

  // ==========================================================
  // CLOUD SYNC (без изменений)
  // ==========================================================
  async function uploadMatches() {
    const localMatches = JSON.parse(localStorage.getItem('matchHistory') || '[]');
    if (localMatches.length === 0) {
      alert('Нет локальных матчей для отправки');
      return;
    }

    let sent = 0;
    let failed = 0;

    for (const match of localMatches) {
      try {
        const response = await fetch('/.netlify/functions/save-match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(match)
        });
        const result = await response.json().catch(() => ({}));
        if (result && result.success) sent++;
        else failed++;
      } catch (e) {
        console.error('Ошибка отправки матча:', e);
        failed++;
      }
    }
    alert(`Матчи: отправлено ${sent}, ошибок ${failed}`);
  }

  async function downloadMatches() {
    if (!confirm('Все локальные матчи будут заменены облачными. Продолжить?')) return;
    try {
      const response = await fetch('/.netlify/functions/get-matches');
      if (!response.ok) throw new Error('Ошибка загрузки');
      const cloudMatches = await response.json();

      const matchesToSave = cloudMatches.map(m => {
        const { id, created_at, updated_at, ...rest } = m;
        return rest;
      });

      localStorage.setItem('matchHistory', JSON.stringify(matchesToSave));
      alert('Матчи успешно загружены из облака');
      if (!document.querySelector('.history-screen')?.classList.contains('hidden')) loadHistory();
    } catch (e) {
      console.error('Ошибка загрузки матчей:', e);
      alert('Не удалось загрузить матчи (проверь, что открываешь сайт НЕ через file://)');
    }
  }

  async function uploadAttendance() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('attendance_'));
    if (keys.length === 0) {
      alert('Нет локальных записей посещаемости');
      return;
    }

    let sent = 0;
    let failed = 0;

    for (const key of keys) {
      const date = key.replace('attendance_', '');
      const present = JSON.parse(localStorage.getItem(key) || '[]');
      try {
        const response = await fetch('/.netlify/functions/save-attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, present })
        });
        const result = await response.json().catch(() => ({}));
        if (result && result.success) sent++;
        else failed++;
      } catch (e) {
        console.error('Ошибка отправки посещаемости:', e);
        failed++;
      }
    }
    alert(`Посещаемость: отправлено ${sent}, ошибок ${failed}`);
  }

  async function downloadAttendance() {
    if (!confirm('Все локальные записи посещаемости будут заменены облачными. Продолжить?')) return;
    try {
      const response = await fetch('/.netlify/functions/get-attendance');
      if (!response.ok) throw new Error('Ошибка загрузки');
      const records = await response.json();

      const keys = Object.keys(localStorage).filter(k => k.startsWith('attendance_'));
      keys.forEach(k => localStorage.removeItem(k));

      records.forEach(rec => {
        const storageKey = `attendance_${rec.date}`;
        localStorage.setItem(storageKey, JSON.stringify(rec.present));
      });

      alert('Посещаемость успешно загружена из облака');
      if (!document.querySelector('.attendance-screen')?.classList.contains('hidden')) renderAttendance();
    } catch (e) {
      console.error('Ошибка загрузки посещаемости:', e);
      alert('Не удалось загрузить посещаемость (проверь, что открываешь сайт НЕ через file://)');
    }
  }

  $('#sync-upload')?.addEventListener('click', async () => {
    await uploadMatches();
    await uploadAttendance();
  });

  $('#sync-download')?.addEventListener('click', async () => {
    await downloadMatches();
    await downloadAttendance();
  });

  console.log('✅ Скрипт полностью загружен, обработчики привязаны');
});