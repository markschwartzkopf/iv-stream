import NodeCG from '@nodecg/types';

const nodecg: NodeCG.ServerAPI = require('./nodecg-api-context').get();

export type GameDefs = { [k: string]: GameDef };

type GameDef = {
  arrays: {
    [k: string]: GameArrayDef;
  };
};

type GameArrayDef = {
  fields: { [k: string]: ArrayFieldDef };
  max: number;
  min: number;
  display: 'table' | 'flex';
};

type ArrayFieldDef = { unique?: true; readonly?: true } & (
  | StringFieldDef
  | StringEnumFieldDef
  | IntegerFieldDef
  | ImageFieldDef
  | VFRenownDef
  | ButtonDef
);
type StringFieldDef = { type: 'string'; default?: string };
type StringEnumFieldDef = {
  type: 'stringEnum';
  values: string[];
  defaultIndex?: number;
};
type IntegerFieldDef = {
  type: 'integer';
  min?: number;
  max?: number;
  default?: number;
};
type ImageFieldDef = {
  type: 'image';
  values: { name: string; url: string }[];
  dashHeight?: string;
};
type ButtonDef = {
  type: 'button';
  imageUrl?: string;
  dashHeight?: string;
};
type VFRenownDef = {
  type: 'VFRenown';
  hadria?: true;
};

export type GamesData = { [k: string]: GameData };
type GameData = { [k: string]: GameArrayData[] };
export type GameArrayData =
  | { [k: string]: { old: string; val: string } }
  | { [k: string]: { old: number; val: number } };

const gameDefs: GameDefs = {
  Moonrakers: {
    arrays: {},
  },
  'Veiled Fate': {
    arrays: {
      /* Players: {
        fields: { name: { type: 'string', unique: true } },
        display: 'table',
        min: 2,
        max: 8,
      }, */
      Demigods: {
        fields: {
          image: {
            type: 'image',
            unique: true,
            dashHeight: '4.3em',
            values: [
              { name: 'Pentha', url: 'assets/veiled-fate/pentha-marker.svg' },
              { name: 'Agamar', url: 'assets/veiled-fate/agamar-marker.svg' },
              { name: 'Klar', url: 'assets/veiled-fate/klar-marker.svg' },
              { name: 'Aponi', url: 'assets/veiled-fate/aponi-marker.svg' },
              { name: 'Saghari', url: 'assets/veiled-fate/saghari-marker.svg' },
              { name: 'Namari', url: 'assets/veiled-fate/namari-marker.svg' },
              { name: 'Naka', url: 'assets/veiled-fate/naka-marker.svg' },
              { name: 'Belan', url: 'assets/veiled-fate/belan-marker.svg' },
              { name: 'Isabel', url: 'assets/veiled-fate/isabel-marker.svg' },
              {
                name: 'Sorcerer',
                url: 'assets/veiled-fate/sorcerer-marker.svg',
              },
            ],
          },
          renown: { type: 'VFRenown' },
          place: { type: 'integer', min: 1, readonly: true },
          smite: {
            type: 'button',
            imageUrl: 'assets/veiled-fate/smite.svg',
            dashHeight: '2em',
          },
        },
        display: 'flex',
        min: 9,
        max: 10,
      },
      Hadria: {
        fields: {
          image: {
            type: 'image',
            unique: true,
            dashHeight: '4.3em',
            values: [{ name: 'Hadria', url: 'assets/veiled-fate/hadria-marker.svg' }],
          },
          renown: { type: 'VFRenown', hadria: true },
        },
        display: 'flex',
        min: 0,
        max: 1,
      },
    },
  },
};

const gamesRep = nodecg.Replicant<GameDefs>('games');
gamesRep.value = gameDefs;

const gamesDataRep = nodecg.Replicant<GamesData>('games-data');
gamesDataRep.value = verifyGamesData(gameDefs, gamesDataRep.value);

const activeGameRep = nodecg.Replicant<string>('active-game');
if (!activeGameRep.value || !gameDefs[activeGameRep.value]) activeGameRep.value = Object.keys(gameDefs)[0];

export type ButtonArg = {
  game: string;
  array: string;
  button: string;
  index: number;
};
nodecg.listenFor('buttonPush', (arg: ButtonArg) => {
  if (arg.game === 'Veiled Fate' && arg.array === 'Demigods' && arg.button === 'smite') {
    vfSmite(arg.index);
  }
});

