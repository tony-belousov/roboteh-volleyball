document.addEventListener('DOMContentLoaded', () => {
    console.log('🔥 DOMContentLoaded – скрипт запущен');

    let team1Name = 'Команда 1';
    let team2Name = 'Команда 2';
    let currentTeam = 'robotex';
    let selectedPlayers = {};
    let selectedLineup = [];
    let currentMatch = null;
    let currentSet = 1;

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

    const matchesData = [
        { date: "05.10.2025", time: "10:00", team1: "Роботех", team2: "Роботех 2.0", score: "3:0", sets: "25:15, 27:25, 25:12" },
        { date: "25.10.2025", time: "11:50", team1: "Таганрог", team2: "Роботех 2.0", score: "3:0", sets: "25:12, 25:22, 25:15" },
        { date: "25.10.2025", time: "13:40", team1: "ЮФУ-Таганрог", team2: "Роботех", score: "0:3", sets: "15:25, 18:25, 23:25" },
        { date: "29.11.2025", time: "13:40", team1: "Роботех 2.0", team2: "Бонум", score: "3:1", sets: "25:20, 19:25, 25:15, 25:19" },
        { date: "29.11.2025", time: "15:30", team1: "Роботех", team2: "Луч Азов", score: "3:0", sets: "25:18, 25:18, 25:17" },
        { date: "17.01.2026", time: "11:50", team1: "Роботех", team2: "Таганрог", score: "3:1", sets: "23:25, 25:14, 25:20, 25:17" },
        { date: "17.01.2026", time: "19:10", team1: "РГУПС", team2: "Роботех 2.0", score: "1:3", sets: "18:25, 25:21, 24:26, 22:25" },
        { date: "24.01.2026", time: "19:10", team1: "Бонум", team2: "Роботех", score: "0:3", sets: "9:25, 16:25, 23:25" },
        { date: "01.02.2026", time: "19:30", team1: "Азия", team2: "Роботех 2.0", score: "2:3", sets: "25:20, 26:28, 21:25, 25:14, 9:15" },
        { date: "14.02.2026", time: "19:10", team1: "Азия", team2: "Роботех", score: "0:3", sets: "21:25, 22:25, 8:25" },
        { date: "15.02.2026", time: "19:30", team1: "Ростов-Дон", team2: "Роботех 2.0", score: "3:0", sets: "25:20, 25:20, 25:13" },
        { date: "22.02.2026", time: "18:00", team1: "Роботех", team2: "Феникс", score: "3:0", sets: "25:9, 25:18, 25:18" },
        { date: "07.03.2026", time: "17:20", team1: "Ростов-Дон", team2: "Роботех", score: "", sets: "" },
        { date: "07.03.2026", time: "19:10", team1: "ПСП", team2: "Роботех 2.0", score: "", sets: "" },
        { date: "15.03.2026 (Сув)", time: "19:10", team1: "Роботех", team2: "РГУПС", score: "", sets: "" },
        { date: "22.03.2026", time: "17:20", team1: "Луч Азов", team2: "Роботех 2.0", score: "", sets: "" },
        { date: "22.03.2026", time: "19:10", team1: "СШОР-5", team2: "Роботех", score: "", sets: "" },
        { date: "28.03.2026", time: "15:30", team1: "Роботех 2.0", team2: "ЮФУ-Таганрог", score: "", sets: "" },
        { date: "29.03.2026", time: "19:10", team1: "Роботех", team2: "ПСП", score: "", sets: "" },
        { date: "29.03.2026 (Сув)", time: "19:10", team1: "Роботех 2.0", team2: "Феникс", score: "", sets: "" },
        { date: "", time: "", team1: "Роботех 2.0", team2: "СШОР-5", score: "", sets: "" }
    ];

    function getSurname(fullName) {
        let parts = fullName.trim().split(' ');
        return parts.length > 0 ? parts[0] : fullName;
    }

    function sortPlayersBySurname(players) {
        return players.slice().sort((a, b) => {
            const surnameA = getSurname(a);
            const surnameB = getSurname(b);
            if (surnameA < surnameB) return -1;
            if (surnameA > surnameB) return 1;
            return a.localeCompare(b);
        });
    }

    const allPlayers = sortPlayersBySurname(rawAllPlayers);
    const playersRobotex = sortPlayersBySurname(rawPlayersRobotex);
    const playersRobotex2 = sortPlayersBySurname(rawPlayersRobotex2);

    const actionTranslations = {
        receive: 'Прием',
        attack: 'Атака',
        defense: 'Защита',
        block: 'Блок',
        serve: 'Подача'
    };

    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);

    function showScreen(cls) {
        $$('.main-menu,.score-screen,.stats-screen,.history-screen,.help-screen,.schedule-screen,.attendance-screen').forEach(el => {
            el.classList.toggle('hidden', !el.classList.contains(cls));
            el.classList.toggle('visible', el.classList.contains(cls));
        });
        $('#attendance-modal').classList.add('hidden');
    }

    $$('.back-button').forEach(btn =>
        btn.addEventListener('click', () => showScreen('main-menu'))
    );

    $('#start-score')?.addEventListener('click', () => showScreen('score-screen'));
    $('#match-stats')?.addEventListener('click', () => {
        showScreen('stats-screen');
        $('.match-info').classList.remove('hidden');
        $('.lineup-selection').classList.add('hidden');
        $('.stats-main').classList.add('hidden');
        $('.stats-review').classList.add('hidden');
    });
    $('#schedule')?.addEventListener('click', () => {
        showScreen('schedule-screen');
        renderSchedule();
    });
    $('#attendance')?.addEventListener('click', () => {
        showScreen('attendance-screen');
        renderAttendance();
    });
    $('#history')?.addEventListener('click', () => {
        showScreen('history-screen');
        loadHistory();
    });
    $('#help')?.addEventListener('click', () => showScreen('help-screen'));

    // ================= СЧЁТ =================
    let team1Score = 0, team2Score = 0, team1SetScore = 0, team2SetScore = 0;

    $('#start-match')?.addEventListener('click', () => {
        team1Name = $('#team1-name').value || 'Команда 1';
        team2Name = $('#team2-name').value || 'Команда 2';
        $('#team1-title').textContent = team1Name;
        $('#team2-title').textContent = team2Name;
        $('.team-inputs').classList.add('hidden');
        $('.score-board').classList.remove('hidden');
        $('#winner-message').classList.add('hidden');
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
            if (team1SetScore === 3 || team2SetScore === 3)
                showWinner(team1SetScore === 3 ? team1Name : team2Name);
        }
    }

    function showWinner(name) {
        $('#winner-message').textContent = `Победа ${name}!`;
        $('#winner-message').classList.remove('hidden');
    }

    // ================= СТАТИСТИКА =================
    $('#start-stats')?.addEventListener('click', () => {
        const date = $('#match-date').value;
        const opponent = $('#opponent').value;
        currentTeam = $('#team-select').value;

        if (!date || !opponent) return alert('Заполните все поля');

        currentMatch = {
            date,
            opponent,
            team: currentTeam,
            sets: {1:[],2:[],3:[],4:[],5:[]},
            playersByZone: {},
            lineup: []
        };

        selectedLineup = [];
        selectedPlayers = {};

        $('.match-info').classList.add('hidden');
        $('.lineup-selection').classList.remove('hidden');
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
        currentMatch.lineup = [...selectedLineup];
        selectedPlayers = {};
        for (let i = 0; i < selectedLineup.length; i++) {
            const zone = (i + 1).toString();
            selectedPlayers[zone] = selectedLineup[i];
            currentMatch.playersByZone[zone] = selectedLineup[i];
            $(`.zone-${zone}`).textContent = getSurname(selectedLineup[i]);
        }

        $('.lineup-selection').classList.add('hidden');
        $('.stats-main').classList.remove('hidden');
        $('.action-menu').classList.add('hidden');
    });

    let currentZoneForSelection = 1;
    $$('.zone').forEach(z =>
        z.addEventListener('click', () => {
            const zone = z.dataset.zone;
            currentZoneForSelection = zone;

            if (selectedPlayers[zone]) {
                $('#current-zone').textContent = zone;
                $('.action-menu').classList.remove('hidden');
                $('.player-selection').classList.add('hidden');
            } else {
                showPlayerSelectionForZone(zone, true);
            }
        })
    );

    function showPlayerSelectionForZone(zone, fullTeam = false) {
        const select = $('#player-select');
        select.innerHTML = '';

        let availablePlayers;
        if (fullTeam) {
            availablePlayers = currentTeam === 'robotex' ? playersRobotex : playersRobotex2;
        } else {
            const assigned = Object.values(selectedPlayers);
            availablePlayers = selectedLineup.filter(p => !assigned.includes(p));
        }

        if (availablePlayers.length === 0) {
            alert('Нет доступных игроков для выбора');
            return;
        }

        availablePlayers.forEach(player => {
            const opt = document.createElement('option');
            opt.value = player;
            opt.textContent = player;
            select.appendChild(opt);
        });

        $('#current-zone').textContent = zone;
        $('.player-selection').classList.remove('hidden');
        $('.action-menu').classList.add('hidden');
    }

    $('#confirm-player')?.addEventListener('click', () => {
        const player = $('#player-select').value;
        if (!player) return;

        for (let z in selectedPlayers) {
            if (selectedPlayers[z] === player) {
                delete selectedPlayers[z];
                delete currentMatch.playersByZone[z];
                $(`.zone-${z}`).textContent = z;
                break;
            }
        }

        selectedPlayers[currentZoneForSelection] = player;
        currentMatch.playersByZone[currentZoneForSelection] = player;
        $(`.zone-${currentZoneForSelection}`).textContent = getSurname(player);

        $('.player-selection').classList.add('hidden');
        $('.action-menu').classList.remove('hidden');
    });

    $('#change-player')?.addEventListener('click', () => {
        const zone = currentZoneForSelection;
        if (selectedPlayers[zone]) {
            delete selectedPlayers[zone];
            delete currentMatch.playersByZone[zone];
            $(`.zone-${zone}`).textContent = zone;
        }
        showPlayerSelectionForZone(zone, true);
        $('.action-menu').classList.add('hidden');
    });

    $$('.action-btn').forEach(btn =>
        btn.addEventListener('click', () => showSubMenu(btn.dataset.action))
    );

    function showSubMenu(action) {
        const optionsMap = {
            receive: ['Качество','Ошибка','Пропуск'],
            attack: ['Очко','Ошибка','Пропуск'],
            defense: ['Качество','Ошибка','Пропуск'],
            block: ['Блок','Ошибка','Смягчение'],
            serve: ['Эйс','Ошибка','Парашут']
        };

        const container = $('.sub-btns-container');
        container.innerHTML = '';

        if (!optionsMap[action]) return;

        optionsMap[action].forEach(opt => {
            const b = document.createElement('button');
            b.className = 'sub-btn';
            b.textContent = opt;
            b.onclick = () => {
                currentMatch.sets[currentSet].push({
                    set: currentSet,
                    player: selectedPlayers[currentZoneForSelection],
                    action,
                    result: opt
                });
                $('.sub-menu').classList.add('hidden');
                $('.action-menu').classList.remove('hidden');
            };
            container.appendChild(b);
        });

        $('.action-menu').classList.add('hidden');
        $('.sub-menu').classList.remove('hidden');
        const actionName = actionTranslations[action] || action;
        $('#sub-menu-title').textContent = `Действие: ${actionName}`;
    }

    $('#current-set')?.addEventListener('click', () =>
        $('#set-dropdown').classList.toggle('hidden')
    );

    $$('.set-option').forEach(opt =>
        opt.addEventListener('click', () => {
            currentSet = +opt.dataset.set;
            $('#current-set').textContent = currentSet;
            $('#set-dropdown').classList.add('hidden');
        })
    );

    // ================= СОХРАНЕНИЕ (localStorage) =================
    function saveMatchToHistory(match) {
        const history = JSON.parse(localStorage.getItem('matchHistory') || '[]');
        history.push(match);
        localStorage.setItem('matchHistory', JSON.stringify(history));
    }

    function generateExcel(match) {
        const data = [["Партия","Игрок","Действие","Результат"]];
        for (let s = 1; s <= 5; s++) {
            (match.sets[s] || []).forEach(e =>
                data.push([s, e.player, e.action, e.result])
            );
        }

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "Статистика");
        XLSX.writeFile(wb, `статистика_${match.date}_${match.opponent}.xlsx`);
    }

    $('#save-stats')?.addEventListener('click', () => {
        if (!currentMatch) return;

        const assignedZones = Object.keys(currentMatch.playersByZone).length;
        if (assignedZones < 6) {
            alert('Не все зоны заполнены игроками. Заполните расстановку.');
            return;
        }

        saveMatchToHistory(currentMatch);
        showReviewScreen(currentMatch);
    });

    $('#download-excel')?.addEventListener('click', () => {
        if (currentMatch) {
            generateExcel(currentMatch);
        } else {
            alert('Нет данных для экспорта');
        }
    });

    // ================= ЭКРАН ПРОСМОТРА (исправленный) =================
    function showReviewScreen(match) {
        console.log('Отображаем статистику матча');
        $('.stats-main').classList.add('hidden');
        $('.stats-review').classList.remove('hidden');
        $('#review-match-info').textContent = `${match.date} — (${match.team === 'robotex' ? 'РОБОТЕХ' : 'РОБОТЕХ 2.0'}) versus (${match.opponent})`;

        const playerStats = {};
        const setStats = {1:{},2:{},3:{},4:{},5:{}};

        const allPlayers = new Set();
        for (let s = 1; s <= 5; s++) {
            const actions = match.sets[s] || [];
            actions.forEach(a => allPlayers.add(a.player));
        }

        allPlayers.forEach(player => {
            playerStats[player] = {
                pointsBySet: {1:0,2:0,3:0,4:0,5:0},
                totalPoints: 0,
                totalErrors: 0,
                serves: { total:0, aces:0, errors:0 },
                receives: { total:0, errors:0, positive:0, excellent:0 },
                attacks: { total:0, points:0, errors:0 },
                blocks: 0
            };
        });

        for (let s = 1; s <= 5; s++) {
            const actions = match.sets[s] || [];
            actions.forEach(a => {
                const player = a.player;
                if (!playerStats[player]) {
                    playerStats[player] = {
                        pointsBySet: {1:0,2:0,3:0,4:0,5:0},
                        totalPoints: 0,
                        totalErrors: 0,
                        serves: { total:0, aces:0, errors:0 },
                        receives: { total:0, errors:0, positive:0, excellent:0 },
                        attacks: { total:0, points:0, errors:0 },
                        blocks: 0
                    };
                }
                const ps = playerStats[player];

                if (a.action === 'attack' && a.result === 'Очко') ps.pointsBySet[s]++;
                if (a.action === 'serve' && a.result === 'Эйс') ps.pointsBySet[s]++;
                if (a.action === 'block' && a.result === 'Блок') ps.pointsBySet[s]++;

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

        for (let s = 1; s <= 5; s++) {
            setStats[s] = {
                points: { serve:0, attack:0, block:0 },
                serves: { total:0, errors:0, points:0 },
                receives: { total:0, errors:0, positive:0, excellent:0 },
                attacks: { total:0, errors:0, points:0 },
                blocks: 0
            };
        }

        for (let s = 1; s <= 5; s++) {
            const actions = match.sets[s] || [];
            actions.forEach(a => {
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
        html += '<table class="review-table">';
        html += '<tr>';
        html += '<th rowspan="2">Игрок</th>';
        html += '<th colspan="5">Партия</th>';
        html += '<th colspan="2">Очки</th>';
        html += '<th colspan="3">Подача</th>';
        html += '<th colspan="4">Прием</th>';
        html += '<th colspan="5">Атака</th>';
        html += '<th colspan="2">Блок</th>'; // группа блок занимает 2 столбца
        html += '</tr>';
        html += '<tr>';
        for (let i=1; i<=5; i++) {
            if (i === 5) {
                html += `<th class="group-end">${i}</th>`;
            } else {
                html += `<th>${i}</th>`;
            }
        }
        html += '<th>Все</th>';
        html += '<th class="group-end">Н-П</th>';
        html += '<th>Все</th><th>Эйс</th>';
        html += '<th class="group-end">Ош</th>';
        html += '<th>Все</th><th>Ош</th><th>Пзт%</th>';
        html += '<th class="group-end">Отл%</th>';
        html += '<th>Все</th><th>Очки</th><th>Ош</th><th>Отл%</th>';
        html += '<th class="group-end">%ош</th>';
        // два подзаголовка для блока
        html += '<th>Очки</th>';
        html += '<th class="group-end">%ош</th>';
        html += '</tr>';

        Object.entries(playerStats).forEach(([player, st]) => {
            html += '<tr>';
            html += `<td>${getSurname(player)}</td>`;

            for (let i=1; i<=5; i++) {
                if (i === 5) {
                    html += `<td class="group-end">${st.pointsBySet[i] || 0}</td>`;
                } else {
                    html += `<td>${st.pointsBySet[i] || 0}</td>`;
                }
            }

            const netPoints = st.totalPoints - st.totalErrors;
            let netPointsClass = '';
            if (netPoints < 0) netPointsClass = ' class="negative-points group-end"';
            else if (netPoints > 0) netPointsClass = ' class="positive-points group-end"';
            else netPointsClass = ' class="group-end"';
            html += `<td>${st.totalPoints}</td>`;
            html += `<td${netPointsClass}>${netPoints}</td>`;

            html += `<td>${st.serves.total}</td>`;
            html += `<td>${st.serves.aces}</td>`;
            html += `<td class="group-end">${st.serves.errors}</td>`;

            html += `<td>${st.receives.total}</td>`;
            html += `<td>${st.receives.errors}</td>`;
            const pzt = st.receives.total ? Math.round((st.receives.positive / st.receives.total) * 100) : 0;
            const otl = st.receives.total ? Math.round((st.receives.excellent / st.receives.total) * 100) : 0;
            html += `<td>${pzt}%</td>`;
            html += `<td class="group-end">${otl}%</td>`;

            html += `<td>${st.attacks.total}</td>`;
            html += `<td>${st.attacks.points}</td>`;
            html += `<td>${st.attacks.errors}</td>`;
            const attOtl = st.attacks.total ? Math.round((st.attacks.points / st.attacks.total) * 100) : 0;
            const attErr = st.attacks.total ? Math.round((st.attacks.errors / st.attacks.total) * 100) : 0;
            html += `<td>${attOtl}%</td>`;
            html += `<td class="group-end">${attErr}%</td>`;

            // Блок: две ячейки
            html += `<td>${st.blocks}</td>`;
            html += `<td class="group-end">0%</td>`;

            html += '</tr>';
        });

        html += '</table>';

        // Таблица по партиям (без изменений)
        html += '<h4>Статистика по партиям</h4>';
        html += '<table class="review-table">';
        html += '<tr>';
        html += '<th rowspan="2">Партия</th>';
        html += '<th colspan="3">Очки</th>';
        html += '<th colspan="3">Подача</th>';
        html += '<th colspan="4">Прием</th>';
        html += '<th colspan="4">Атака</th>';
        html += '<th>Блок</th>';
        html += '</tr>';
        html += '<tr>';
        html += '<th>На под</th><th>В ат</th>';
        html += '<th class="group-end">На бл</th>';
        html += '<th>Все</th><th>Ош</th>';
        html += '<th class="group-end">Очки</th>';
        html += '<th>Все</th><th>Ош</th><th>Пзт%</th>';
        html += '<th class="group-end">Отл%</th>';
        html += '<th>Все</th><th>Ош</th><th>Очки</th>';
        html += '<th class="group-end">Отл%</th>';
        html += '<th>Очки</th>';
        html += '</tr>';

        for (let s=1; s<=5; s++) {
            const ss = setStats[s];
            if (!ss || (ss.serves.total === 0 && ss.receives.total === 0 && ss.attacks.total === 0 && ss.blocks === 0)) continue;

            html += '<tr>';
            html += `<td>${s}</td>`;

            html += `<td>${ss.points.serve}</td>`;
            html += `<td>${ss.points.attack}</td>`;
            html += `<td class="group-end">${ss.points.block}</td>`;

            html += `<td>${ss.serves.total}</td>`;
            html += `<td>${ss.serves.errors}</td>`;
            html += `<td class="group-end">${ss.serves.points}</td>`;

            html += `<td>${ss.receives.total}</td>`;
            html += `<td>${ss.receives.errors}</td>`;
            const pztSet = ss.receives.total ? Math.round((ss.receives.positive / ss.receives.total) * 100) : 0;
            const otlSet = ss.receives.total ? Math.round((ss.receives.excellent / ss.receives.total) * 100) : 0;
            html += `<td>${pztSet}%</td>`;
            html += `<td class="group-end">${otlSet}%</td>`;

            html += `<td>${ss.attacks.total}</td>`;
            html += `<td>${ss.attacks.errors}</td>`;
            html += `<td>${ss.attacks.points}</td>`;
            const attOtlSet = ss.attacks.total ? Math.round((ss.attacks.points / ss.attacks.total) * 100) : 0;
            html += `<td class="group-end">${attOtlSet}%</td>`;

            html += `<td>${ss.blocks}</td>`;

            html += '</tr>';
        }
        html += '</table>';

        $('#review-content').innerHTML = html;
    }

    $('#new-match-btn')?.addEventListener('click', () => {
        $('.stats-review').classList.add('hidden');
        $('.match-info').classList.remove('hidden');
        $('#match-date').value = '';
        $('#opponent').value = '';
        $('#team-select').value = 'robotex';
    });

    // ================= ИСТОРИЯ =================
    function loadHistory() {
        const list = $('#history-list');
        list.innerHTML = '';
        const history = JSON.parse(localStorage.getItem('matchHistory') || '[]');
        history.forEach((match, index) => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `${match.date} — ${match.opponent} <button data-index="${index}">Удалить</button>`;
            div.querySelector('button').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteMatch(index);
            });
            div.addEventListener('click', (e) => {
                if (e.target.tagName !== 'BUTTON') {
                    currentMatch = match;
                    selectedPlayers = match.playersByZone ? { ...match.playersByZone } : {};
                    selectedLineup = match.lineup || [];

                    if (match.playersByZone) {
                        for (let zone in match.playersByZone) {
                            const player = match.playersByZone[zone];
                            $(`.zone-${zone}`).textContent = getSurname(player);
                        }
                    }

                    showScreen('stats-screen');
                    $('.match-info').classList.add('hidden');
                    $('.lineup-selection').classList.add('hidden');
                    $('.stats-main').classList.add('hidden');
                    showReviewScreen(match);
                }
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

    // ================= РАСПИСАНИЕ =================
    function parseDate(dateStr) {
        if (!dateStr || dateStr.trim() === '') return null;
        let clean = dateStr.replace(/\s*\([^)]*\)/, '').trim();
        let parts = clean.split('.');
        if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
        return null;
    }

    function formatScoreForTeam(score, isOurTeamFirst) {
        if (!score || score.trim() === '') return score;
        let parts = score.split(':');
        if (parts.length === 2) {
            if (isOurTeamFirst) return score;
            else return parts[1] + ':' + parts[0];
        }
        return score;
    }

    function renderSchedule() {
        const ourTeams = ['Роботех', 'Роботех 2.0'];
        const todayStr = '2026-02-24';
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
                        isOurTeamFirst: isOurTeamFirst
                    };
                    if (isPast) teamData[team].past.push(matchInfo);
                    else teamData[team].upcoming.push(matchInfo);
                }
            });
        });

        ourTeams.forEach(team => {
            teamData[team].upcoming.sort((a, b) => (parseDate(a.date) || '9999-99-99').localeCompare(parseDate(b.date) || '9999-99-99'));
            teamData[team].past.sort((a, b) => (parseDate(b.date) || '0000-00-00').localeCompare(parseDate(a.date) || '0000-00-00'));
        });

        let html = '<div class="schedule-container">';

        html += '<div class="schedule-column"><h3>Роботех</h3>';
        html += '<div class="schedule-subsection"><h4>Предстоящие</h4>';
        if (teamData['Роботех'].upcoming.length === 0) html += '<p>Нет предстоящих матчей</p>';
        else {
            html += '<table class="schedule-table"><tr><th>Дата</th><th>Время</th><th>Соперник</th></tr>';
            teamData['Роботех'].upcoming.forEach(m => html += `<tr><td>${m.date}</td><td>${m.time}</td><td>${m.opponent}</td></tr>`);
            html += '</table>';
        }
        html += '</div><div class="schedule-subsection"><h4>Прошедшие</h4>';
        if (teamData['Роботех'].past.length === 0) html += '<p>Нет прошедших матчей</p>';
        else {
            html += '<table class="schedule-table"><tr><th>Дата</th><th>Время</th><th>Соперник</th><th>Счёт</th></tr>';
            teamData['Роботех'].past.forEach(m => html += `<tr><td>${m.date}</td><td>${m.time}</td><td>${m.opponent}</td><td>${formatScoreForTeam(m.score, m.isOurTeamFirst)}</td></tr>`);
            html += '</table>';
        }
        html += '</div></div>';

        html += '<div class="schedule-column"><h3>Роботех 2.0</h3>';
        html += '<div class="schedule-subsection"><h4>Предстоящие</h4>';
        if (teamData['Роботех 2.0'].upcoming.length === 0) html += '<p>Нет предстоящих матчей</p>';
        else {
            html += '<table class="schedule-table"><tr><th>Дата</th><th>Время</th><th>Соперник</th></tr>';
            teamData['Роботех 2.0'].upcoming.forEach(m => html += `<tr><td>${m.date}</td><td>${m.time}</td><td>${m.opponent}</td></tr>`);
            html += '</table>';
        }
        html += '</div><div class="schedule-subsection"><h4>Прошедшие</h4>';
        if (teamData['Роботех 2.0'].past.length === 0) html += '<p>Нет прошедших матчей</p>';
        else {
            html += '<table class="schedule-table"><tr><th>Дата</th><th>Время</th><th>Соперник</th><th>Счёт</th></tr>';
            teamData['Роботех 2.0'].past.forEach(m => html += `<tr><td>${m.date}</td><td>${m.time}</td><td>${m.opponent}</td><td>${formatScoreForTeam(m.score, m.isOurTeamFirst)}</td></tr>`);
            html += '</table>';
        }
        html += '</div></div>';

        html += '</div>';
        $('#schedule-content').innerHTML = html;
    }

    // ================= ЖУРНАЛ ПОСЕЩЕНИЙ (localStorage) =================
    function getAttendanceKey(dateStr) { return `attendance_${dateStr}`; }
    function saveAttendanceForDate(dateStr, presentPlayers) {
        localStorage.setItem(getAttendanceKey(dateStr), JSON.stringify(presentPlayers));
    }
    function loadAttendanceForDate(dateStr) {
        const data = localStorage.getItem(getAttendanceKey(dateStr));
        return data ? JSON.parse(data) : [];
    }

    const TRAINING_START_DATE = '2026-02-01';

    function getAllTrainingDates() {
        const dates = [];
        let current = new Date(TRAINING_START_DATE);
        const today = new Date();
        const endDate = new Date(today);
        endDate.setMonth(today.getMonth() + 1);
        while (current <= endDate) {
            const day = current.getDay();
            if (day === 5 || day === 0) {
                const dd = String(current.getDate()).padStart(2,'0');
                const mm = String(current.getMonth()+1).padStart(2,'0');
                const yyyy = current.getFullYear();
                dates.push(`${dd}.${mm}.${yyyy}`);
            }
            current.setDate(current.getDate() + 1);
        }
        return dates;
    }

    function convertDisplayDateToStorage(displayDate) {
        let parts = displayDate.split('.');
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    function getUnfilledTrainingDates() {
        const allDates = getAllTrainingDates();
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        return allDates.filter(date => {
            const storageDate = convertDisplayDateToStorage(date);
            if (storageDate > todayStr) return false;
            return loadAttendanceForDate(storageDate).length === 0;
        });
    }

    function getFilledTrainingDates() {
        const allDates = getAllTrainingDates();
        return allDates.filter(date => {
            const storageDate = convertDisplayDateToStorage(date);
            return loadAttendanceForDate(storageDate).length > 0;
        });
    }

    function renderAttendance() {
        const container = $('#attendance-content');
        let trainingDates = getAllTrainingDates();
        // Ограничим до последних 10 дат для ускорения
        trainingDates = trainingDates.slice(-10);
        let html = '<table class="attendance-table"><tr><th>Игрок</th>';
        trainingDates.forEach(date => html += `<th>${date}</th>`);
        html += '</tr>';

        allPlayers.forEach(player => {
            const surname = getSurname(player);
            html += '<tr>';
            html += `<td>${surname}</td>`;
            trainingDates.forEach(date => {
                const storageDate = convertDisplayDateToStorage(date);
                const presentList = loadAttendanceForDate(storageDate);
                const isPresent = presentList.includes(player);
                const className = isPresent ? 'present' : 'absent';
                const symbol = isPresent ? '✅' : '❌';
                html += `<td class="${className}">${symbol}</td>`;
            });
            html += '</tr>';
        });
        html += '</table>';
        container.innerHTML = html;
    }

    function openAttendanceModal(mode) {
        const modal = $('#attendance-modal');
        const title = $('#modal-title');
        const dateSelectorDiv = $('#modal-date-selector');
        const playersDiv = $('#modal-players-list');

        if (mode === 'fill') {
            const unfilled = getUnfilledTrainingDates();
            if (unfilled.length === 0) {
                alert('Нет незаполненных тренировок (прошедших и не отмеченных).');
                return;
            }
            title.textContent = 'Выберите дату и отметьте присутствующих';
            dateSelectorDiv.innerHTML = '<select id="modal-date-select"></select>';
            const select = $('#modal-date-select');
            unfilled.forEach(date => {
                const opt = document.createElement('option');
                opt.value = date;
                opt.textContent = date;
                select.appendChild(opt);
            });
            select.addEventListener('change', () => {
                renderPlayerListForDate(select.value, []);
            });
            renderPlayerListForDate(unfilled[0], []);
        } else if (mode === 'edit') {
            const filled = getFilledTrainingDates();
            if (filled.length === 0) {
                alert('Нет заполненных тренировок.');
                return;
            }
            title.textContent = 'Выберите дату для изменения';
            dateSelectorDiv.innerHTML = '<select id="modal-date-select"></select>';
            const select = $('#modal-date-select');
            filled.forEach(date => {
                const opt = document.createElement('option');
                opt.value = date;
                opt.textContent = date;
                select.appendChild(opt);
            });
            select.addEventListener('change', () => {
                const storageDate = convertDisplayDateToStorage(select.value);
                const present = loadAttendanceForDate(storageDate);
                renderPlayerListForDate(select.value, present);
            });
            const firstDate = select.value;
            const storageDate = convertDisplayDateToStorage(firstDate);
            const present = loadAttendanceForDate(storageDate);
            renderPlayerListForDate(firstDate, present);
        }

        modal.classList.remove('hidden');

        function renderPlayerListForDate(displayDate, selectedPlayersArray) {
            playersDiv.innerHTML = '';
            allPlayers.forEach(player => {
                const div = document.createElement('div');
                div.className = 'modal-player-item';
                div.textContent = player;
                if (selectedPlayersArray.includes(player)) div.classList.add('selected');
                div.addEventListener('click', () => div.classList.toggle('selected'));
                playersDiv.appendChild(div);
            });
            $('#modal-done').dataset.date = displayDate;
        }
    }

    $('#fill-attendance')?.addEventListener('click', () => openAttendanceModal('fill'));

    $('#edit-attendance')?.addEventListener('click', () => openAttendanceModal('edit'));

    $('#modal-done')?.addEventListener('click', () => {
        const displayDate = $('#modal-done').dataset.date;
        if (!displayDate) {
            alert('Сначала выберите дату');
            return;
        }
        const storageDate = convertDisplayDateToStorage(displayDate);
        const selectedItems = $$('#modal-players-list .modal-player-item.selected');
        const presentPlayers = Array.from(selectedItems).map(el => el.textContent);
        saveAttendanceForDate(storageDate, presentPlayers);
        $('#attendance-modal').classList.add('hidden');
        renderAttendance();
    });

    $('#modal-cancel')?.addEventListener('click', () => {
        $('#attendance-modal').classList.add('hidden');
    });

    // ================= СИНХРОНИЗАЦИЯ С ОБЛАКОМ =================
    async function uploadMatches() {
        const localMatches = JSON.parse(localStorage.getItem('matchHistory') || '[]');
        if (localMatches.length === 0) {
            alert('Нет локальных матчей для отправки');
            return;
        }

        let sent = 0;
        let skipped = 0;
        for (const match of localMatches) {
            try {
                const response = await fetch('/.netlify/functions/save-match', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(match)
                });
                const result = await response.json();
                if (result.skipped) {
                    skipped++;
                } else if (result.success) {
                    sent++;
                }
            } catch (e) {
                console.error('Ошибка отправки матча:', e);
            }
        }
        alert(`Отправлено: ${sent}, пропущено (уже есть в облаке): ${skipped}`);
    }

    async function downloadMatches() {
        if (!confirm('Все локальные матчи будут заменены облачными. Продолжить?')) return;
        try {
            const response = await fetch('/.netlify/functions/get-matches');
            if (!response.ok) throw new Error('Ошибка загрузки');
            const cloudMatches = await response.json();
            // Удаляем служебные поля id, created_at
            const matchesToSave = cloudMatches.map(m => {
                const { id, created_at, ...rest } = m;
                return rest;
            });
            localStorage.setItem('matchHistory', JSON.stringify(matchesToSave));
            alert('Матчи успешно загружены из облака');
            // Обновляем экран истории, если он открыт
            if (!document.querySelector('.history-screen').classList.contains('hidden')) {
                loadHistory();
            }
        } catch (e) {
            console.error('Ошибка загрузки матчей:', e);
            alert('Не удалось загрузить матчи');
        }
    }

    async function uploadAttendance() {
        // Собираем все ключи attendance_* из localStorage
        const keys = Object.keys(localStorage).filter(k => k.startsWith('attendance_'));
        if (keys.length === 0) {
            alert('Нет локальных записей посещаемости');
            return;
        }

        let sent = 0;
        let skipped = 0;
        for (const key of keys) {
            const date = key.replace('attendance_', '');
            const present = JSON.parse(localStorage.getItem(key));
            try {
                const response = await fetch('/.netlify/functions/save-attendance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ date, present })
                });
                const result = await response.json();
                if (result.skipped) skipped++;
                else if (result.success) sent++;
            } catch (e) {
                console.error('Ошибка отправки посещаемости:', e);
            }
        }
        alert(`Отправлено записей посещаемости: ${sent}, пропущено (уже есть): ${skipped}`);
    }

    async function downloadAttendance() {
        if (!confirm('Все локальные записи посещаемости будут заменены облачными. Продолжить?')) return;
        try {
            const response = await fetch('/.netlify/functions/get-attendance');
            if (!response.ok) throw new Error('Ошибка загрузки');
            const records = await response.json(); // [{ date, present }]
            // Очищаем все старые записи посещаемости в localStorage
            const keys = Object.keys(localStorage).filter(k => k.startsWith('attendance_'));
            keys.forEach(k => localStorage.removeItem(k));
            // Записываем новые
            records.forEach(rec => {
                const storageKey = `attendance_${rec.date}`; // rec.date в формате YYYY-MM-DD
                localStorage.setItem(storageKey, JSON.stringify(rec.present));
            });
            alert('Посещаемость успешно загружена из облака');
            if (!document.querySelector('.attendance-screen').classList.contains('hidden')) {
                renderAttendance();
            }
        } catch (e) {
            console.error('Ошибка загрузки посещаемости:', e);
            alert('Не удалось загрузить посещаемость');
        }
    }

    // Обработчики для новых кнопок (их нужно добавить в index.html)
    $('#sync-upload')?.addEventListener('click', () => {
        uploadMatches();
        uploadAttendance();
    });

    $('#sync-download')?.addEventListener('click', () => {
        downloadMatches();
        downloadAttendance();
    });

    console.log('Скрипт полностью загружен, обработчики привязаны');
});