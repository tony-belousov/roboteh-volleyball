(function () {
  const IMPORT_SOURCE = 'legacy_excel';
  const IMPORT_SOURCE_LABEL = 'Старый Excel';
  const ROBOTECH_ROSTOVDON_ID = 'legacy-robotech-rostovdon-2026-03-07';
  const ROBOTECH_DGTU_ID = 'legacy-import-robotech-dgtu-region-undated';
  const ROBOTECH2_ATOM_ID = 'legacy-import-robotech-2-atom-region-undated';
  const ROBOTECH2_RGUPS_ID = 'legacy-import-robotech-2-rgups-2025-10-01';
  const ARCHIVE_VERSION = '2026.06.13.archive.1';
  const LEGACY_MATCH_OVERRIDES_KEY = 'setka.legacyMatchOverrides';
  const LEGACY_IMAGE_SOURCE = 'legacy_image';
  const LEGACY_IMAGE_SOURCE_LABEL = 'Архивная таблица';

  const LEGACY_PLAYERS = {
    'Вова': { playerId: 'robotech-5' },
    'Артём': { playerId: 'robotech-8' },
    'Сергей': { playerId: 'robotech-7' },
    'Саня': { playerId: 'robotech-2' },
    'Олег': { playerId: 'robotech-9' },
    'Дима': { playerId: 'robotech2-6' }
  };

  const DGTU_PLAYERS = {
    'Вова': { playerId: 'robotech-5' },
    'Сергей': { playerId: 'robotech-7' },
    'Олег': { playerId: 'robotech-9' },
    'Артём': { playerId: 'robotech-8' },
    'Биркин': { playerId: 'robotech-2' },
    'Ваня': { playerId: 'robotech-3' },
    'Дима': { playerId: 'robotech2-6' },
    'Жора': { playerId: 'robotech-10' },
    'Андрей': { playerId: 'robotech-6' },
    'Егор': { playerId: 'robotech-4' }
  };

  const ROBOTECH2_ATOM_PLAYERS = {
    'Мерген': { playerId: 'robotech2-8' },
    'Антон': { playerId: 'robotech2-1' },
    'Женя': { playerId: 'robotech2-5' },
    'Саша Ч': { playerId: 'robotech2-9' },
    'Макс': { playerId: 'robotech2-2' },
    'Егор': { playerId: 'robotech2-10' },
    'Илья': { playerId: 'robotech2-3' },
    'Саня Я': { playerId: 'robotech2-11' },
    'Тюрин': { playerId: 'robotech2-7' }
  };

  const ROBOTECH2_RGUPS_PLAYERS = {
    'Егор': { playerId: 'robotech2-10' },
    'Антон': { playerId: 'robotech2-1' },
    'Женя': { playerId: 'robotech2-5' },
    'Макс': { playerId: 'robotech2-2' },
    'Мерген': { playerId: 'robotech2-8' },
    'Илья': { playerId: 'robotech2-3' },
    'Тюрин': { playerId: 'robotech2-7' },
    'Леха': { playerId: 'robotech2-4' },
    'Саня': { playerId: 'robotech2-9' }
  };

  const SET_ROWS = {
    1: [
      ['Вова', 4, 1, 0, 7, 2, 1, 0, 0, 1, 0, 0, 3, 0, 0, 0, 1],
      ['Артём', 2, 1, 0, 3, 3, 0, 1, 0, 0, 0, 0, 3, 0, 1, 1, 0],
      ['Сергей', 0, 0, 0, 6, 3, 1, 2, 0, 1, 2, 0, 4, 0, 0, 3, 0],
      ['Саня', 2, 1, 0, 3, 0, 1, 1, 0, 1, 0, 0, 2, 0, 0, 2, 0],
      ['Олег', 7, 3, 1, 5, 3, 0, 0, 0, 1, 0, 0, 6, 1, 1, 3, 0],
      ['Дима', 0, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 7, 1, 0, 4, 0]
    ],
    2: [
      ['Вова', 6, 2, 0, 11, 3, 1, 0, 0, 0, 1, 0, 3, 0, 0, 1, 0],
      ['Артём', 6, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 2, 0, 1, 1, 0],
      ['Сергей', 1, 0, 1, 3, 0, 0, 0, 0, 2, 0, 0, 3, 0, 2, 1, 0],
      ['Саня', 5, 2, 0, 1, 1, 0, 1, 0, 0, 1, 0, 2, 0, 0, 2, 0],
      ['Олег', 2, 1, 0, 9, 5, 2, 0, 0, 0, 0, 0, 7, 1, 1, 2, 0],
      ['Дима', 0, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 4, 0, 0, 2, 2]
    ],
    3: [
      ['Вова', 5, 1, 1, 11, 5, 0, 0, 0, 2, 2, 0, 6, 0, 0, 3, 0],
      ['Артём', 4, 2, 0, 4, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],
      ['Сергей', 1, 0, 0, 8, 2, 3, 0, 0, 0, 0, 0, 6, 1, 1, 4, 0],
      ['Саня', 0, 0, 0, 2, 0, 1, 0, 0, 1, 1, 0, 4, 0, 1, 0, 1],
      ['Олег', 3, 3, 0, 2, 1, 0, 0, 0, 0, 0, 0, 4, 0, 1, 3, 0],
      ['Дима', 0, 0, 0, 1, 0, 1, 0, 0, 2, 2, 0, 4, 0, 0, 1, 0]
    ],
    4: [
      ['Вова', 9, 6, 0, 8, 5, 1, 0, 0, 0, 3, 0, 4, 0, 0, 4, 0],
      ['Артём', 6, 3, 0, 4, 0, 1, 0, 0, 3, 0, 0, 2, 0, 0, 1, 0],
      ['Сергей', 0, 0, 0, 6, 3, 2, 1, 0, 0, 0, 0, 8, 0, 0, 5, 0],
      ['Саня', 3, 1, 0, 2, 2, 0, 1, 0, 4, 0, 0, 3, 0, 0, 0, 0],
      ['Олег', 1, 0, 0, 3, 2, 0, 0, 0, 1, 0, 0, 4, 0, 3, 1, 0],
      ['Дима', 0, 0, 0, 2, 0, 0, 1, 0, 1, 1, 0, 3, 0, 1, 1, 2]
    ]
  };

  const DGTU_SET_ROWS = {
    1: [
      ['Вова', 2, 0, 1, 11, 4, 4, 0, 0, 0, 1, 0, 3, 1, 0, 0, 0],
      ['Сергей', 0, 0, 0, 4, 1, 1, 0, 0, 0, 1, 0, 4, 1, 0, 3, 0],
      ['Олег', 5, 2, 0, 7, 4, 0, 0, 0, 0, 0, 0, 3, 1, 0, 0, 0],
      ['Артём', 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0],
      ['Биркин', 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 6, 2, 0, 1, 0],
      ['Ваня', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ['Дима', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 2, 1],
      ['Жора', 9, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ['Андрей', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ['Егор', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ],
    2: [
      ['Вова', 7, 4, 0, 6, 5, 1, 1, 0, 1, 1, 0, 2, 0, 1, 0, 0],
      ['Сергей', 0, 0, 0, 7, 4, 0, 0, 0, 0, 0, 0, 6, 2, 0, 3, 0],
      ['Олег', 9, 4, 2, 3, 1, 2, 0, 0, 0, 0, 0, 2, 0, 2, 0, 0],
      ['Артём', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0],
      ['Биркин', 0, 0, 0, 4, 0, 1, 0, 0, 2, 1, 0, 3, 0, 0, 1, 0],
      ['Ваня', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 1, 0, 0],
      ['Дима', 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 6, 1, 0, 3, 0],
      ['Жора', 3, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ['Андрей', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ['Егор', 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 2, 0, 1, 0, 0]
    ],
    3: [
      ['Вова', 8, 7, 0, 9, 5, 0, 2, 0, 0, 0, 0, 5, 1, 0, 0, 0],
      ['Сергей', 0, 0, 0, 7, 0, 3, 0, 0, 0, 0, 0, 4, 1, 1, 1, 0],
      ['Олег', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ['Артём', 0, 0, 0, 2, 2, 0, 0, 0, 1, 1, 0, 2, 0, 0, 1, 0],
      ['Биркин', 0, 0, 0, 4, 3, 0, 0, 0, 0, 0, 0, 2, 0, 1, 0, 0],
      ['Ваня', 0, 0, 0, 2, 1, 0, 0, 0, 1, 1, 0, 2, 2, 0, 0, 0],
      ['Дима', 0, 0, 0, 2, 2, 0, 0, 0, 1, 0, 0, 5, 0, 0, 1, 1],
      ['Жора', 6, 3, 1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ['Андрей', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ['Егор', 7, 4, 0, 4, 2, 1, 0, 0, 0, 0, 0, 5, 0, 0, 2, 0]
    ]
  };

  const ATOM_SET_ROWS = {
    1: [
      ['Мерген', 0, 0, 0, 8, 1, 2, 0, 0, 0, 1, 0, 2, 0, 0, 0, 1],
      ['Антон', 3, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 5, 0, 0, 1, 0],
      ['Женя', 0, 0, 0, 2, 0, 2, 0, 0, 1, 0, 0, 3, 0, 0, 2, 2],
      ['Саша Ч', 0, 0, 0, 2, 1, 1, 0, 0, 0, 1, 0, 3, 0, 0, 1, 0],
      ['Макс', 0, 0, 0, 2, 1, 0, 0, 0, 2, 1, 0, 2, 0, 1, 1, 0],
      ['Егор', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ['Илья', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ['Саня Я', 7, 3, 3, 6, 3, 1, 0, 0, 0, 0, 0, 4, 1, 1, 1, 0],
      ['Тюрин', 3, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ],
    2: [
      ['Мерген', 0, 0, 0, 9, 8, 1, 0, 0, 0, 1, 0, 4, 0, 2, 0, 0],
      ['Антон', 8, 5, 0, 5, 1, 0, 0, 0, 0, 0, 0, 4, 1, 2, 1, 0],
      ['Женя', 0, 0, 0, 2, 1, 1, 1, 0, 1, 1, 0, 5, 0, 0, 3, 2],
      ['Саша Ч', 0, 0, 0, 2, 1, 0, 1, 0, 2, 1, 0, 3, 0, 1, 0, 0],
      ['Макс', 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 6, 2, 0, 3, 0],
      ['Егор', 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ['Илья', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0],
      ['Саня Я', 6, 2, 2, 5, 2, 1, 0, 0, 0, 0, 0, 2, 0, 1, 0, 0],
      ['Тюрин', 8, 4, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ],
    3: [
      ['Мерген', 0, 0, 0, 7, 3, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
      ['Антон', 6, 2, 3, 5, 3, 0, 0, 0, 1, 0, 0, 2, 0, 0, 2, 0],
      ['Женя', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 1, 1, 0],
      ['Саша Ч', 0, 0, 0, 1, 0, 0, 0, 0, 2, 2, 0, 2, 0, 0, 1, 0],
      ['Макс', 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 6, 0, 0, 3, 0],
      ['Егор', 0, 0, 0, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ['Илья', 2, 1, 0, 3, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ['Саня Я', 4, 0, 1, 6, 3, 2, 0, 0, 0, 0, 0, 2, 0, 0, 1, 0],
      ['Тюрин', 9, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ]
  };

  const RGUPS_SET_ROWS = {
    1: [
      ['Егор', 6, 5, 1, 6, 2, 0, 1, 0, 0, 1, 0, 3, 0, 0, 0, 0],
      ['Антон', 6, 2, 2, 7, 3, 2, 0, 0, 1, 0, 0, 4, 0, 1, 0, 0],
      ['Женя', 2, 1, 0, 5, 3, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],
      ['Макс', 0, 0, 0, 7, 3, 1, 0, 0, 0, 1, 0, 6, 0, 0, 0, 0],
      ['Мерген', 0, 0, 0, 10, 3, 1, 0, 3, 1, 1, 0, 4, 0, 1, 0, 1],
      ['Илья', 0, 0, 0, 3, 1, 0, 0, 0, 2, 1, 0, 3, 0, 2, 0, 0],
      ['Тюрин', 0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 7, 1, 0, 0, 2],
      ['Леха', 11, 6, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ['Саня', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ],
    2: [
      ['Егор', 4, 3, 0, 6, 1, 1, 0, 2, 0, 0, 0, 4, 0, 1, 0, 0],
      ['Антон', 2, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ['Женя', 1, 1, 0, 2, 1, 0, 0, 0, 0, 1, 0, 2, 0, 1, 0, 0],
      ['Макс', 0, 0, 0, 2, 1, 0, 0, 0, 1, 1, 0, 2, 0, 1, 0, 0],
      ['Мерген', 0, 0, 0, 6, 3, 0, 0, 0, 0, 1, 0, 2, 0, 1, 0, 0],
      ['Илья', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ['Тюрин', 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 10, 1, 0, 0, 1],
      ['Леха', 6, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ['Саня', 0, 0, 0, 4, 0, 2, 0, 0, 4, 4, 0, 3, 0, 1, 0, 0]
    ],
    3: [
      ['Егор', 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0],
      ['Антон', 1, 0, 0, 7, 4, 1, 0, 0, 2, 0, 0, 5, 0, 0, 0, 1],
      ['Женя', 7, 3, 0, 5, 4, 0, 0, 0, 2, 0, 0, 1, 0, 1, 0, 0],
      ['Макс', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ['Мерген', 0, 0, 0, 4, 2, 1, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0],
      ['Илья', 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 4, 1, 0, 0, 0],
      ['Тюрин', 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 9, 2, 0, 0, 1],
      ['Леха', 5, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ['Саня', 0, 0, 0, 3, 1, 2, 0, 0, 3, 1, 0, 4, 0, 2, 0, 0]
    ],
    4: [
      ['Егор', 1, 1, 0, 2, 0, 2, 0, 0, 0, 0, 0, 4, 1, 0, 0, 0],
      ['Антон', 2, 1, 0, 7, 5, 1, 0, 0, 0, 0, 0, 5, 1, 0, 0, 0],
      ['Женя', 4, 3, 0, 3, 2, 0, 0, 0, 0, 0, 0, 5, 2, 2, 0, 0],
      ['Макс', 0, 0, 0, 4, 2, 0, 0, 0, 0, 1, 0, 5, 1, 1, 0, 0],
      ['Мерген', 0, 0, 0, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ['Илья', 0, 0, 0, 1, 1, 0, 0, 0, 2, 2, 0, 2, 0, 0, 0, 0],
      ['Тюрин', 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 3, 0, 0, 0, 0],
      ['Леха', 4, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ['Саня', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ]
  };

  const LEGACY_MATCH_ARCHIVE = [
    {
      id: 'legacy-image-robotech-2025-10-06',
      teamId: 'robotech',
      teamName: 'Роботех',
      opponent: 'Не указано',
      date: '2025-10-06',
      displayDate: '06.10.2025',
      tournament: 'Не указано',
      originalFileName: 'роботех 06.10.2025.jpg',
      sourceImage: 'assets/legacy-matches/robotech-2025-10-06.jpg',
      reviewStatus: 'needs_opponent_review'
    },
    {
      id: 'legacy-image-robotech-2-2026-02-03',
      teamId: 'robotech_2',
      teamName: 'Роботех 2.0',
      opponent: 'Не указано',
      date: '2026-02-03',
      displayDate: '03.02.2026',
      tournament: 'Не указано',
      originalFileName: 'роботех 2.0 03.02.2026.jpg',
      sourceImage: 'assets/legacy-matches/robotech-2-2026-02-03.jpg',
      reviewStatus: 'needs_opponent_review'
    },
    {
      id: 'legacy-image-robotech-2-2025-10-06-unverified',
      teamId: 'robotech_2',
      teamName: 'Роботех 2.0',
      opponent: 'Не указано',
      date: null,
      displayDate: 'Не указано',
      dateNote: 'В названии файла есть 6.10, но год не указан',
      tournament: 'Не указано',
      originalFileName: 'роботех 2.0 6.10.jpg',
      sourceImage: 'assets/legacy-matches/robotech-2-2025-10-06-unverified.jpg',
      reviewStatus: 'needs_date_and_opponent_review'
    },
    {
      id: 'legacy-image-robotech-2025-12-20',
      teamId: 'robotech',
      teamName: 'Роботех',
      opponent: 'Не указано',
      date: '2025-12-20',
      displayDate: '20.12.2025',
      tournament: 'Не указано',
      originalFileName: 'роботех 20.12.2025.jpg',
      sourceImage: 'assets/legacy-matches/robotech-2025-12-20.jpg',
      reviewStatus: 'needs_opponent_review'
    }
  ];

  // Архивные картинки не превращаются в liveEvents. После внешней оцифровки таблицы матч переводится в importedStats.
  // Обычный пользователь приложения не должен вручную забивать статистику из изображения.

  function getPlayerDisplayName(player) {
    if (window.SetkaPlayerNames) return window.SetkaPlayerNames.getPlayerDisplayName(player);
    const value = player?.fullName || player?.name || '';
    return String(value).split(/\s+/).filter(Boolean).slice(0, 2).join(' ') || value;
  }

  function getPlayerPhoto(player) {
    if (window.SetkaPlayerNames?.getPlayerPhoto) return window.SetkaPlayerNames.getPlayerPhoto(player);
    return player?.photo || '';
  }

  function safeLoadOverrides() {
    try {
      const raw = localStorage.getItem(LEGACY_MATCH_OVERRIDES_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function safeSaveOverrides(value) {
    try {
      localStorage.setItem(LEGACY_MATCH_OVERRIDES_KEY, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  function formatDisplayDate(date) {
    if (!date) return 'Не указано';
    const parts = String(date).split('-');
    if (parts.length !== 3) return String(date);
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }

  function isMeaningful(value) {
    return value !== null && typeof value !== 'undefined' && String(value).trim() !== '';
  }

  function getLegacyMatchOverrides() {
    return safeLoadOverrides();
  }

  function saveLegacyMatchOverride(matchId, patch) {
    const id = String(matchId || '');
    if (!id) return false;
    const overrides = safeLoadOverrides();
    const previous = overrides[id] || {};
    const next = {
      ...previous,
      source: 'user_override',
      updatedBy: 'local',
      syncStatus: 'local_only',
      baseVersion: ARCHIVE_VERSION,
      updatedAt: new Date().toISOString()
    };
    ['opponent', 'date', 'tournament', 'comment'].forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(patch || {}, field)) {
        next[field] = String(patch[field] || '').trim();
      }
    });
    overrides[id] = next;
    return safeSaveOverrides(overrides);
  }

  function resetLegacyMatchOverride(matchId) {
    const id = String(matchId || '');
    if (!id) return false;
    const overrides = safeLoadOverrides();
    if (!overrides[id]) return true;
    delete overrides[id];
    return safeSaveOverrides(overrides);
  }

  function metadataNeedsReview(match) {
    const missing = [];
    if (!isMeaningful(match.date)) missing.push('дату');
    if (!isMeaningful(match.opponent) || match.opponent === 'Не указано') missing.push('соперника');
    return missing;
  }

  function applyLegacyMatchOverride(match, overrides = safeLoadOverrides()) {
    const override = overrides[match.id];
    const next = { ...match };
    if (override) {
      ['opponent', 'date', 'tournament', 'comment'].forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(override, field)) next[field] = override[field];
      });
      next.localOverride = true;
      next.override = override;
      next.updatedAt = override.updatedAt || next.updatedAt;
      next.displayDate = formatDisplayDate(next.date);
    }
    next.metadataMissing = metadataNeedsReview(next);
    return next;
  }

  function metricRow(row, setNumber, teamData, playerMap = LEGACY_PLAYERS) {
    const [
      legacyName,
      receiveTotal,
      receiveQuality,
      receiveError,
      attackTotal,
      attackPoint,
      attackError,
      defenseQuality,
      defenseError,
      blockSoft,
      blockPoint,
      blockError,
      serveTotal,
      serveAce,
      serveError,
      serveDisrupted,
      miscErrors
    ] = row;
    const mapping = playerMap[legacyName] || {};
    const player = (teamData.players || []).find((item) => item.id === mapping.playerId) || {};
    const displayName = getPlayerDisplayName(player) || legacyName;

    return {
      legacyName,
      playerId: mapping.playerId || '',
      teamId: teamData.id,
      playerNumber: player.number || '',
      playerName: displayName,
      fullName: player.fullName || displayName,
      playerRole: player.role || 'не указано',
      roleKey: player.roleKey || 'unknown',
      height: player.height || '',
      birthDate: player.birthDate || '',
      photo: getPlayerPhoto(player),
      setNumber,
      receive: { total: receiveTotal, quality: receiveQuality, error: receiveError },
      attack: { total: attackTotal, point: attackPoint, error: attackError },
      defense: { quality: defenseQuality, error: defenseError },
      block: { soft: blockSoft, point: blockPoint, error: blockError },
      serve: { total: serveTotal, ace: serveAce, error: serveError, disruptedReceive: serveDisrupted },
      miscErrors: { total: miscErrors }
    };
  }

  function emptySummary(player) {
    return {
      playerId: player.playerId,
      teamId: player.teamId,
      playerNumber: player.playerNumber,
      playerName: player.playerName,
      fullName: player.fullName,
      playerRole: player.playerRole,
      roleKey: player.roleKey,
      height: player.height,
      birthDate: player.birthDate,
      photo: player.photo,
      receive: { total: 0, quality: 0, error: 0 },
      attack: { total: 0, point: 0, error: 0 },
      defense: { quality: 0, error: 0 },
      block: { soft: 0, point: 0, error: 0 },
      serve: { total: 0, ace: 0, error: 0, disruptedReceive: 0 },
      miscErrors: { total: 0 },
      percentages: {}
    };
  }

  function addMetric(target, source) {
    target.receive.total += source.receive.total || 0;
    target.receive.quality += source.receive.quality || 0;
    target.receive.error += source.receive.error || 0;
    target.attack.total += source.attack.total || 0;
    target.attack.point += source.attack.point || 0;
    target.attack.error += source.attack.error || 0;
    target.defense.quality += source.defense.quality || 0;
    target.defense.error += source.defense.error || 0;
    target.block.soft += source.block.soft || 0;
    target.block.point += source.block.point || 0;
    target.block.error += source.block.error || 0;
    target.serve.total += source.serve.total || 0;
    target.serve.ace += source.serve.ace || 0;
    target.serve.error += source.serve.error || 0;
    target.serve.disruptedReceive += source.serve.disruptedReceive || 0;
    target.miscErrors.total += source.miscErrors.total || 0;
  }

  function percent(part, total) {
    return total > 0 ? Math.round((part / total) * 1000) / 10 : 0;
  }

  function finalizeSummary(row) {
    row.percentages = {
      serveQuality: percent(row.serve.ace + row.serve.disruptedReceive, row.serve.total),
      serveError: percent(row.serve.error, row.serve.total),
      receiveQuality: percent(row.receive.quality, row.receive.total),
      receiveError: percent(row.receive.error, row.receive.total),
      attackPoint: percent(row.attack.point, row.attack.total),
      attackError: percent(row.attack.error, row.attack.total)
    };
    return row;
  }

  function buildSummary(sets) {
    const byPlayer = new Map();
    sets.forEach((set) => {
      set.players.forEach((player) => {
        if (!byPlayer.has(player.playerId)) byPlayer.set(player.playerId, emptySummary(player));
        addMetric(byPlayer.get(player.playerId), player);
      });
    });
    return Array.from(byPlayer.values()).map(finalizeSummary);
  }

  function rosterFromSummary(summary) {
    return summary.map((player) => ({
      playerId: player.playerId,
      id: player.playerId,
      teamId: player.teamId,
      number: player.playerNumber,
      name: player.playerName,
      fullName: player.fullName,
      role: player.playerRole,
      roleKey: player.roleKey,
      height: player.height,
      birthDate: player.birthDate,
      photo: player.photo,
      status: 'старт'
    }));
  }

  function buildRobotechRostovDon(teamData) {
    const sets = Object.entries(SET_ROWS).map(([setNumber, rows]) => ({
      setNumber: Number(setNumber),
      score: '',
      players: rows.map((row) => metricRow(row, Number(setNumber), teamData))
    }));
    const summary = buildSummary(sets);

    return {
      id: ROBOTECH_ROSTOVDON_ID,
      matchId: ROBOTECH_ROSTOVDON_ID,
      teamId: 'robotech',
      teamName: 'Роботех',
      ourTeam: 'Роботех',
      opponent: 'РостовДон',
      date: '2026-03-07',
      tournament: 'Чемпионат города Ростова-на-Дону',
      location: 'Место не указано',
      venue: 'Место не указано',
      status: 'завершён',
      matchType: 'официальный',
      matchFormat: 'до 5 партий',
      finalScore: '',
      setScores: [],
      result: '',
      source: IMPORT_SOURCE,
      sourceLabel: IMPORT_SOURCE_LABEL,
      dataType: 'importedStats',
      imported: true,
      readOnly: true,
      hasLiveEvents: false,
      importedSets: sets.length,
      setsCount: sets.length,
      events: [],
      substitutions: [],
      roster: rosterFromSummary(summary),
      startingLineup: rosterFromSummary(summary).map((player, index) => ({
        slotId: `${ROBOTECH_ROSTOVDON_ID}-slot-${index + 1}`,
        label: player.role,
        tone: player.roleKey,
        playerId: player.playerId
      })),
      bench: [],
      importedStats: {
        source: 'excel',
        sourceLabel: IMPORT_SOURCE_LABEL,
        originalFile: 'Роботех-РостовДон 7.03.26.xlsx',
        sets,
        summary
      },
      createdAt: '2026-03-07T12:00:00.000Z',
      updatedAt: '2026-03-07T12:00:00.000Z',
      title: 'Роботех — РостовДон'
    };
  }

  function buildRobotechDgtuRegion(teamData) {
    const sets = Object.entries(DGTU_SET_ROWS).map(([setNumber, rows]) => ({
      setNumber: Number(setNumber),
      score: '',
      players: rows.map((row) => metricRow(row, Number(setNumber), teamData, DGTU_PLAYERS))
    }));
    const summary = buildSummary(sets);
    const roster = rosterFromSummary(summary);

    return {
      id: ROBOTECH_DGTU_ID,
      matchId: ROBOTECH_DGTU_ID,
      teamId: 'robotech',
      teamName: 'Роботех',
      ourTeam: 'Роботех',
      opponent: 'ДГТУ',
      date: null,
      displayDate: 'Не указано',
      dateNote: 'Дата в архивной таблице не указана',
      tournament: 'Чемпионат Ростовской области',
      location: 'Не указано',
      venue: 'Не указано',
      status: 'завершён',
      matchType: 'официальный',
      matchFormat: 'архивная таблица',
      finalScore: '',
      setScores: [],
      result: '',
      source: 'legacy_image_digitized',
      sourceLabel: LEGACY_IMAGE_SOURCE_LABEL,
      originalFileName: 'роботех - ДГТУ город.jpg',
      sourceImage: 'assets/legacy-matches/robotech-dgtu-city.jpg',
      dataType: 'importedStats',
      imported: true,
      readOnly: true,
      editableMetadata: true,
      metadataEditable: true,
      statsEditableInApp: false,
      hasLiveEvents: false,
      importedSets: sets.length,
      setsCount: sets.length,
      events: [],
      substitutions: [],
      roster,
      startingLineup: roster.map((player, index) => ({
        slotId: `${ROBOTECH_DGTU_ID}-slot-${index + 1}`,
        label: player.role,
        tone: player.roleKey,
        playerId: player.playerId
      })),
      bench: [],
      importedStats: {
        source: 'legacy_image_digitized',
        sourceLabel: LEGACY_IMAGE_SOURCE_LABEL,
        originalFile: 'роботех - ДГТУ город.jpg',
        sourceImage: 'assets/legacy-matches/robotech-dgtu-city.jpg',
        sets,
        summary
      },
      createdAt: '2026-06-13T12:30:00.000Z',
      updatedAt: '2026-06-13T12:30:00.000Z',
      title: 'Роботех — ДГТУ',
      archiveVersion: ARCHIVE_VERSION,
      syncStatus: 'base'
    };
  }

  function buildRobotech2AtomRegion(teamData) {
    const sets = Object.entries(ATOM_SET_ROWS).map(([setNumber, rows]) => ({
      setNumber: Number(setNumber),
      score: '',
      players: rows.map((row) => metricRow(row, Number(setNumber), teamData, ROBOTECH2_ATOM_PLAYERS))
    }));
    const summary = buildSummary(sets);
    const roster = rosterFromSummary(summary);

    return {
      id: ROBOTECH2_ATOM_ID,
      matchId: ROBOTECH2_ATOM_ID,
      teamId: 'robotech_2',
      teamName: 'Роботех 2.0',
      ourTeam: 'Роботех 2.0',
      opponent: 'Атом',
      date: null,
      displayDate: 'Не указано',
      dateNote: 'Дата в архивной таблице не указана',
      tournament: 'Чемпионат Ростовской области',
      location: 'Не указано',
      venue: 'Не указано',
      status: 'завершён',
      matchType: 'официальный',
      matchFormat: 'архивная таблица',
      finalScore: null,
      setScores: [],
      result: '',
      source: 'legacy_image_digitized',
      sourceLabel: LEGACY_IMAGE_SOURCE_LABEL,
      originalFileName: 'роботех 2.0 - Атом область.jpg',
      sourceImage: 'assets/legacy-matches/robotech-2-atom-region.jpg',
      dataType: 'importedStats',
      imported: true,
      readOnly: true,
      editableMetadata: true,
      metadataEditable: true,
      statsEditableInApp: false,
      hasLiveEvents: false,
      importedSets: sets.length,
      setsCount: sets.length,
      events: [],
      substitutions: [],
      roster,
      startingLineup: roster.map((player, index) => ({
        slotId: `${ROBOTECH2_ATOM_ID}-slot-${index + 1}`,
        label: player.role,
        tone: player.roleKey,
        playerId: player.playerId
      })),
      bench: [],
      importedStats: {
        source: 'legacy_image_digitized',
        sourceLabel: LEGACY_IMAGE_SOURCE_LABEL,
        originalFile: 'роботех 2.0 - Атом область.jpg',
        sourceImage: 'assets/legacy-matches/robotech-2-atom-region.jpg',
        sets,
        summary
      },
      createdAt: '2026-06-13T13:00:00.000Z',
      updatedAt: '2026-06-13T13:00:00.000Z',
      title: 'Роботех 2.0 — Атом',
      archiveVersion: ARCHIVE_VERSION,
      syncStatus: 'base'
    };
  }

  function buildRobotech2Rgups(teamData) {
    const setScores = ['26:28', '25:14', '25:17', '25:11'];
    const sets = Object.entries(RGUPS_SET_ROWS).map(([setNumber, rows]) => ({
      setNumber: Number(setNumber),
      score: setScores[Number(setNumber) - 1] || '',
      players: rows.map((row) => metricRow(row, Number(setNumber), teamData, ROBOTECH2_RGUPS_PLAYERS))
    }));
    const summary = buildSummary(sets);
    const roster = rosterFromSummary(summary);

    return {
      id: ROBOTECH2_RGUPS_ID,
      matchId: ROBOTECH2_RGUPS_ID,
      teamId: 'robotech_2',
      teamName: 'Роботех 2.0',
      ourTeam: 'Роботех 2.0',
      opponent: 'РГУПС',
      date: '2025-10-01',
      displayDate: '01.10.2025',
      tournament: 'Не указано',
      location: 'Не указано',
      venue: 'Не указано',
      status: 'завершён',
      matchType: 'официальный',
      matchFormat: 'архивная таблица',
      finalScore: '3:1',
      setScores,
      result: 'победа',
      source: 'legacy_image_digitized',
      sourceLabel: LEGACY_IMAGE_SOURCE_LABEL,
      originalFileName: 'роботех 2.0 - ргупс 1.10.2025.jpg',
      sourceImage: 'assets/legacy-matches/robotech-2-rgups-2025-10-01.jpg',
      dataType: 'importedStats',
      imported: true,
      readOnly: true,
      editableMetadata: true,
      metadataEditable: true,
      statsEditableInApp: false,
      hasLiveEvents: false,
      importedSets: sets.length,
      setsCount: sets.length,
      events: [],
      substitutions: [],
      roster,
      startingLineup: roster.map((player, index) => ({
        slotId: `${ROBOTECH2_RGUPS_ID}-slot-${index + 1}`,
        label: player.role,
        tone: player.roleKey,
        playerId: player.playerId
      })),
      bench: [],
      importedStats: {
        source: 'legacy_image_digitized',
        sourceLabel: LEGACY_IMAGE_SOURCE_LABEL,
        originalFile: 'роботех 2.0 - ргупс 1.10.2025.jpg',
        sourceImage: 'assets/legacy-matches/robotech-2-rgups-2025-10-01.jpg',
        sets,
        summary
      },
      createdAt: '2026-06-13T13:10:00.000Z',
      updatedAt: '2026-06-13T13:10:00.000Z',
      title: 'Роботех 2.0 — РГУПС',
      archiveVersion: ARCHIVE_VERSION,
      syncStatus: 'base'
    };
  }

  function buildLegacyImageMatch(base) {
    const createdAt = '2026-06-13T12:00:00.000Z';
    return {
      id: base.id,
      matchId: base.id,
      teamId: base.teamId,
      teamName: base.teamName,
      ourTeam: base.teamName,
      opponent: base.opponent || 'Не указано',
      date: base.date || '',
      displayDate: base.displayDate || formatDisplayDate(base.date),
      dateNote: base.dateNote || '',
      tournament: base.tournament || 'Не указано',
      location: 'Не указано',
      venue: 'Не указано',
      status: 'legacyImage',
      workflowStatus: 'digitizingPlanned',
      digitizingStatus: 'pending',
      reviewStatus: base.reviewStatus || 'needs_stats_digitizing',
      matchType: 'архивный',
      matchFormat: 'архивная таблица',
      finalScore: '',
      setScores: [],
      result: '',
      source: LEGACY_IMAGE_SOURCE,
      sourceLabel: LEGACY_IMAGE_SOURCE_LABEL,
      originalFileName: base.originalFileName,
      sourceImage: base.sourceImage,
      dataType: 'legacyImage',
      imported: true,
      readOnly: true,
      editableMetadata: true,
      metadataEditable: true,
      statsEditableInApp: false,
      hasLiveEvents: false,
      importedStats: null,
      events: [],
      substitutions: [],
      roster: [],
      startingLineup: [],
      bench: [],
      createdAt,
      updatedAt: createdAt,
      title: `${base.teamName} — ${base.opponent || 'Не указано'}`,
      archiveVersion: ARCHIVE_VERSION,
      syncStatus: 'base'
    };
  }

  function getLegacyImageMatches(teamData) {
    if (!teamData?.id) return [];
    const overrides = safeLoadOverrides();
    return LEGACY_MATCH_ARCHIVE
      .filter((match) => match.teamId === teamData.id)
      .map(buildLegacyImageMatch)
      .map((match) => applyLegacyMatchOverride(match, overrides));
  }

  function getImportedMatches(teamData) {
    if (!teamData) return [];
    const matches = getLegacyImageMatches(teamData);
    if (teamData.id === 'robotech') {
      const overrides = safeLoadOverrides();
      matches.unshift(applyLegacyMatchOverride(buildRobotechDgtuRegion(teamData), overrides));
      matches.unshift(buildRobotechRostovDon(teamData));
    }
    if (teamData.id === 'robotech_2') {
      const overrides = safeLoadOverrides();
      matches.unshift(applyLegacyMatchOverride(buildRobotech2AtomRegion(teamData), overrides));
      matches.unshift(applyLegacyMatchOverride(buildRobotech2Rgups(teamData), overrides));
    }
    return matches;
  }

  window.SetkaImportedMatches = {
    getImportedMatches,
    getLegacyImageMatches,
    getLegacyMatchOverrides,
    saveLegacyMatchOverride,
    resetLegacyMatchOverride,
    applyLegacyMatchOverride,
    LEGACY_MATCH_ARCHIVE,
    overridesKey: LEGACY_MATCH_OVERRIDES_KEY,
    archiveVersion: ARCHIVE_VERSION,
    source: IMPORT_SOURCE,
    sourceLabel: IMPORT_SOURCE_LABEL,
    imageSource: LEGACY_IMAGE_SOURCE,
    imageSourceLabel: LEGACY_IMAGE_SOURCE_LABEL
  };
})();