export type AnimateData = {
  [k: string]: number | string | AnimateData[number];
}[];
export type AnimateArrayArg = {
  game: string;
  array: string;
  data: AnimateData;
};
export type AddArrayItemArg = { game: string; array: string };
nodecg.listenFor('addArrayItem', (arg: AddArrayItemArg) => {
  if (
    gameDefs[arg.game] &&
    gameDefs[arg.game].arrays[arg.array] &&
    gamesDataRep.value &&
    gamesDataRep.value[arg.game] &&
    gamesDataRep.value[arg.game][arg.array]
  ) {
    gamesDataRep.value[arg.game][arg.array] = verifyGameArray(gameDefs[arg.game].arrays[arg.array], [
      ...gamesDataRep.value[arg.game][arg.array],
      null,
    ]);
  } else {
    nodecg.log.error(
      `addArrayItem argument references non-existent game and/or array, game:"${arg.game}", array:"${arg.array}"`,
    );
  }
});

export type RemoveArrayItemArg = {
  game: string;
  array: string;
  index?: number;
};
nodecg.listenFor('removeArrayItem', (arg: RemoveArrayItemArg) => {
  if (
    gameDefs[arg.game] &&
    gameDefs[arg.game].arrays[arg.array] &&
    gamesDataRep.value &&
    gamesDataRep.value[arg.game] &&
    gamesDataRep.value[arg.game][arg.array]
  ) {
    if (arg.game === 'Veiled Fate' && arg.array === 'Demigods') {
      vfSmite(gamesDataRep.value[arg.game][arg.array].length - 1);
    }
    gamesDataRep.value[arg.game][arg.array].pop();
  } else {
    nodecg.log.error(
      `addArrayItem argument references non-existent game and/or array, game:"${arg.game}", array:"${arg.array}"`,
    );
  }
});

export type vfRenownChangeArg = {
  newVal: number;
  demiIndex: number;
  hadria?: boolean;
};
nodecg.listenFor('vfRenownChange', (arg: vfRenownChangeArg) => {
  vfRenownChange(arg.hadria ? 'hadria' : arg.demiIndex, arg.newVal);
});

nodecg.listenFor('resetGame', (gameName: string) => {
  const gameDef = gameDefs[gameName];
  if (!gameDef) {
    nodecg.log.error(`Can't reset game "${gameName}"`);
    return;
  }
  if (gamesDataRep.value) {
    gamesDataRep.value[gameName] = {};
    gamesDataRep.value[gameName] = verifyGameData(gameDef, null);
  }
});

function verifyGamesData(gameDefs: GameDefs, checkData: undefined | GamesData) {
  if (checkData && typeof checkData === 'object') checkData = JSON.parse(JSON.stringify(checkData));
  const gamesData: GamesData = {};
  for (const [key, value] of Object.entries(gameDefs)) {
    gamesData[key] = verifyGameData(value, checkData && checkData[key] ? checkData[key] : null);
  }
  return gamesData;
}

function verifyGameData(game: GameDef, checkData: null | GameData) {
  const gameData: GameData = {};
  for (const [key, value] of Object.entries(game.arrays)) {
    gameData[key] = verifyGameArray(value, checkData && checkData[key] ? checkData[key] : null);
  }
  return gameData;
}

function verifyGameArray(arrayDef: GameArrayDef, checkArray: null | (GameArrayData | null)[]) {
  const gameArrayData: GameArrayData[] = [];
  const arraySize = checkArray && checkArray.length > arrayDef.min ? checkArray.length : arrayDef.min;
  for (let i = 0; i < arraySize; i++) {
    const arrayItem: GameArrayData = {};
    for (const [key, value] of Object.entries(arrayDef.fields)) {
      const existing = checkArray && checkArray[i] ? checkArray[i]![key] : undefined;
      switch (value.type) {
        case 'integer':
          if (
            existing &&
            typeof existing.val === 'number' &&
            (value.min === undefined || existing.val >= value.min) &&
            (value.max === undefined || existing.val <= value.max)
          ) {
            arrayItem[key] = existing;
          } else arrayItem[key] = { val: value.min ? value.min : 0, old: 0 };
          if (value.unique && gameArrayData.map((x) => x[key]).indexOf(arrayItem[key]) !== -1) {
            arrayItem[key] = { val: value.min ? value.min : 0, old: 0 };
            while (
              gameArrayData.map((x) => x[key]).indexOf(arrayItem[key]) !== -1 &&
              (value.max === undefined || (arrayItem[key].val as number) <= value.max)
            )
              (arrayItem[key].val as number)++;
          }
          break;
        case 'string': {
          let proposedString =
            existing !== undefined && typeof existing.val === 'string' ? existing.val : value.unique ? '1' : '';
          if (value.unique && gameArrayData.map((x) => x[key].val).indexOf(proposedString) !== -1) proposedString = '1';
          if (value.unique)
            while (gameArrayData.map((x) => x[key].val).indexOf(proposedString) !== -1)
              proposedString = (+proposedString + 1).toString();
          arrayItem[key] = { val: proposedString, old: '' };
          break;
        }
        case 'stringEnum': {
          let proposedVal = existing !== undefined && typeof existing.val === 'number' ? existing.val : 0;
          if (value.unique && gameArrayData.map((x) => x[key].val).indexOf(proposedVal) !== -1) proposedVal = 0;
          while (
            proposedVal < value.values.length &&
            gameArrayData.map((x) => x[key].val).indexOf(proposedVal) !== -1
          ) {
            proposedVal++;
          }
          arrayItem[key] = {
            val: proposedVal < value.values.length ? proposedVal : -1,
            old: -1,
          };
          break;
        }
        case 'image': {
          let proposedVal = existing !== undefined && typeof existing.val === 'number' ? existing.val : 0;
          if (value.unique && gameArrayData.map((x) => x[key].val).indexOf(proposedVal) !== -1) proposedVal = 0;
          while (
            proposedVal < value.values.length &&
            gameArrayData.map((x) => x[key].val).indexOf(proposedVal) !== -1
          ) {
            proposedVal++;
          }
          arrayItem[key] = {
            val: proposedVal < value.values.length ? proposedVal : -1,
            old: -1,
          };
          break;
        }
        case 'button': {
          arrayItem[key] = { val: 0, old: 0 };
          break;
        }
        case 'VFRenown': {
          let renown = value.hadria ? 1 : 0;
          if (existing && typeof existing.val === 'number' && existing.val >= 0 && existing.val <= 12) {
            renown = existing.val;
          }
          arrayItem[key] = { val: renown, old: renown };
          if (existing === undefined && !value.hadria) vfRenownChange(arrayItem, renown, gameArrayData);
          break;
        }
        default:
          nodecg.log.error(`code array field type "${(value as any).type}" creation`);
          break;
      }
      arrayItem[key].old = arrayItem[key].val;
    }
    gameArrayData.push(arrayItem);
  }
  return gameArrayData;
}

