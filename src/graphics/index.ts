declare global {
  let NodeCG: typeof NodeCGAPIClient;
  let nodecg: NodeCGAPIClient;
}
import { NodeCGAPIClient } from '@nodecg/types/client/api/api.client';
import {
  AnimateArg,
  AnimateArrayArg,
  AnimateData,
  AnimateToggleArg,
  GameArrayData,
  GameDefs,
  GameToggleData,
  GamesData,
} from '../extension/game-data';

let resetFuncs: (() => void)[] = [];

const demigodMarkers: {
  [k: string]: {
    marker: SVGGraphicsElement | null;
    val?: number;
    old?: number;
  };
} = {
  Pentha: { marker: null },
  Agamar: { marker: null },
  Klar: { marker: null },
  Aponi: { marker: null },
  Saghari: { marker: null },
  Namari: { marker: null },
  Naka: { marker: null },
  Belan: { marker: null },
  Isabel: { marker: null },
  Sorcerer: { marker: null },
  Hadria: { marker: null },
};

const hadriaDamageCracks: {
  element: SVGGraphicsElement | null;
  val?: number;
  old?: number;
} = { element: null };

const demigodMarkerInKeyframes: Keyframe[] = [
  { transform: 'matrix(.001, 0, 0, .001, 0, -23)', opacity: '0', offset: 0 },
  { transform: 'matrix(.001, 0, 0, .001, 0, -23)', opacity: '1', offset: 0.01 },
  { transform: 'matrix(1, 0, 0, 1, 0, 0)', opacity: '1', offset: 1 },
];

const demigodMarkerSmiteKeyframes: Keyframe[] = [
  { transform: 'rotate3d(0, 1, 0, 1440deg)', offset: 0 },
  { transform: 'rotate3d(0, 1, 0, 0deg)', offset: 1 },
];

const showKeyframes: Keyframe[] = [
  { opacity: 0, offset: 0 },
  { opacity: 1, offset: 1 },
];

const flipVFAgeFront: Keyframe[] = [{ transform: 'rotateY(0deg)', width: '14.43%' }];

const flipVFAgeBack: Keyframe[] = [{ transform: 'rotateY(180deg)', width: '6.44%' }];

const gamesdataRep = nodecg.Replicant<GamesData>('games-data');
const gamesRep = nodecg.Replicant<GameDefs>('games');

function initArray(gameName: string, arrayName: string) {
  NodeCG.waitForReplicants(gamesdataRep, gamesRep).then(() => {
    if (!gamesdataRep.value || !gamesRep.value) return;
    const repArrayData: GameArrayData[] = JSON.parse(JSON.stringify(gamesdataRep.value[gameName].arrays[arrayName]));
    const gameItemDefs = gamesRep.value[gameName].arrays[arrayName].fields;
    const animateData: AnimateData = [];
    for (let i = 0; i < repArrayData.length; i++) {
      const repArrayItem = repArrayData[i];
      const animateArrayItem: AnimateData[number] = {};
      for (const key of Object.keys(repArrayItem)) {
        const itemDef = gameItemDefs[key];
        switch (itemDef.type) {
          case 'button': {
            animateArrayItem[key] = repArrayItem[key].val;
            break;
          }
          case 'image': {
            animateArrayItem[key] = itemDef.values[+repArrayItem[key].val];
            break;
          }
          default: {
            animateArrayItem[key] = repArrayItem[key].val;
            break;
          }
        }
      }
      animateData.push(animateArrayItem);
    }
    animateArray({ game: gameName, array: arrayName, data: animateData });
  });
}

function initToggle(gameName: string, toggleName: string) {
  NodeCG.waitForReplicants(gamesdataRep, gamesRep).then(() => {
    if (!gamesdataRep.value || !gamesRep.value) return;
    const repToggleData: GameToggleData = JSON.parse(JSON.stringify(gamesdataRep.value[gameName].toggles[toggleName]));
    const gameToggleDefs = gamesRep.value[gameName].toggles[toggleName];
    const animateData: AnimateData = [];
    const arg: AnimateToggleArg = {
      game: gameName,
      toggle: toggleName,
      data: repToggleData.val,
    };
    animateToggle(arg);
  });
}

