(function () {
  const ACTIVE_TEAM_KEY = 'setka.activeTeamId';
  const DEFAULT_TEAM_ID = 'robotech';
  const ROBOTECH_LOGO = 'assets/brand/robotech-logo.png';
  const TEAM_DEFAULT_PHOTOS = {
    robotech: 'assets/placeholders/robotech-default.png',
    robotech_2: 'assets/placeholders/robotech2-default.png'
  };

  function splitName(fullName) {
    const parts = String(fullName || '').trim().split(/\s+/);
    return {
      lastName: parts[0] || '',
      firstName: parts[1] || '',
      patronymic: parts.slice(2).join(' ')
    };
  }

  function getFullName(player) {
    if (typeof player === 'string') return player.trim();
    return String(player?.fullName || player?.name || `${player?.lastName || ''} ${player?.firstName || ''} ${player?.patronymic || ''}`.trim() || '').trim();
  }

  function getPlayerDisplayName(player) {
    if (!player) return '';
    const lastName = typeof player === 'string' ? '' : (player.lastName || '');
    const firstName = typeof player === 'string' ? '' : (player.firstName || '');
    if (lastName && firstName) return `${lastName} ${firstName}`.trim();

    const parts = getFullName(player).split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).join(' ') || getFullName(player);
  }

  function getTeamDefaultPhoto(teamId) {
    return TEAM_DEFAULT_PHOTOS[teamId] || '';
  }

  function getPlayerPhoto(player) {
    if (!player) return '';
    if (player.photo) return player.photo;
    return getTeamDefaultPhoto(player.teamId);
  }

  function makePlayer(player, overrides = {}) {
    const name = splitName(player.fullName);
    return {
      id: player.id,
      teamId: player.teamId,
      number: player.number,
      lastName: name.lastName,
      firstName: name.firstName,
      patronymic: name.patronymic,
      fullName: player.fullName,
      displayName: getPlayerDisplayName(player.fullName),
      birthDate: player.birthDate || '',
      registrationAddress: player.registrationAddress || '',
      photo: player.photo || getTeamDefaultPhoto(player.teamId),
      role: player.role || 'не указано',
      roleKey: player.roleKey || 'unknown',
      height: player.height || '',
      status: player.status || 'не указан',
      todo: player.todo || '',
      ...overrides
    };
  }

  const ROLE_ORDER = {
    opposite: 1,
    outside: 2,
    middle: 3,
    setter: 4,
    libero: 5,
    unknown: 6
  };
  const STARTER_ROLE_KEYS = ['opposite', 'outside', 'outside', 'middle', 'middle', 'setter', 'libero'];

  function makeStarterSlots(teamId, players) {
    const usedIds = new Set();
    const selectedPlayers = STARTER_ROLE_KEYS.map((roleKey) => {
      const player = players.find((item) => item.roleKey === roleKey && !usedIds.has(item.id));
      if (player) usedIds.add(player.id);
      return player;
    }).filter(Boolean);
    const fallbackPlayers = players
      .slice()
      .sort((a, b) => {
        const roleDiff = (ROLE_ORDER[a.roleKey] || ROLE_ORDER.unknown) - (ROLE_ORDER[b.roleKey] || ROLE_ORDER.unknown);
        return roleDiff || Number(a.number || 0) - Number(b.number || 0);
      })
      .filter((player) => !usedIds.has(player.id));

    return selectedPlayers
      .concat(fallbackPlayers)
      .slice(0, 7)
      .map((player, index) => ({
      slotId: `${teamId}-slot-${index + 1}`,
      label: player.role || 'не указано',
      tone: player.roleKey || 'unknown',
      playerId: player.id
    }));
  }

  const robotechPlayers = [
    makePlayer({ id: 'robotech-1', teamId: 'robotech', number: 1, fullName: 'Байнякшин Роман Сергеевич', birthDate: '1985-03-29', role: 'Связующий', roleKey: 'setter', status: 'основной состав' }),
    makePlayer({ id: 'robotech-2', teamId: 'robotech', number: 2, fullName: 'Биркин Александр Сергеевич', birthDate: '1993-06-18', role: 'Доигровщик', roleKey: 'outside', status: 'основной состав' }),
    makePlayer({ id: 'robotech-3', teamId: 'robotech', number: 3, fullName: 'Жученко Иван Петрович', birthDate: '1983-10-28', role: 'Блокирующий', roleKey: 'middle', status: 'основной состав' }),
    makePlayer({ id: 'robotech-4', teamId: 'robotech', number: 4, fullName: 'Кудряшов Егор Николаевич', birthDate: '1995-01-10', role: 'Диагональный', roleKey: 'opposite', status: 'основной состав' }),
    makePlayer({ id: 'robotech-5', teamId: 'robotech', number: 5, fullName: 'Лебедев Владимир Олегович', birthDate: '1989-12-05', role: 'Либеро', roleKey: 'libero', status: 'основной состав' }),
    makePlayer({ id: 'robotech-6', teamId: 'robotech', number: 6, fullName: 'Несоленов Андрей Юрьевич', birthDate: '1995-09-18', role: 'Доигровщик', roleKey: 'outside', status: 'основной состав' }),
    makePlayer({ id: 'robotech-7', teamId: 'robotech', number: 7, fullName: 'Охрименко Сергей Александрович', birthDate: '1991-03-31', role: 'Блокирующий', roleKey: 'middle', status: 'основной состав' }),
    makePlayer({ id: 'robotech-8', teamId: 'robotech', number: 8, fullName: 'Сивенцев Артем Александрович', birthDate: '1989-10-23', role: 'Доигровщик', roleKey: 'outside', status: 'запас' }),
    makePlayer({ id: 'robotech-9', teamId: 'robotech', number: 9, fullName: 'Сурков Олег Сергеевич', birthDate: '1998-07-19', role: 'Доигровщик', roleKey: 'outside', status: 'запас' }),
    makePlayer({
      id: 'robotech-10',
      teamId: 'robotech',
      number: 10,
      fullName: 'Ургебадзе Георгий Эдуардович',
      birthDate: '1984-05-11',
      role: 'Диагональный',
      roleKey: 'opposite',
      status: 'запас'
    }),
    makePlayer({ id: 'robotech-11', teamId: 'robotech', number: 11, fullName: 'Шеин Александр Денисович', birthDate: '1995-07-02', role: 'Связующий', roleKey: 'setter', status: 'запас' })
  ];

  const robotech2Players = [
    makePlayer({ id: 'robotech2-1', teamId: 'robotech_2', number: 1, fullName: 'Белоусов Антон Николаевич', birthDate: '1999-11-27', role: 'Связующий', roleKey: 'setter', status: 'основной состав' }),
    makePlayer({ id: 'robotech2-2', teamId: 'robotech_2', number: 2, fullName: 'Головин Максим Геннадьевич', birthDate: '1988-06-23', role: 'Доигровщик', roleKey: 'outside', status: 'основной состав' }),
    makePlayer({ id: 'robotech2-3', teamId: 'robotech_2', number: 3, fullName: 'Мищенко Илья Антонович', birthDate: '1997-02-14', role: 'Блокирующий', roleKey: 'middle', status: 'основной состав' }),
    makePlayer({ id: 'robotech2-4', teamId: 'robotech_2', number: 4, fullName: 'Рзаев Алексей Владимирович', birthDate: '1995-05-07', role: 'Диагональный', roleKey: 'opposite', status: 'основной состав' }),
    makePlayer({ id: 'robotech2-5', teamId: 'robotech_2', number: 5, fullName: 'Стариков Евгений Алексеевич', birthDate: '1997-03-11', role: 'Блокирующий', roleKey: 'middle', status: 'основной состав' }),
    makePlayer({
      id: 'robotech2-6',
      teamId: 'robotech_2',
      number: 6,
      fullName: 'Тистимиров Дмитрий Аркадьевич',
      birthDate: '1996-09-26',
      role: 'Доигровщик',
      roleKey: 'outside',
      status: 'основной состав'
    }),
    makePlayer({ id: 'robotech2-7', teamId: 'robotech_2', number: 7, fullName: 'Тюрин Дмитрий Александрович', birthDate: '1987-08-27', role: 'Связующий', roleKey: 'setter', status: 'запас' }),
    makePlayer({ id: 'robotech2-8', teamId: 'robotech_2', number: 8, fullName: 'Чарыев Мерген', birthDate: null, role: 'Либеро', roleKey: 'libero', status: 'основной состав', todo: 'Уточнить отчество и дату рождения.' }),
    makePlayer({ id: 'robotech2-9', teamId: 'robotech_2', number: 9, fullName: 'Чернышев Александр Андреевич', birthDate: '2006-08-25', role: 'Доигровщик', roleKey: 'outside', status: 'запас' }),
    makePlayer({
      id: 'robotech2-10',
      teamId: 'robotech_2',
      number: 10,
      fullName: 'Шляхтин Егор Андреевич',
      birthDate: '1990-09-10',
      role: 'Диагональный',
      roleKey: 'opposite',
      status: 'запас'
    }),
    makePlayer({ id: 'robotech2-11', teamId: 'robotech_2', number: 11, fullName: 'Яковлев Александр Иванович', birthDate: '1993-07-05', role: 'Доигровщик', roleKey: 'outside', status: 'запас' })
  ];

  const teams = [
    {
      id: 'robotech',
      name: 'Роботех',
      subtitle: 'Волейбольная команда · сезон 2026',
      description: 'Основной состав Роботеха для матчей, статистики и сезонной аналитики.',
      logoText: 'Р',
      logo: ROBOTECH_LOGO,
      contacts: [
        { label: 'Телефон', value: 'Будет заполнено' },
        { label: 'Почта', value: 'Будет заполнено' }
      ],
      socials: [
        { label: 'Соцсети', value: 'Будет заполнено' }
      ],
      staff: [
        { id: 'robotech-staff-1', name: 'Тренер не указан', role: 'тренерский состав' }
      ],
      coaches: [
        { id: 'robotech-staff-1', name: 'Тренер не указан', role: 'тренерский состав' }
      ],
      players: robotechPlayers,
      starterSlots: makeStarterSlots('robotech', robotechPlayers)
    },
    {
      id: 'robotech_2',
      name: 'Роботех 2.0',
      subtitle: 'Волейбольная команда · сезон 2026',
      description: 'Второй профиль Роботеха с отдельным составом, матчами и статистикой.',
      logoText: '2',
      logo: ROBOTECH_LOGO,
      contacts: [
        { label: 'Телефон', value: 'Будет заполнено' },
        { label: 'Почта', value: 'Будет заполнено' }
      ],
      socials: [
        { label: 'Соцсети', value: 'Будет заполнено' }
      ],
      staff: [
        { id: 'robotech2-staff-1', name: 'Тренер не указан', role: 'тренерский состав' }
      ],
      coaches: [
        { id: 'robotech2-staff-1', name: 'Тренер не указан', role: 'тренерский состав' }
      ],
      players: robotech2Players,
      starterSlots: makeStarterSlots('robotech_2', robotech2Players)
    }
  ];

  function getTeams() {
    return teams.map((team) => ({ ...team, players: team.players.slice(), starterSlots: team.starterSlots.slice() }));
  }

  function getTeam(teamId) {
    return getTeams().find((team) => team.id === teamId) || getTeams()[0];
  }

  function getActiveTeamId() {
    try {
      return localStorage.getItem(ACTIVE_TEAM_KEY) || DEFAULT_TEAM_ID;
    } catch (error) {
      return DEFAULT_TEAM_ID;
    }
  }

  function setActiveTeamId(teamId) {
    const nextTeamId = teams.some((team) => team.id === teamId) ? teamId : DEFAULT_TEAM_ID;
    localStorage.setItem(ACTIVE_TEAM_KEY, nextTeamId);
    return nextTeamId;
  }

  function getActiveTeam() {
    return getTeam(getActiveTeamId());
  }

  window.SetkaPlayerNames = {
    getFullName,
    getPlayerDisplayName,
    getPlayerPhoto,
    getTeamDefaultPhoto
  };

  window.SetkaTeams = {
    key: ACTIVE_TEAM_KEY,
    defaultTeamId: DEFAULT_TEAM_ID,
    getTeams,
    getTeam,
    getActiveTeam,
    getActiveTeamId,
    setActiveTeamId,
    getFullName,
    getPlayerDisplayName,
    getPlayerPhoto,
    getTeamDefaultPhoto
  };
})();