function vfRenownChange(
  demigodIndex: number | 'hadria' | GameArrayData,
  newRenown: number,
  demigodData?: GameArrayData[],
) {
  let data = demigodData;
  if (!data && gamesDataRep.value && gamesDataRep.value['Veiled Fate']) {
    data =
      demigodIndex === 'hadria'
        ? gamesDataRep.value['Veiled Fate']['Hadria']
        : gamesDataRep.value['Veiled Fate']['Demigods'];
  }
  if (!data) {
    nodecg.log.error(`Can't find demigod array to process renown change on`);
    return;
  }
  const demigods = data;
  if (newRenown > 12 || newRenown < 0) return;
  if (demigodIndex === 'hadria') {
    const hadria = demigods[0];
    if (hadria && hadria.renown) hadria.renown.val = newRenown;
    hadria.renown.old = newRenown;
    const arg: AnimateArrayArg = {
      game: 'Veiled Fate',
      array: 'Hadria',
      data: [
        {
          image: {
            name: 'Hadria',
            url: 'assets/veiled-fate/hadria-marker.svg',
          },
          renown: newRenown,
        },
      ],
    };
    nodecg.sendMessage('animateArray', arg);
    return;
  }
  const demigod = typeof demigodIndex === 'object' ? demigodIndex : demigods[demigodIndex];
  const sameRenownItems = demigods.filter((x) => x.renown && x.renown.val === newRenown);
  sameRenownItems.sort((a, b) => (a.place.val > b.place.val ? 1 : -1));
  for (let i = 0; i < sameRenownItems.length; i++) {
    sameRenownItems[i].place.val = i + 2;
  }
  const oldRenown = demigod.renown ? (demigod.renown.val as number) : null;
  if (oldRenown === newRenown) return; //likely newly instatiated item
  demigod.renown = { val: newRenown, old: demigod.renown.old as number };
  if (oldRenown !== null) {
    const sameRenownItems = demigods.filter((x) => x.renown && x.renown.val === oldRenown);
    sameRenownItems.sort((a, b) => (a.place.val > b.place.val ? 1 : -1));
    for (let i = 0; i < sameRenownItems.length; i++) {
      sameRenownItems[i].place.val = i + 1;
    }
  }
  if (demigod.place)
    demigod.place = {
      val: 1,
      old: demigod.place.old as number,
    };
}

function vfSmite(index: number) {
  if (!gamesDataRep.value) {
    nodecg.log.error(`Can't smite without valid game data replicant`);
    return;
  }
  const demigods = gamesDataRep.value['Veiled Fate']['Demigods'];
  const demigod = demigods[index];
  const sameRenownItems = demigods.filter((x) => x.renown && x.renown.val === demigod.renown.val);
  const i = sameRenownItems.indexOf(demigod);
  if (i !== -1) sameRenownItems.splice(i, 1);
  sameRenownItems.sort((a, b) => (a.place.val > b.place.val ? 1 : -1));
  for (let i = 0; i < sameRenownItems.length; i++) {
    sameRenownItems[i].place.val = i + 1;
  }
  demigod.place.val = sameRenownItems.length + 1;
  demigod.smite.val = 1;
}