function inits() {
  initToggle('Veiled Fate', 'Age');
  initToggle('Veiled Fate', 'Age Card Side');
  initToggle('Veiled Fate', 'Celestial');
  initToggle('Veiled Fate', 'Celestial Info');

  const vfSvgObject = document.getElementById('vf-svg-object') as HTMLObjectElement;
  vfSvgObject.addEventListener('load', () => {
    setTimeout(() => {
      const svgDoc = vfSvgObject.contentDocument;
      if (svgDoc) {
        Object.keys(demigodMarkers).forEach((key) => {
          const markerId = key.toLowerCase() + '-marker';
          const marker = svgDoc.getElementById(markerId);
          if (marker) demigodMarkers[key].marker = marker as any as SVGGraphicsElement;
        });
        hadriaDamageCracks.element = svgDoc.getElementById('hadria-danger') as any as SVGGraphicsElement;
        if (hadriaDamageCracks.element) {
          hadriaDamageCracks.element.style.clipPath = 'inset(0 0 0 8.33%)';
          hadriaDamageCracks.old === 8.33;
          hadriaDamageCracks.val;
        }
        initArray('Veiled Fate', 'Demigods');
        initArray('Veiled Fate', 'Hadria');
      } else nodecg.log.error(`Can't load Veiled Fate .svg`);
    }, 500);
  });
  const vfSvgData = vfSvgObject.data;
  vfSvgObject.data = '';
  vfSvgObject.data = vfSvgData;
}

inits();

nodecg.listenFor('animate', (arg) => {
  if (arg.array) {
    animateArray(arg);
  } else animateToggle(arg);
});

nodecg.listenFor('resetGame', () => {
  for (let i = 0; i < resetFuncs.length; i++) {
    resetFuncs[i]();
  }
  resetFuncs = [];
  inits();
});

