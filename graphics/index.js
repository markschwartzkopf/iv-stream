"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const demigodMarkers = {
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
const demigodMarkerInKeyframes = [
    { transform: 'matrix(.001, 0, 0, .001, 0, -23)', opacity: '0', offset: 0 },
    { transform: 'matrix(.001, 0, 0, .001, 0, -23)', opacity: '1', offset: 0.01 },
    { transform: 'matrix(1, 0, 0, 1, 0, 0)', opacity: '1', offset: 1 },
];
const demigodMarkerSmiteKeyframes = [
    { transform: 'rotate3d(0, 1, 0, 1440deg)', offset: 0 },
    { transform: 'rotate3d(0, 1, 0, 0deg)', offset: 1 },
];
const showKeyframes = [
    { opacity: 0, offset: 0 },
    { opacity: 1, offset: 1 },
];
const gamesdataRep = nodecg.Replicant('games-data');
const gamesRep = nodecg.Replicant('games');
function initArray(gameName, arrayName) {
    NodeCG.waitForReplicants(gamesdataRep, gamesRep).then(() => {
        if (!gamesdataRep.value || !gamesRep.value)
            return;
        const repArrayData = JSON.parse(JSON.stringify(gamesdataRep.value[gameName][arrayName]));
        const gameItemDefs = gamesRep.value[gameName].arrays[arrayName].fields;
        const animateData = [];
        for (let i = 0; i < repArrayData.length; i++) {
            const repArrayItem = repArrayData[i];
            const animateArrayItem = {};
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
        animate({ game: gameName, array: arrayName, data: animateData });
    });
}
const vfSvgObject = document.getElementById('vf-svg-object');
vfSvgObject.addEventListener('load', () => {
    setTimeout(() => {
        const svgDoc = vfSvgObject.contentDocument;
        if (svgDoc) {
            Object.keys(demigodMarkers).forEach((key) => {
                const markerId = key.toLowerCase() + '-marker';
                const marker = svgDoc.getElementById(markerId);
                if (marker)
                    demigodMarkers[key].marker = marker;
            });
            initArray('Veiled Fate', 'Demigods');
            initArray('Veiled Fate', 'Hadria');
        }
        else
            nodecg.log.error(`Can't load Veiled Fate .svg`);
    }, 500);
});
const vfSvgData = vfSvgObject.data;
vfSvgObject.data = '';
vfSvgObject.data = vfSvgData;
nodecg.listenFor('animateArray', animate);
function animate(arg) {
    var _a;
    console.log('new-anim');
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
                            return;
                        }
                        reveal(marker);
                        const renown = (_a = arg.data[0]) === null || _a === void 0 ? void 0 : _a.renown;
                        if (typeof renown !== 'number') {
                            nodecg.log.error(`Bad or missing renown value for Hadria`);
                            return;
                        }
                        const newVal = ((renown + 2) * 1920) / 14;
                        if (hadria.old === undefined || hadria.old === newVal) {
                            hadria.marker.transform.baseVal[0].setTranslate(newVal, 0);
                            hadria.old = hadria.val === undefined ? newVal : hadria.val;
                            hadria.val = newVal;
                            return;
                        }
                        const oldVal = hadria.old;
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
                        anim.beginElement();
                    }
                    break;
                }
                case 'Demigods': {
                    const sorcererMarker = demigodMarkers['Sorcerer'];
                    if (arg.data.length === 10) {
                        if (sorcererMarker && sorcererMarker.marker)
                            reveal(sorcererMarker.marker);
                    }
                    else if (sorcererMarker && sorcererMarker.marker)
                        reveal(sorcererMarker.marker, 1000, 'reverse');
                    const renowns = [];
                    arg.data.forEach((val) => {
                        if (val.image == undefined ||
                            typeof val.image !== 'object' ||
                            typeof val.image.name !== 'string' ||
                            typeof val.image.url !== 'string' ||
                            val.renown == undefined ||
                            val.place == undefined ||
                            val.smite == undefined) {
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
                        if (renowns[+val.renown]) {
                            renowns[+val.renown].push({
                                demigod: demigod,
                                place: +val.place,
                                smited: !!val.smite,
                            });
                        }
                        else
                            renowns[+val.renown] = [
                                { demigod: demigod, place: +val.place, smited: !!val.smite },
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
                                const newVal = positions(i, places)[renown[j].place - 1];
                                demigod.val = newVal;
                                if (demigod.marker) {
                                    const marker = demigod.marker;
                                    const parent = demigod.marker.parentElement;
                                    parent.removeChild(demigod.marker);
                                    parent.appendChild(demigod.marker);
                                    if (demigod.old !== undefined &&
                                        (demigod.old !== newVal || renown[j].smited)) {
                                        const oldVal = demigod.old;
                                        const needMarker = renownFromPosition(newVal) !==
                                            renownFromPosition(oldVal) || renown[j].smited;
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
                                                demigod.marker.removeChild(anim);
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
                                        }
                                        else
                                            setTimeout(() => {
                                                moveAnim();
                                            }, MARKER_SHOW_DURATION + MARKER_STILL_DURATION);
                                        if (renown[j].smited) {
                                            parent.removeChild(demigod.marker);
                                            parent.appendChild(demigod.marker);
                                            marker.children[2].animate(demigodMarkerSmiteKeyframes, {
                                                duration: MARKER_SHOW_DURATION * 2 +
                                                    MARKER_STILL_DURATION * 2 +
                                                    MARKER_MOVE_DURATION,
                                                easing: 'cubic-bezier(.75,0,.25,1)',
                                            });
                                        }
                                    }
                                    else {
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
                                    const parent = demi.demigod.marker.parentElement;
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
function reveal(element, duration, reverse) {
    if (duration === undefined)
        duration = 1000;
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
    }
    else {
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
function positions(renown, places) {
    const leftmost = renown ? ((renown + 1) * 1920) / 14 + 18 : 18;
    const rightmost = ((renown + 2) * 1920) / 14 - 18;
    const distance = rightmost - leftmost;
    if (places === 1)
        return [leftmost + distance * 0.85];
    const rtn = [];
    const increment = distance / (places - 1);
    if (places === 2)
        return [leftmost + distance * 0.85, leftmost + distance * 0.15];
    if (places === 3)
        return [
            leftmost + distance * 0.9,
            leftmost + distance / 2,
            leftmost + distance * 0.1,
        ];
    for (let i = 0; i < places; i++) {
        rtn.push(leftmost + increment * i);
    }
    return rtn.reverse();
}
function roundString(num, decimals) {
    return (Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals)).toString();
}
function renownFromPosition(position) {
    if (position < 1920 / 7)
        return 0;
    position -= 1920 / 14;
    return Math.floor(position / (1920 / 14));
}
