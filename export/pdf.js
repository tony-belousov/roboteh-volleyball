(function () {
  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function row(label, value) {
    return `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value || '—')}</td></tr>`;
  }

  function getTeamData(teamId) {
    const teams = window.SetkaTeams?.getTeams ? window.SetkaTeams.getTeams() : [];
    return teams.find((team) => team.id === teamId) || null;
  }

  function teamLogoRow(teamId) {
    const team = getTeamData(teamId);
    if (!team?.logo) return '';
    return `<tr><th>Логотип</th><td><img class="pdf-team-logo" src="${escapeHtml(team.logo)}" alt=""></td></tr>`;
  }

  function isImportedStatsMatch(match) {
    return Boolean(match?.imported || match?.dataType === 'importedStats' || match?.importedStats);
  }

  function getImportedSetCount(match) {
    return Number(match?.importedSets || match?.setsCount || match?.importedStats?.sets?.length || 0) || 0;
  }

  function getMatchScoreLabel(match) {
    if (isImportedStatsMatch(match) && (!match.finalScore || match.finalScore === '—')) {
      const count = getImportedSetCount(match);
      return count ? `Статистика по ${count} партиям` : 'Счёт не указан';
    }
    return match?.finalScore || '—';
  }

  function getMatchSetsLabel(match) {
    if (Array.isArray(match?.setScores) && match.setScores.length) return match.setScores.join(', ');
    if (isImportedStatsMatch(match)) {
      const count = getImportedSetCount(match);
      return count ? `Статистика по ${count} партиям` : 'Партии без счёта';
    }
    return 'Партии не указаны';
  }

  function getPlayerDisplayName(player) {
    if (window.SetkaPlayerNames) return window.SetkaPlayerNames.getPlayerDisplayName(player);
    const value = typeof player === 'string'
      ? player
      : (player?.name || player?.fullName || `${player?.lastName || ''} ${player?.firstName || ''}`.trim());
    const parts = String(value || '').trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).join(' ') || String(value || '').trim();
  }

  function getPlayerPhoto(player) {
    if (window.SetkaPlayerNames?.getPlayerPhoto) return window.SetkaPlayerNames.getPlayerPhoto(player);
    return player?.photo || '';
  }

  function actionTable(teamStats) {
    const rows = window.SetkaStatsCore.ACTIONS.map((action) => {
      const stats = teamStats.byAction[action.type];
      if (action.type === 'error') {
        return `<tr><td>${action.name}</td><td>${stats.total}</td><td colspan="3">Ошибки</td></tr>`;
      }
      return `<tr>
        <td>${action.name}</td>
        <td>${stats.total}</td>
        <td>${stats.plus} (${window.SetkaStatsCore.formatPercent(stats.plusPercent)})</td>
        <td>${stats.minus} (${window.SetkaStatsCore.formatPercent(stats.minusPercent)})</td>
        <td>${action.mode === 'triple' ? `${stats.neutral} (${window.SetkaStatsCore.formatPercent(stats.neutralPercent)})` : '—'}</td>
      </tr>`;
    }).join('');

    return `<table>
      <thead><tr><th>Действие</th><th>Всего</th><th>Плюс</th><th>Минус</th><th>Нейтрально</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  }

  function excelStatsTable(teamStats) {
    const excel = teamStats?.excel || window.SetkaStatsCore.calculateExcelCompatibleStats([]);
    return `<table>
      <thead><tr><th>Показатель</th><th>Значение</th><th>Детали</th></tr></thead>
      <tbody>
        <tr><td>Подача качество</td><td>${window.SetkaStatsCore.formatPercent(excel.serve.qualityPercent)}</td><td>эйсы ${excel.serve.aces}, сбитый приём ${excel.serve.disruptedReceive}</td></tr>
        <tr><td>Подача брак</td><td>${window.SetkaStatsCore.formatPercent(excel.serve.errorPercent)}</td><td>ошибки ${excel.serve.errors} из ${excel.serve.total}</td></tr>
        <tr><td>Приём качество</td><td>${window.SetkaStatsCore.formatPercent(excel.receive.qualityPercent)}</td><td>качество ${excel.receive.quality} из ${excel.receive.total}</td></tr>
        <tr><td>Приём брак</td><td>${window.SetkaStatsCore.formatPercent(excel.receive.errorPercent)}</td><td>ошибки ${excel.receive.errors}</td></tr>
        <tr><td>Атака реализация</td><td>${window.SetkaStatsCore.formatPercent(excel.attack.pointPercent)}</td><td>очки ${excel.attack.points} из ${excel.attack.total}</td></tr>
        <tr><td>Атака брак</td><td>${window.SetkaStatsCore.formatPercent(excel.attack.errorPercent)}</td><td>ошибки ${excel.attack.errors}</td></tr>
        <tr><td>Защита</td><td>${excel.defense.quality}</td><td>качество, ошибок ${excel.defense.errors}</td></tr>
        <tr><td>Блок</td><td>${excel.block.points} / ${excel.block.softTouches}</td><td>очки / смягчения, ошибок ${excel.block.errors}</td></tr>
        <tr><td>Прочие ошибки</td><td>${excel.miscErrors.total}</td><td>отдельная колонка</td></tr>
      </tbody>
    </table>`;
  }

  function importedSummaryTable(match) {
    const summary = match?.importedStats?.summary || [];
    if (!summary.length) return '';
    return `<h2>Исторический импорт</h2>
      <p>${escapeHtml(match.sourceLabel || 'Старый Excel')} · ${escapeHtml(match.importedStats?.originalFile || 'агрегированная таблица')} · без живого журнала событий.</p>
      <table>
        <thead><tr><th>Игрок</th><th>Подача кач.</th><th>Приём кач.</th><th>Атака</th><th>Блок</th><th>Прочие ошибки</th></tr></thead>
        <tbody>${summary.map((player) => `<tr>
          <td>${escapeHtml(player.playerName)}</td>
          <td>${window.SetkaStatsCore.formatPercent(player.percentages?.serveQuality || 0)}</td>
          <td>${window.SetkaStatsCore.formatPercent(player.percentages?.receiveQuality || 0)}</td>
          <td>${window.SetkaStatsCore.formatPercent(player.percentages?.attackPoint || 0)}</td>
          <td>${escapeHtml(`${player.block?.point || 0} очк. / ${player.block?.soft || 0} смягч.`)}</td>
          <td>${escapeHtml(player.miscErrors?.total || 0)}</td>
        </tr>`).join('')}</tbody>
      </table>`;
  }

  function bestPlayerRow(label, player) {
    return `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(player?.name || 'Недостаточно данных')}</td><td>${escapeHtml(player?.bestLine || '')}</td><td>${escapeHtml(player?.bestDetails || '')}</td></tr>`;
  }

  function bestMatchRow(label, match) {
    return `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(match?.opponent || 'Недостаточно данных')}</td><td>${escapeHtml(match?.bestLine || getMatchScoreLabel(match || {}))}</td><td>${escapeHtml(match?.bestDetails || '')}</td></tr>`;
  }

  function bestSetRow(label, item) {
    const title = item ? `${item.match.opponent}, партия ${item.set.setNumber}` : 'Недостаточно данных';
    return `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(title)}</td><td>${escapeHtml(item?.bestLine || '')}</td><td>${escapeHtml(item?.bestDetails || '')}</td></tr>`;
  }

  function bestStatsTable(best) {
    return `<table>
      <thead><tr><th>Показатель</th><th>Лидер</th><th>Метрика</th><th>Детали</th></tr></thead>
      <tbody>
        ${bestPlayerRow('Лучший подающий', best.serve)}
        ${bestPlayerRow('Лучший принимающий', best.receive)}
        ${bestPlayerRow('Лучший атакующий', best.attack)}
        ${bestPlayerRow('Лучший блокирующий', best.block)}
        ${bestPlayerRow('Лучший в защите', best.defense)}
        ${bestPlayerRow('Самый активный', best.mostActive)}
        ${bestPlayerRow('Минимум ошибок', best.lowestErrors)}
        ${bestMatchRow('Лучший матч команды', best.bestTeamMatch)}
        ${bestMatchRow('Меньше всего ошибок', best.lowestErrorMatch)}
        ${bestSetRow('Лучшая атака в партии', best.bestAttackSet)}
        ${bestSetRow('Лучший приём в партии', best.bestReceiveSet)}
      </tbody>
    </table>`;
  }

  function buildDocument(title, sections) {
    return `<!doctype html>
      <html lang="ru">
      <head>
        <meta charset="utf-8">
        <title>${escapeHtml(title)}</title>
        <style>
          body { margin: 0; padding: 28px; font-family: Arial, sans-serif; color: #111; }
          h1 { margin: 0 0 4px; font-size: 24px; }
          h2 { margin: 22px 0 8px; font-size: 17px; }
          p { margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; margin: 8px 0 12px; font-size: 12px; }
          th, td { border: 1px solid #d6d6d6; padding: 6px 7px; text-align: left; vertical-align: top; }
          th { background: #eef4f0; }
          .meta { color: #555; margin-bottom: 18px; }
          .brand { font-weight: 700; color: #0b3b36; }
          .pdf-team-logo { max-width: 150px; max-height: 58px; object-fit: contain; vertical-align: middle; }
          .pdf-avatar { width: 34px; height: 34px; object-fit: cover; border-radius: 6px; vertical-align: middle; margin-right: 6px; }
          @media print { body { padding: 18mm; } button { display: none; } }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <p class="meta"><span class="brand">Сетка</span> · сформировано ${new Date().toLocaleString('ru-RU')}</p>
        ${sections.join('')}
      </body>
      </html>`;
  }

  function openPrintable(title, sections) {
    const html = buildDocument(title, sections);
    const filename = `${title.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'setka-report'}.html`;

    if (window.SetkaPdfPreview?.openReport) {
      return window.SetkaPdfPreview.openReport({ title, html, filename });
    }

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return true;
  }

  function exportMatchPdf(match, analytics) {
    if (!match) return false;
    const teamId = match.teamId || '';
    const location = match.location || match.venue || '';
    const teamStats = analytics?.teamStats || window.SetkaStatsCore.calculateMatchStats(match, teamId);
    const playerStats = analytics?.playerStats || window.SetkaStatsPlayers.calculatePlayerStats(match, teamId);
    const roleStats = analytics?.roleStats || window.SetkaStatsRoles.calculateRoleStats(match, teamId);
    const setStats = analytics?.setStats || window.SetkaStatsSets.calculateSetStats(match, teamId);
    const best = analytics?.best || window.SetkaStatsBest.getBestPerformers([match], teamId);
    const starters = (match.roster || []).filter((player) => player.status === 'старт');
    const bench = Array.isArray(match.bench) && match.bench.length ? match.bench : (match.roster || []).filter((player) => player.status === 'запас');
    const substitutions = match.substitutions || [];
    const playerName = (playerId) => {
      const player = (match.roster || []).find((item) => (item.playerId || item.id) === playerId);
      return player ? getPlayerDisplayName(player) : playerId || '';
    };

    const sections = [
      `<h2>Матч</h2><table><tbody>
        ${teamLogoRow(teamId)}
        ${row('Команда', match.ourTeam)}
        ${row('Соперник', match.opponent)}
        ${row('Дата', match.date)}
        ${row('Турнир', match.tournament)}
        ${row('Место', location)}
        ${row('Тип матча', match.matchType)}
        ${row('Формат', match.matchFormat)}
        ${row('Итоговый счёт', getMatchScoreLabel(match))}
        ${row('Счёт по партиям', getMatchSetsLabel(match))}
        ${row('Результат', match.result)}
        ${row('Статус', match.status)}
        ${row('Комментарий тренера', match.coachComment)}
      </tbody></table>`,
      `<h2>Состав</h2><table><thead><tr><th>№</th><th>Игрок</th><th>Амплуа</th><th>Статус</th></tr></thead><tbody>${(match.roster || []).map((player) => `<tr><td>${escapeHtml(player.number)}</td><td>${getPlayerPhoto(player) ? `<img class="pdf-avatar" src="${escapeHtml(getPlayerPhoto(player))}" alt="">` : ''}${escapeHtml(getPlayerDisplayName(player))}</td><td>${escapeHtml(player.role)}</td><td>${escapeHtml(player.status)}</td></tr>`).join('')}</tbody></table>`,
      `<h2>Стартовый состав</h2><table><thead><tr><th>№</th><th>Игрок</th><th>Амплуа</th></tr></thead><tbody>${starters.map((player) => `<tr><td>${escapeHtml(player.number)}</td><td>${getPlayerPhoto(player) ? `<img class="pdf-avatar" src="${escapeHtml(getPlayerPhoto(player))}" alt="">` : ''}${escapeHtml(getPlayerDisplayName(player))}</td><td>${escapeHtml(player.role)}</td></tr>`).join('')}</tbody></table>`,
      `<h2>Скамейка</h2><table><thead><tr><th>№</th><th>Игрок</th><th>Амплуа</th></tr></thead><tbody>${bench.map((player) => `<tr><td>${escapeHtml(player.number)}</td><td>${getPlayerPhoto(player) ? `<img class="pdf-avatar" src="${escapeHtml(getPlayerPhoto(player))}" alt="">` : ''}${escapeHtml(getPlayerDisplayName(player))}</td><td>${escapeHtml(player.role)}</td></tr>`).join('')}</tbody></table>`,
      `<h2>Замены</h2>${substitutions.length ? `<table><thead><tr><th>Партия</th><th>Время</th><th>Ушёл</th><th>Вышел</th></tr></thead><tbody>${substitutions.map((item) => `<tr><td>${escapeHtml(item.setNumber || '')}</td><td>${escapeHtml(item.time || '')}</td><td>${escapeHtml(playerName(item.outPlayerId))}</td><td>${escapeHtml(playerName(item.inPlayerId))}</td></tr>`).join('')}</tbody></table>` : '<p>Замены не записаны.</p>'}`,
      `<h2>Командная статистика</h2>${actionTable(teamStats)}`,
      importedSummaryTable(match),
      `<h2>Excel-совместимые показатели</h2>${excelStatsTable(teamStats)}`,
      `<h2>Игроки</h2><table><thead><tr><th>Игрок</th><th>Амплуа</th><th>Действий</th><th>Ошибки</th></tr></thead><tbody>${playerStats.map((player) => `<tr><td>${escapeHtml(getPlayerDisplayName(player))}</td><td>${escapeHtml(player.role)}</td><td>${player.totalActions}</td><td>${player.errors}</td></tr>`).join('')}</tbody></table>`,
      `<h2>Амплуа</h2><table><thead><tr><th>Амплуа</th><th>Игроков</th><th>Действий</th><th>Вклад</th></tr></thead><tbody>${roleStats.map((role) => `<tr><td>${escapeHtml(role.role)}</td><td>${role.playerCount}</td><td>${role.totalActions}</td><td>${window.SetkaStatsCore.formatPercent(role.contributionPercent)}</td></tr>`).join('')}</tbody></table>`,
      `<h2>Партии</h2>${setStats.hasSetData ? `<table><thead><tr><th>Партия</th><th>Счёт</th><th>Действий</th></tr></thead><tbody>${setStats.sets.map((set) => `<tr><td>${escapeHtml(set.setNumber)}</td><td>${escapeHtml(set.score)}</td><td>${set.totalActions}</td></tr>`).join('')}</tbody></table>` : '<p>Статистика по партиям появится после записи партий.</p>'}`,
      `<h2>Лучшие показатели</h2>${bestStatsTable(best)}`,
      `<h2>Краткие выводы</h2><p>Всего записано действий: ${teamStats.totalActions}. Ошибок: ${teamStats.errors.total}. Подробные выводы требуют большего массива матчей и будут уточняться по мере накопления данных.</p>`
    ];

    return openPrintable(`Сетка · матч ${match.opponent}`, sections);
  }

  function exportTeamPdf(matches, title) {
    const teamId = matches?.[0]?.teamId || '';
    const teamName = matches?.[0]?.ourTeam || 'Команда';
    const season = window.SetkaStatsSeason.calculateSeasonStats(matches || [], teamId);
    const sections = [
      `<h2>Профиль</h2><table><tbody>
        ${teamLogoRow(teamId)}
        ${row('Команда', teamName)}
        ${row('Период', title || 'Все сохранённые матчи')}
      </tbody></table>`,
      `<h2>Сводка</h2><table><tbody>
        ${row('Матчей', season.totalMatches)}
        ${row('Победы / поражения', `${season.wins} / ${season.losses}`)}
        ${row('Партий', season.totalSets)}
        ${row('Действий', season.totalActions)}
        ${row('Среднее действий за матч', season.actionsPerMatch)}
      </tbody></table>`,
      `<h2>Матчи</h2><table><thead><tr><th>Дата</th><th>Соперник</th><th>Турнир</th><th>Место</th><th>Счёт</th><th>Результат</th></tr></thead><tbody>${(matches || []).map((match) => `<tr><td>${escapeHtml(match.date)}</td><td>${escapeHtml(match.opponent)}</td><td>${escapeHtml(match.tournament)}</td><td>${escapeHtml(match.location || match.venue)}</td><td>${escapeHtml(getMatchScoreLabel(match))}</td><td>${escapeHtml(match.result || '')}</td></tr>`).join('')}</tbody></table>`,
      `<h2>Команда</h2>${actionTable(season.teamStats)}`,
      `<h2>Excel-совместимые показатели</h2>${excelStatsTable(season.teamStats)}`
    ];
    return openPrintable('Сетка · команда', sections);
  }

  function exportPlayerPdf(player, matches) {
    if (!player) return false;
    const teamId = matches?.[0]?.teamId || player.teamId || '';
    const dynamics = window.SetkaStatsPlayers.calculatePlayerDynamics(player.playerId, matches || [], teamId);
    const playerStats = player.teamStats || window.SetkaStatsCore.mergeTeamStats((matches || []).map((match) => window.SetkaStatsCore.calculateMatchStats(match, teamId, {
      playerId: player.playerId
    })));
    const sections = [
      `<h2>Игрок</h2><table><tbody>
        ${teamLogoRow(teamId)}
        ${getPlayerPhoto(player) ? `<tr><th>Фото</th><td><img class="pdf-avatar" src="${escapeHtml(getPlayerPhoto(player))}" alt=""></td></tr>` : ''}
        ${row('ФИ', getPlayerDisplayName(player))}
        ${row('Команда', matches?.[0]?.ourTeam || player.teamName || '')}
        ${row('Амплуа', player.role)}
        ${row('Номер', player.number)}
        ${row('Рост', player.height ? `${player.height} см` : 'уточняется')}
        ${row('Дата рождения', player.birthDate || 'не указана')}
        ${row('Действий', player.totalActions)}
        ${row('Ошибки', player.errors)}
      </tbody></table>`,
      `<h2>Статистика по действиям</h2>${actionTable(playerStats)}`,
      `<h2>Excel-совместимые показатели</h2>${excelStatsTable(playerStats)}`,
      `<h2>Динамика</h2><table><thead><tr><th>Дата</th><th>Соперник</th><th>Действий</th></tr></thead><tbody>${dynamics.map((item) => `<tr><td>${escapeHtml(item.date)}</td><td>${escapeHtml(item.opponent)}</td><td>${item.totalActions}</td></tr>`).join('')}</tbody></table>`
    ];
    return openPrintable(`Сетка · игрок ${getPlayerDisplayName(player)}`, sections);
  }

  function exportComparePdf(comparison) {
    if (!comparison?.available) return false;
    const sections = [
      `<h2>Сравнение матчей</h2><table><thead><tr><th>Дата</th><th>Соперник</th><th>Действий</th><th>Подача +</th><th>Приём +</th><th>Атака +</th><th>Ошибки</th></tr></thead><tbody>${comparison.rows.map((rowItem) => `<tr><td>${escapeHtml(rowItem.date)}</td><td>${escapeHtml(rowItem.opponent)}</td><td>${rowItem.totalActions}</td><td>${window.SetkaStatsCore.formatPercent(rowItem.serve.plusPercent)}</td><td>${window.SetkaStatsCore.formatPercent(rowItem.receive.plusPercent)}</td><td>${window.SetkaStatsCore.formatPercent(rowItem.attack.plusPercent)}</td><td>${rowItem.errors.total}</td></tr>`).join('')}</tbody></table>`
    ];
    return openPrintable('Сетка · сравнение матчей', sections);
  }

  function exportSeasonPdf(seasonData, teamId, teamName) {
    if (!seasonData?.tournaments?.length) return false;
    const teamSeason = seasonData.teams?.[teamId] || {};
    const standingsTable = (tournament) => `
      <h2>${escapeHtml(tournament.title)}</h2>
      <p>${escapeHtml(tournament.subtitle || '')} · сезон ${escapeHtml(tournament.season || seasonData.season || '')}</p>
      ${tournament.note ? `<p>${escapeHtml(tournament.note)}</p>` : ''}
      <table>
        <thead><tr><th>Место</th><th>Команда</th><th>Город</th><th>Победы</th><th>Очки</th><th>СП</th><th>Статус</th></tr></thead>
        <tbody>${(tournament.standings || []).map((rowItem) => `<tr>
          <td>${escapeHtml(rowItem.place)}</td>
          <td>${escapeHtml(rowItem.team)}</td>
          <td>${escapeHtml(rowItem.city || '')}</td>
          <td>${escapeHtml(rowItem.wins)}</td>
          <td>${escapeHtml(rowItem.points)}</td>
          <td>${escapeHtml(rowItem.setRatio || '')}</td>
          <td>${escapeHtml(rowItem.badge || '')}</td>
        </tr>`).join('')}</tbody>
      </table>
    `;
    const finalFour = seasonData.tournaments.find((item) => item.finalFour)?.finalFour;
    const comparisonRows = (seasonData.comparison || []).map((item) => `<tr><td>${escapeHtml(item.title)}</td><td>${escapeHtml(item.robotech)}</td><td>${escapeHtml(item.robotech_2)}</td></tr>`).join('');
    const sections = [
      `<h2>Сезон ${escapeHtml(seasonData.season || '')}</h2><p>Официальные итоги выступления команды.</p>`,
      `<h2>Команда</h2><table><tbody>
        ${teamLogoRow(teamId)}
        ${row('Активная команда', teamName)}
        ${row('Сезон', seasonData.season)}
        ${row('Ключевые итоги', (teamSeason.highlights || []).join(', '))}
        ${row('Вывод', teamSeason.description || seasonData.conclusion || '')}
      </tbody></table>`,
      ...seasonData.tournaments.map(standingsTable),
      finalFour ? `<h2>${escapeHtml(finalFour.title)}</h2><p>${escapeHtml(finalFour.date)} · ${escapeHtml(finalFour.venue)}</p><table><thead><tr><th>Этап</th><th>Матч</th><th>Счёт</th><th>Статус</th></tr></thead><tbody>${finalFour.matches.map((match) => `<tr><td>${escapeHtml(match.stage)}</td><td>${escapeHtml(match.title)}</td><td>${escapeHtml(match.score)}</td><td>${escapeHtml(match.badge)}</td></tr>`).join('')}</tbody></table><p>${escapeHtml(finalFour.summary)}</p>` : '',
      `<h2>Сравнение команд</h2><table><thead><tr><th>Турнир</th><th>Роботех</th><th>Роботех 2.0</th></tr></thead><tbody>${comparisonRows}</tbody></table><p>${escapeHtml(seasonData.conclusion || '')}</p>`
    ];
    return openPrintable(`Сетка · сезон ${seasonData.season || ''} · ${teamName}`, sections);
  }

  window.SetkaPdfExport = {
    exportMatchPdf,
    exportTeamPdf,
    exportPlayerPdf,
    exportComparePdf,
    exportSeasonPdf
  };
})();