nodecg.listenFor('endGame', (arg) => {
  switch (arg) {
    case 'Veiled Fate': {
      NodeCG.waitForReplicants(gamesdataRep, gamesRep).then(() => {
        if (gamesdataRep.value && gamesdataRep.value['Veiled Fate'] && gamesRep.value) {
          const vf = gamesdataRep.value['Veiled Fate'];
          if (vf.arrays.Hadria.length) {
            const hadriaRenown = vf.arrays.Hadria[0].renown.val;
            const demigods = vf.arrays.Demigods;
            for (let i = 0; i < demigods.length; i++) {
              const demigod = demigods[i];
              const demigodImagedef = gamesRep.value[arg].arrays.Demigods.fields.image;
              if (demigod.renown.val > hadriaRenown && demigodImagedef.type === 'image') {
                const demigodName = demigodImagedef.values[+demigod.image.val].name;
                const demigodLocal = demigodMarkers[demigodName];
                const marker = demigodLocal.marker;
                if (marker) {
                  const animUp = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
                  animUp.setAttributeNS(null, 'attributeName', 'transform');
                  animUp.setAttributeNS(null, 'type', 'translate');
                  animUp.setAttributeNS(null, 'values', `-27 13; -27 -23`);
                  animUp.setAttributeNS(null, 'dur', `1000ms`);
                  animUp.setAttributeNS(null, 'begin', 'indefinite');
                  animUp.setAttributeNS(null, 'fill', 'freeze');
                  animUp.setAttributeNS(null, 'calcMode', 'spline');
                  animUp.setAttributeNS(null, 'keySplines', '0.5 0 0.5 1');
                  const animGrab = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
                  animGrab.setAttributeNS(null, 'attributeName', 'd');
                  animGrab.setAttributeNS(
                    null,
                    'values',
                    `M 16.4,54.1l 5.5,-8.8c 0.3,-0.7 3.3,-3.6 4.9,-4.3c 1.6,-0.7 7.5,-0.7 7.9,-0.7c 0.4,0 2.3,0.4 3.3,-1.2c 0.4,-0.5 4.9,-5.2 5.4,-6.7c 0.3,-1 -0.7,-3 -1.7,-4.8c -0.2,-0.5 -0.3,-1.1 -0.4,-1.9c 1.2,-2.9 6.2,-7.6 6.3,-9.3c 0.1,-1.7 -1.7,-7.1 -2.9,-7.8c -0.9,-0.3 -5.4,-2.7 -7.1,-0.3c 3.7,-0.2 4.8,2.3 4.8,2.3c 0,0 1,4.3 1.2,5.6c -3.1,2.1 -5.7,6.6 -6.2,7.3c -2,0.6 -7.7,6.1 -8.7,6.3c -1,0.2 -6.3,1.4 -6.3,1.4c -3.1,-0.8 -9.2,-3.6 -10.2,-4.2c -0.3,-0.5 -0.6,-3.9 -1.5,-6c -0.4,-0.8 2,-3.9 4.9,-6.4c -3.9,-0.2 -9.2,3.2 -8.3,6.9c 0.4,1.7 1.7,9.4 1.7,9.4c 0,0 5.1,1.2 5.9,1.9c 0.8,0.7 1.7,2.3 1.6,2.9l -12.2,18.4z M 39.5,29.8c 3,-1.3 8.8,-2.5 10,-3.7c 1.2,-1.2 3.6,-6.3 3.2,-7.7c -0.5,-0.8 -2,-5.5 -4.9,-5c 2.9,2.5 1.9,5 1.9,5c 0,0 -2.3,3.8 -3,4.9c -1.8,-0.3 -3.9,0.2 -5.6,0.9z M 39.4,35.7c 3.2,-0.1 9.2,0.8 10.7,0.2c 1.6,-0.7 4.8,-3.4 5,-4.8c -0.2,-0.9 0.1,-5.9 -2.8,-6.5c 1.7,3.4 -0.1,5.4 -0.1,5.4c 0,0 -2.7,1.5 -3.8,2.2c -1.6,-1 -3.7,-1.2 -5.5,-1.1z;
									M 16.4,54.1l 5.5,-9c 0.4,-0.7 3.3,-3.6 4.9,-4.3c 1.6,-0.7 7.5,-0.7 7.9,-0.7c 0.4,0 2.4,0.5 3.3,-1.2c 0.4,-0.5 5,-5.2 5.4,-6.7c 0.3,-1 -0.7,-3 -1.7,-4.8c 0,-0.4 -0.1,-0.8 -0.2,-1.2c 1.1,-2.9 2.3,-9.8 2,-11c -0.3,-1.7 -4.9,-7.1 -6.3,-6.6c -0.7,0.5 -6,2.6 -5.9,5.5c 2.1,-3.1 5.4,-2.1 5.4,-2.1c 0,0 2.4,2.7 2.9,3.9c -2.4,2.1 -3,6.3 -3.5,6.9c -2,0.6 -7.2,6.8 -7.3,6.8c -1,0.2 -4.3,0.1 -4.3,0.1c -3.1,-0.8 -7.9,-5.2 -8.3,-6c -0.1,-0.6 0.8,-3.8 0.7,-6.1c 0,-0.9 3.7,-3.1 7.2,-4.4c -3.6,-1.6 -10.3,-0.1 -10.4,3.6c -0.2,1.7 -1.7,9.4 -1.7,9.4c 0,0 4.6,4 5.4,4.7c 0.8,0.7 -0.3,3.5 -0.9,4.6l -12.3,18.6z M42.0,29.8c 0,-3 -1.4,-9.2 -3.5,-9.9c -3.6,-1.1 -8.5,-2.3 -10.4,-2c -3.1,0.9 -5.4,2.8 -8.3,5.8c 1.7,-0.7 8.6,-3.4 9.4,-2.9c 2.2,1.3 5.1,1.8 6.3,2.4c -0.3,1 0.6,5.6 0.6,5.6z M 43.6,32.3c -1.0,-2.8 -2.9,-9.2 -5,-9.2c -3.7,-0.5 -8.7,-1 -10.6,-0.4c -2.9,1.4 -3.5,3.7 -5.8,7c 1.5,-1 6.5,-4.7 7.4,-4.4c 2.3,0.9 5.3,1 6.6,1.4c -0.2,1 1.5,5.4 1.5,5.4z`,
                  );
                  animGrab.setAttributeNS(null, 'dur', `1000ms`);
                  animGrab.setAttributeNS(null, 'begin', 'indefinite');
                  animGrab.setAttributeNS(null, 'fill', 'freeze');
                  animGrab.setAttributeNS(null, 'calcMode', 'spline');
                  animGrab.setAttributeNS(null, 'keySplines', '0.5 0 0.5 1');
                  const animDown = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
                  animDown.setAttributeNS(null, 'attributeName', 'transform');
                  animDown.setAttributeNS(null, 'type', 'translate');
                  animDown.setAttributeNS(null, 'values', `0 0; 0 40`);
                  animDown.setAttributeNS(null, 'dur', `1000ms`);
                  animDown.setAttributeNS(null, 'begin', 'indefinite');
                  animDown.setAttributeNS(null, 'fill', 'freeze');
                  animDown.setAttributeNS(null, 'calcMode', 'spline');
                  animDown.setAttributeNS(null, 'keySplines', '0.5 0 0.5 1');
                  const hexAndClaw = marker.children[marker.children.length - 1] as SVGGElement;
                  const claw = hexAndClaw.children[hexAndClaw.children.length - 1] as SVGPathElement;
                  (animUp as any).onend = () => {
                    claw.appendChild(animGrab);
                    resetFuncs.push(() => {
                      claw.removeChild(animGrab);
                    });
                    animGrab.beginElement();
                  };
                  (animGrab as any).onend = () => {
                    hexAndClaw.appendChild(animDown);
                    resetFuncs.push(() => {
                      hexAndClaw.removeChild(animDown);
                    });
                    animDown.beginElement();
                  };
                  claw.appendChild(animUp);
                  resetFuncs.push(() => {
                    claw.removeChild(animUp);
                  });
                  animUp.beginElement();
                }
              }
            }
          }
        }
      });

      break;
    }
    default: {
      nodecg.log.error(`Code endGame for game "${arg}"`);
      break;
    }
  }
});

