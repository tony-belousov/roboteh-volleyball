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
      <thead><tr><th>Действие</th><th>Всего</th><th>Плюс</th><th>Минус</th><th>Средне</th></tr></thead>
      <tbody>${rows}</tbody>
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
    const teamStats = analytics?.teamStats || window.SetkaStatsCore.calculateTeamStats(match.events || [], teamId);
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
        ${row('Команда', match.ourTeam)}
        ${row('Соперник', match.opponent)}
        ${row('Дата', match.date)}
        ${row('Турнир', match.tournament)}
        ${row('Место', location)}
        ${row('Тип матча', match.matchType)}
        ${row('Формат', match.matchFormat)}
        ${row('Итоговый счёт', match.finalScore)}
        ${row('Счёт по партиям', (match.setScores || []).join(', '))}
        ${row('Результат', match.result)}
        ${row('Статус', match.status)}
        ${row('Комментарий тренера', match.coachComment)}
      </tbody></table>`,
      `<h2>Состав</h2><table><thead><tr><th>№</th><th>Игрок</th><th>Амплуа</th><th>Статус</th></tr></thead><tbody>${(match.roster || []).map((player) => `<tr><td>${escapeHtml(player.number)}</td><td>${getPlayerPhoto(player) ? `<img class="pdf-avatar" src="${escapeHtml(getPlayerPhoto(player))}" alt="">` : ''}${escapeHtml(getPlayerDisplayName(player))}</td><td>${escapeHtml(player.role)}</td><td>${escapeHtml(player.status)}</td></tr>`).join('')}</tbody></table>`,
      `<h2>Стартовый состав</h2><table><thead><tr><th>№</th><th>Игрок</th><th>Амплуа</th></tr></thead><tbody>${starters.map((player) => `<tr><td>${escapeHtml(player.number)}</td><td>${getPlayerPhoto(player) ? `<img class="pdf-avatar" src="${escapeHtml(getPlayerPhoto(player))}" alt="">` : ''}${escapeHtml(getPlayerDisplayName(player))}</td><td>${escapeHtml(player.role)}</td></tr>`).join('')}</tbody></table>`,
      `<h2>Скамейка</h2><table><thead><tr><th>№</th><th>Игрок</th><th>Амплуа</th></tr></thead><tbody>${bench.map((player) => `<tr><td>${escapeHtml(player.number)}</td><td>${getPlayerPhoto(player) ? `<img class="pdf-avatar" src="${escapeHtml(getPlayerPhoto(player))}" alt="">` : ''}${escapeHtml(getPlayerDisplayName(player))}</td><td>${escapeHtml(player.role)}</td></tr>`).join('')}</tbody></table>`,
      `<h2>Замены</h2>${substitutions.length ? `<table><thead><tr><th>Партия</th><th>Время</th><th>Ушёл</th><th>Вышел</th></tr></thead><tbody>${substitutions.map((item) => `<tr><td>${escapeHtml(item.setNumber || '')}</td><td>${escapeHtml(item.time || '')}</td><td>${escapeHtml(playerName(item.outPlayerId))}</td><td>${escapeHtml(playerName(item.inPlayerId))}</td></tr>`).join('')}</tbody></table>` : '<p>Замены не записаны.</p>'}`,
      `<h2>Командная статистика</h2>${actionTable(teamStats)}`,
      `<h2>Игроки</h2><table><thead><tr><th>Игрок</th><th>Амплуа</th><th>Действий</th><th>Ошибки</th></tr></thead><tbody>${playerStats.map((player) => `<tr><td>${escapeHtml(getPlayerDisplayName(player))}</td><td>${escapeHtml(player.role)}</td><td>${player.totalActions}</td><td>${player.errors}</td></tr>`).join('')}</tbody></table>`,
      `<h2>Амплуа</h2><table><thead><tr><th>Амплуа</th><th>Игроков</th><th>Действий</th><th>Вклад</th></tr></thead><tbody>${roleStats.map((role) => `<tr><td>${escapeHtml(role.role)}</td><td>${role.playerCount}</td><td>${role.totalActions}</td><td>${window.SetkaStatsCore.formatPercent(role.contributionPercent)}</td></tr>`).join('')}</tbody></table>`,
      `<h2>Партии</h2>${setStats.hasSetData ? `<table><thead><tr><th>Партия</th><th>Счёт</th><th>Действий</th></tr></thead><tbody>${setStats.sets.map((set) => `<tr><td>${escapeHtml(set.setNumber)}</td><td>${escapeHtml(set.score)}</td><td>${set.totalActions}</td></tr>`).join('')}</tbody></table>` : '<p>Статистика по партиям появится после записи партий.</p>'}`,
      `<h2>Лучшие показатели</h2><p>Самый активный игрок: ${escapeHtml(best.mostActive?.name || 'Недостаточно данных')}</p><p>Лучший матч команды: ${escapeHtml(best.bestTeamMatch?.opponent || 'Недостаточно данных')}</p>`,
      `<h2>Краткие выводы</h2><p>Всего записано действий: ${teamStats.totalActions}. Ошибок: ${teamStats.errors.total}. Подробные выводы требуют большего массива матчей и будут уточняться по мере накопления данных.</p>`
    ];

    return openPrintable(`Сетка · матч ${match.opponent}`, sections);
  }

  function exportTeamPdf(matches, title) {
    const teamId = matches?.[0]?.teamId || '';
    const teamName = matches?.[0]?.ourTeam || 'Команда';
    const season = window.SetkaStatsSeason.calculateSeasonStats(matches || [], teamId);
    const sections = [
      `<h2>Профиль</h2><p>${escapeHtml(teamName)}</p><h2>Период</h2><p>${escapeHtml(title || 'Все сохранённые матчи')}</p>`,
      `<h2>Сводка</h2><table><tbody>
        ${row('Матчей', season.totalMatches)}
        ${row('Победы / поражения', `${season.wins} / ${season.losses}`)}
        ${row('Партий', season.totalSets)}
        ${row('Действий', season.totalActions)}
        ${row('Среднее действий за матч', season.actionsPerMatch)}
      </tbody></table>`,
      `<h2>Матчи</h2><table><thead><tr><th>Дата</th><th>Соперник</th><th>Турнир</th><th>Место</th><th>Счёт</th><th>Результат</th></tr></thead><tbody>${(matches || []).map((match) => `<tr><td>${escapeHtml(match.date)}</td><td>${escapeHtml(match.opponent)}</td><td>${escapeHtml(match.tournament)}</td><td>${escapeHtml(match.location || match.venue)}</td><td>${escapeHtml(match.finalScore)}</td><td>${escapeHtml(match.result || '')}</td></tr>`).join('')}</tbody></table>`,
      `<h2>Команда</h2>${actionTable(season.teamStats)}`
    ];
    return openPrintable('Сетка · команда', sections);
  }

  function exportPlayerPdf(player, matches) {
    if (!player) return false;
    const teamId = matches?.[0]?.teamId || player.teamId || '';
    const dynamics = window.SetkaStatsPlayers.calculatePlayerDynamics(player.playerId, matches || [], teamId);
    const playerEvents = (matches || []).flatMap((match) => match.events || []).filter((event) => event.playerId === player.playerId && (!teamId || !event.teamId || event.teamId === teamId));
    const playerStats = window.SetkaStatsCore.calculateTeamStats(playerEvents);
    const sections = [
      `<h2>Игрок</h2><table><tbody>
        ${getPlayerPhoto(player) ? `<tr><th>Фото</th><td><img class="pdf-avatar" src="${escapeHtml(getPlayerPhoto(player))}" alt=""></td></tr>` : ''}
        ${row('ФИ', getPlayerDisplayName(player))}
        ${row('Команда', matches?.[0]?.ourTeam || player.teamName || '')}
        ${row('Амплуа', player.role)}
        ${row('Номер', player.number)}
        ${row('Рост', player.height ? `${player.height} см` : 'не указан')}
        ${row('Дата рождения', player.birthDate || 'не указана')}
        ${row('Действий', player.totalActions)}
        ${row('Ошибки', player.errors)}
      </tbody></table>`,
      `<h2>Статистика по действиям</h2>${actionTable(playerStats)}`,
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

  window.SetkaPdfExport = {
    exportMatchPdf,
    exportTeamPdf,
    exportPlayerPdf,
    exportComparePdf
  };
})();