function animateToggle(arg: AnimateToggleArg) {
  NodeCG.waitForReplicants(gamesRep).then(() => {
    if (gamesRep.value && gamesRep.value[arg.game] && gamesRep.value[arg.game].toggles[arg.toggle]) {
      const values = gamesRep.value[arg.game].toggles[arg.toggle].values;
      switch (arg.game) {
        case 'Veiled Fate': {
          switch (arg.toggle) {
            case 'Celestial': {
              const celestial = values[arg.data[0]];
              const winCondition = arg.data[0] ? `assets/veiled-fate/${celestial}_WC.png` : '';
              const gameplay = arg.data[0] ? `assets/veiled-fate/${celestial}_GP.png` : '';
              const cardDiv = document.getElementById('vf-celestial') as HTMLDivElement;
              reveal(cardDiv, 1000, 'reverse');
              wait(1000).then(() => {
                const wcCard = document.getElementById('vf-celestial-wc') as HTMLImageElement;
                const gpCard = document.getElementById('vf-celestial-gp') as HTMLImageElement;
                let wcLoaded = false;
                let gpLoaded = false;
                wcCard.onload = () => {
                  wcLoaded = true;
                  if (gpLoaded) reveal(cardDiv, 1000);
                  wcCard.onload = null;
                };
                gpCard.onload = () => {
                  gpLoaded = true;
                  if (wcLoaded) reveal(cardDiv, 1000);
                  gpCard.onload = null;
                };
                wcCard.src = winCondition;
                gpCard.src = gameplay;
              });
              break;
            }
            case 'Celestial Info': {
              const infoType = values[arg.data[0]];
              const newCardImg = document.getElementById(
                `vf-celestial-${infoType === 'Gameplay' ? 'gp' : 'wc'}`,
              ) as HTMLImageElement;
              const oldCardImg = document.getElementById(
                `vf-celestial-${infoType === 'Gameplay' ? 'wc' : 'gp'}`,
              ) as HTMLImageElement;
              const parent = document.getElementById('vf-celestial-card') as HTMLDivElement;
              newCardImg.animate([{ opacity: '0' }], { duration: 1, fill: 'forwards' });
              wait(100)
                .then(() => {
                  newCardImg.style.position = 'relative';
                  oldCardImg.style.position = 'absolute';
                  parent.removeChild(newCardImg);
                  parent.appendChild(newCardImg);
                  newCardImg.animate([{ opacity: '1' }], { duration: 1000, fill: 'forwards' });
                  return wait(1100);
                })
                .then(() => {
                  oldCardImg.animate([{ opacity: '0' }], { duration: 1, fill: 'forwards' });
                });
              break;
            }
            case 'Age': {
              const ageCard = values[arg.data[0]];
              const front = arg.data[0] ? `assets/veiled-fate/${ageCard}.png` : '';
              const back = arg.data[0] ? `assets/veiled-fate/${ageCard[0]} - Back.png` : '';
              const cardDiv = document.getElementById('vf-age') as HTMLDivElement;
              reveal(cardDiv, 1000, 'reverse');
              wait(1000).then(() => {
                const frontCard = document.getElementById('vf-age-front') as HTMLImageElement;
                const backCard = document.getElementById('vf-age-back') as HTMLImageElement;
                let frontLoaded = false;
                let backLoaded = false;
                frontCard.onload = () => {
                  frontLoaded = true;
                  if (backLoaded) reveal(cardDiv, 1000);
                  frontCard.onload = null;
                };
                backCard.onload = () => {
                  backLoaded = true;
                  if (frontLoaded) reveal(cardDiv, 1000);
                  backCard.onload = null;
                };
                frontCard.src = front;
                backCard.src = back;
              });
              break;
            }
            case 'Age Card Side': {
              const front = !arg.data[0];
              const cardDiv = document.getElementById('vf-age-card') as HTMLDivElement;
              if (front) {
                cardDiv.animate(flipVFAgeFront, {
                  duration: 500,
                  fill: 'forwards',
                });
              } else {
                cardDiv.animate(flipVFAgeBack, {
                  duration: 500,
                  fill: 'forwards',
                });
              }
              break;
            }
            default: {
              nodecg.log.error(`No graphics for toggle "${arg.toggle}" in game "${arg.game}"`);
              break;
            }
          }
          break;
        }
        default: {
          nodecg.log.error(`No graphics for game "${arg.game}"`);
          break;
        }
      }
    } else nodecg.log.error('Graphics cannot get definition for toggle "${arg.toggle}" in game "${arg.game}"');
  });
}

function animateArray(arg: AnimateArrayArg) {
  switch (arg.game) {
    case 'Veiled Fate': {
      const MARKER_SHOW_DURATION = 500;
      const MARKER_STILL_DURATION = 750;
      const MARKER_MOVE_DURATION = 2000;
      switch (arg.array) {
        case 'Hadria': {
          const hadria = demigodMarkers.Hadria;
          if (hadria.marker) {
            const marker = hadria.marker;
            if (arg.data.length === 0) {
              reveal(marker, 1000, 'reverse');
              if (hadriaDamageCracks.element) reveal(hadriaDamageCracks.element, 1000, 'reverse');
              return;
            }
            reveal(marker);
            if (hadriaDamageCracks.element) reveal(hadriaDamageCracks.element);

            const renown = arg.data[0]?.renown;
            if (typeof renown !== 'number') {
              nodecg.log.error(`Bad or missing renown value for Hadria`);
              return;
            }
            const newVal = ((renown + 2) * 1920) / 14;
            const cracksClip = (renown * 100) / 12;
            if (
              (hadriaDamageCracks.old === undefined || hadriaDamageCracks.old === cracksClip) &&
              hadriaDamageCracks.element
            )
              hadriaDamageCracks.element.style.clipPath = `inset(0 0 0 ${cracksClip}%)`;
            if (hadria.old === undefined || hadria.old === newVal) {
              if (hadriaDamageCracks.element) {
                hadriaDamageCracks.element.style.clipPath = `inset(0 0 0 ${cracksClip}%)`;
                hadriaDamageCracks.old = cracksClip;
                hadriaDamageCracks.val = cracksClip;
              }
              hadria.marker.transform.baseVal[0].setTranslate(newVal, 0);
              hadria.old = hadria.val === undefined ? newVal : hadria.val;
              hadria.val = newVal;
              return;
            }
            const oldVal = hadria.old;
            const oldClip = hadriaDamageCracks.old;
            hadriaDamageCracks.old = cracksClip;
            hadriaDamageCracks.val = cracksClip;
            hadria.val = newVal;
            hadria.old = newVal;
            const anim = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
            anim.setAttributeNS(null, 'attributeName', 'transform');
            anim.setAttributeNS(null, 'type', 'translate');
            anim.setAttributeNS(null, 'values', `${roundString(oldVal, 2)} 0; ${roundString(newVal, 2)} 0`);
            anim.setAttributeNS(null, 'dur', `${MARKER_MOVE_DURATION / 2}ms`);
            anim.setAttributeNS(null, 'begin', 'indefinite');
            anim.setAttributeNS(null, 'fill', 'freeze');
            anim.setAttributeNS(null, 'calcMode', 'spline');
            anim.setAttributeNS(null, 'keySplines', '0.5 0 0.5 1');
            hadria.marker.appendChild(anim);
            if (hadriaDamageCracks.element) {
              hadriaDamageCracks.element.animate(
                [
                  { clipPath: `inset(0 0 0 ${oldClip !== undefined ? oldClip : cracksClip}%)`, offset: 0 },
                  { clipPath: `inset(0 0 0 ${cracksClip}%)`, offset: 1 },
                ],
                {
                  duration: MARKER_MOVE_DURATION / 2,
                  fill: 'forwards',
                },
              );
            }
            anim.beginElement();
          }
          break;
        }
        case 'Demigods': {
          const sorcererMarker = demigodMarkers['Sorcerer'];
          if (arg.data.length === 10) {
            if (sorcererMarker && sorcererMarker.marker) reveal(sorcererMarker.marker);
          } else if (sorcererMarker && sorcererMarker.marker) reveal(sorcererMarker.marker, 1000, 'reverse');
          const renowns: {
            demigod: typeof demigodMarkers[string];
            place: number;
            smited: boolean;
            renown: number;
          }[][] = [];
          arg.data.forEach((val) => {
            if (
              val.image == undefined ||
              typeof val.image !== 'object' ||
              typeof val.image.name !== 'string' ||
              typeof val.image.url !== 'string' ||
              val.renown == undefined ||
              val.place == undefined ||
              val.smite == undefined
            ) {
              nodecg.log.error(`Malformed demigod data`);
              return;
            }
            const demigod = demigodMarkers[val.image.name];
            if (!demigod) {
              nodecg.log.error(`Demigod "${val.image.name}" not coded`);
              return;
            }
            if (!demigod.marker) {
              nodecg.log.error(`No svg element for demigod ${val.image.name}`);
              return;
            }
            if (val.image.name === 'Sorcerer') {
              renowns[13] = [{ demigod: demigod, place: +val.place, smited: !!val.smite, renown: +val.renown }];
              return;
            }
            if (renowns[+val.renown]) {
              renowns[+val.renown].push({
                demigod: demigod,
                place: +val.place,
                smited: !!val.smite,
                renown: +val.renown,
              });
            } else
              renowns[+val.renown] = [
                { demigod: demigod, place: +val.place, smited: !!val.smite, renown: +val.renown },
              ];
          });
          for (let i = 0; i < renowns.length; i++) {
            const renown = renowns[i];
            if (renown) {
              const places = renown.length;
              renown.sort((a, b) => b.place - a.place);
              for (let j = 0; j < renown.length; j++) {
                const demigod = renown[j].demigod;
                demigod.old = demigod.val;
                const newVal = i < 13 ? positions(i, places)[renown[j].place - 1] : positions(renown[j].renown, 0)[0];
                demigod.val = newVal;
                if (demigod.marker) {
                  const marker = demigod.marker;
                  const parent = demigod.marker.parentElement!;
                  parent.removeChild(demigod.marker);
                  parent.appendChild(demigod.marker);
                  if (demigod.old !== undefined && (demigod.old !== newVal || renown[j].smited)) {
                    const oldVal = demigod.old;
                    const needMarker = renownFromPosition(newVal) !== renownFromPosition(oldVal) || renown[j].smited;
                    const moveAnim = () => {
                      const anim = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
                      anim.setAttributeNS(null, 'attributeName', 'transform');
                      anim.setAttributeNS(null, 'type', 'translate');
                      anim.setAttributeNS(null, 'values', `${roundString(oldVal, 2)} 0; ${roundString(newVal, 2)} 0`);
                      anim.setAttributeNS(null, 'dur', `${MARKER_MOVE_DURATION}ms`);
                      anim.setAttributeNS(null, 'begin', 'indefinite');
                      anim.setAttributeNS(null, 'fill', 'freeze');
                      anim.setAttributeNS(null, 'calcMode', 'spline');
                      anim.setAttributeNS(null, 'keySplines', '0.5 0 0.5 1');
                      //@ts-ignore
                      anim.onend = () => {
                        marker.transform.baseVal[0].setTranslate(newVal, 0);
                        demigod.marker!.removeChild(anim);
                        if (needMarker)
                          setTimeout(() => {
                            marker.children[renown[j].smited ? 1 : 0].animate(demigodMarkerInKeyframes, {
                              duration: MARKER_SHOW_DURATION,
                              fill: 'forwards',
                              direction: 'reverse',
                            });
                          }, MARKER_STILL_DURATION);
                      };
                      marker.appendChild(anim);
                      anim.beginElement();
                    };
                    if (needMarker) {
                      const inAnim = marker.children[renown[j].smited ? 1 : 0].animate(demigodMarkerInKeyframes, {
                        duration: MARKER_SHOW_DURATION,
                        fill: 'forwards',
                      });
                      inAnim.onfinish = () => {
                        setTimeout(() => {
                          moveAnim();
                        }, MARKER_STILL_DURATION);
                      };
                    } else
                      setTimeout(() => {
                        moveAnim();
                      }, MARKER_SHOW_DURATION + MARKER_STILL_DURATION);
                    if (renown[j].smited) {
                      parent.removeChild(demigod.marker);
                      parent.appendChild(demigod.marker);
                      marker.children[2].animate(demigodMarkerSmiteKeyframes, {
                        duration: MARKER_SHOW_DURATION * 2 + MARKER_STILL_DURATION * 2 + MARKER_MOVE_DURATION,
                        easing: 'cubic-bezier(.75,0,.25,1)',
                      });
                    }
                  } else {
                    demigod.marker.transform.baseVal[0].setTranslate(newVal, 0);
                  }
                }
              }
            }
          }
          for (let i = 0; i < renowns.length; i++) {
            const renown = renowns[i];
            if (renown) {
              for (let j = 0; j < renown.length; j++) {
                const demi = renown[j];
                if (demi.smited && demi.demigod.marker) {
                  const parent = demi.demigod.marker.parentElement!;
                  parent.removeChild(demi.demigod.marker);
                  parent.appendChild(demi.demigod.marker);
                }
              }
            }
          }
          break;
        }
        default: {
          nodecg.log.error(`No graphics for array "${arg.array}" in game "${arg.game}"`);
          break;
        }
      }
      break;
    }
    default: {
      nodecg.log.error(`No graphics for game "${arg.game}"`);
      break;
    }
  }
}

function reveal(element: HTMLElement | SVGElement, duration?: number, reverse?: 'reverse') {
  if (duration === undefined) duration = 1000;
  const opacity = element.style.opacity;
  if (reverse) {
    if (+opacity > 0) {
      element.animate(showKeyframes, {
        duration: duration,
        fill: 'forwards',
        direction: 'reverse',
      });
    }
    setTimeout(() => {
      element.style.opacity = '0';
    }, duration);
  } else {
    if (+opacity < 1) {
      element.animate(showKeyframes, {
        duration: duration,
        fill: 'forwards',
      });
    }
    setTimeout(() => {
      element.style.opacity = '1';
    }, duration);
  }
}

function positions(renown: number, places: number): number[] {
  const leftmost = renown ? ((renown + 1) * 1920) / 14 + 18 : 18;
  const rightmost = ((renown + 2) * 1920) / 14 - 18;
  const distance = rightmost - leftmost;
  if (places === 0) return [(leftmost + rightmost) / 2];
  if (places === 1) return [leftmost + distance * 0.85];
  const rtn: number[] = [];
  const increment = distance / (places - 1);
  if (places === 2) return [leftmost + distance * 0.85, leftmost + distance * 0.15];
  if (places === 3) return [leftmost + distance * 0.9, leftmost + distance / 2, leftmost + distance * 0.1];
  for (let i = 0; i < places; i++) {
    rtn.push(leftmost + increment * i);
  }
  return rtn.reverse();
}

function roundString(num: number, decimals: number): string {
  return (Math.round(num * 10 ** decimals) / 10 ** decimals).toString();
}

function renownFromPosition(position: number): number {
  if (position < 1920 / 7) return 0;
  position -= 1920 / 14;
  return Math.floor(position / (1920 / 14));
}

function wait(ms: number): Promise<void> {
  return new Promise((res) => {
    setTimeout(() => {
      res();
    }, ms);
  });
}
