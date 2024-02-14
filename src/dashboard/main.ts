/// <reference path="../../../../types/browser.d.ts" />
import { table } from 'console';
import {
	AddArrayItemArg,
	AnimateArrayArg,
	AnimateData,
	ButtonArg,
	GameArrayData,
	GameDefs,
	GamesData,
	RemoveArrayItemArg,
	vfRenownChangeArg,
} from '../extension/game-data';

const gamesRep = nodecg.Replicant<GameDefs>('games');
const gamesdataRep = nodecg.Replicant<GamesData>('games-data');
const activeGameRep = nodecg.Replicant<string>('active-game');

const gameSelectorDiv = document.getElementById(
	'game-selector'
) as HTMLDivElement;
const arrayHolder = document.getElementById('array-holder') as HTMLDivElement;
const resetButton = document.getElementById('reset') as HTMLButtonElement;
resetButton.onclick = () => {
	if (confirm('Really reset the game?')) {
		NodeCG.waitForReplicants(activeGameRep).then(() => {
			nodecg.sendMessage('resetGame', activeGameRep.value);
		})
	}
}
let gamesDataOld: GamesData | null = null;

activeGameRep.on('change', (newVal) => {
	populateDash();
	NodeCG.waitForReplicants(gamesRep).then(() => {
		gameSelectorDiv.innerHTML = '';
		if (gamesRep.value) {
			const games = Object.keys(gamesRep.value);
			for (let i = 0; i < games.length; i++) {
				const glueDiv = document.createElement('div');
				const inpt = document.createElement('input');
				inpt.type = 'radio';
				inpt.checked = newVal === games[i];
				inpt.id = `game-radio-button-${games[i]}`;
				inpt.name = 'selected-game';
				inpt.onclick = () => {
					activeGameRep.value = games[i];
				};
				glueDiv.appendChild(inpt);
				const labl = document.createElement('label');
				labl.htmlFor = inpt.id;
				labl.innerHTML = games[i];
				glueDiv.appendChild(labl);
				gameSelectorDiv.appendChild(glueDiv);
			}
		}
	});
});

gamesdataRep.on('change', (newVal, oldVal) => {
	gamesDataOld = oldVal;
	populateDash();
});

gamesRep.on('change', (newVal) => {
	populateDash();
});

function populateDash() {
	NodeCG.waitForReplicants(activeGameRep, gamesdataRep, gamesRep).then(() => {
		if (activeGameRep.value && gamesdataRep.value && gamesRep.value) {
			const activeGame = activeGameRep.value;
			const gameData = gamesdataRep.value[activeGame];
			const oldGameData = gamesDataOld ? gamesDataOld[activeGame] : null;
			const gameDef = gamesRep.value[activeGame];
			const dataArrays = Object.entries(gameData);
			const defArrays = gameDef.arrays;
			if (arrayHolder.childNodes.length > dataArrays.length) {
				arrayHolder.innerHTML = '';
			}
			let arrayIndex = -1;
			for (const [arrayName, arrayData] of dataArrays) {
				const oldArrayData =
					oldGameData && oldGameData[arrayName] ? oldGameData[arrayName] : null;
				if (oldArrayData && oldArrayData.length !== arrayData.length) {
					submitArray(activeGame, arrayName, true);
				}
				const arrayDef = defArrays[arrayName];
				if (arrayDef === undefined)
					nodecg.log.error(`Game definition/data mismatch`);
				const arrayFields = Object.entries(arrayDef.fields);
				arrayIndex++;
				const arrayDiv = verifyElement(arrayHolder, arrayIndex, 'div');
				const titleDiv = verifyElement(arrayDiv, 0, 'div');
				titleDiv.innerHTML = arrayName;
				const arrayTable = verifyElement(
					arrayDiv,
					1,
					arrayDef.display === 'table' ? 'table' : 'div'
				);
				if (arrayDef.display === 'table') {
					const titleRow = verifyElement(arrayTable, 0, 'tr');
					for (let i = 0; i < arrayFields.length; i++) {
						const field = arrayFields[i];
						const headerCell = verifyElement(
							titleRow,
							i,
							'th',
							i === arrayFields.length - 1
						);
						headerCell.innerHTML = field[0];
					}
				}
				let arrayChanged = false;
				const headerElements = arrayDef.display === 'table' ? 1 : 0;
				if (arrayData.length === 0) {
					const childNodes = arrayTable.childNodes;
					for (let i = headerElements; i < childNodes.length; i++) {
						arrayTable.removeChild(childNodes[i]);
					}
				}
				for (let i = 0; i < arrayData.length; i++) {
					const data = arrayData[i];
					const row = verifyElement(
						arrayTable,
						i + headerElements,
						arrayDef.display === 'table' ? 'tr' : 'div',
						i === arrayData.length - 1
					);
					for (let j = 0; j < arrayFields.length; j++) {
						const field = arrayFields[j][0];
						const fieldDef = arrayFields[j][1];
						const fieldCell = verifyElement(
							row,
							j,
							arrayDef.display === 'table' ? 'td' : 'div',
							j === arrayFields.length - 1
						);
						switch (fieldDef.type) {
							case 'stringEnum': {
								const index = +data[field].val;
								fieldCell.innerHTML = fieldDef.values[index];
								break;
							}
							case 'image': {
								const index = +data[field].val;
								const url = fieldDef.values[index].url;
								const image = verifyElement(fieldCell, 0, 'img');
								image.src = url;
								if (fieldDef.dashHeight)
									image.style.height = fieldDef.dashHeight;
								fieldCell.style.height =
									getComputedStyle(image).getPropertyValue('height');
								break;
							}
							case 'VFRenown': {
								const hadria =
									data.image?.val !== undefined &&
									arrayDef.fields['image']?.type === 'image' &&
									arrayDef.fields['image'].values[+data.image.val].name ===
										'Hadria';
								const plusFunc = () => {
									const arg: vfRenownChangeArg = {
										newVal: +data[field].val + 1,
										demiIndex: i,
										hadria,
									};
									nodecg.sendMessage('vfRenownChange', arg);
								};
								const minusFunc = () => {
									const arg: vfRenownChangeArg = {
										newVal: +data[field].val - 1,
										demiIndex: i,
										hadria,
									};
									nodecg.sendMessage('vfRenownChange', arg);
								};
								const changed = data[field].val !== data[field].old;
								if (changed) arrayChanged = true;
								verifyIncDecElement(
									minusFunc,
									plusFunc,
									+data[field].val,
									fieldCell,
									0,
									changed
								);
								break;
							}
							case 'integer': {
								const changed = data[field].val !== data[field].old;
								if (changed) {
									arrayChanged = true;
									fieldCell.classList.add('changed');
								} else fieldCell.classList.remove('changed');
								fieldCell.innerHTML = String(data[field].val);
								break;
							}
							case 'button': {
								const button = verifyElement(
									fieldCell,
									0,
									fieldDef.imageUrl ? 'img' : 'button'
								);
								if (fieldDef.imageUrl) {
									(button as HTMLImageElement).src = fieldDef.imageUrl;
									if (fieldDef.dashHeight)
										button.style.height = fieldDef.dashHeight;
								} else {
									button.innerHTML = field;
								}
								fieldCell.style.height =
									getComputedStyle(button).getPropertyValue('height');
								fieldCell.style.cursor = 'pointer';
								fieldCell.onclick = () => {
									const arg: ButtonArg = {
										game: activeGame,
										array: arrayName,
										button: field,
										index: i,
									};
									nodecg.sendMessage('buttonPush', arg);
								};
								const changed = data[field].val !== data[field].old;
								if (changed) {
									arrayChanged = true;
									button.classList.add('changed');
								} else button.classList.remove('changed');
								break;
							}
							default: {
								fieldCell.innerHTML = String(data[field].val); //fieldDef.type;
								break;
							}
						}
					}
				}
				const buttonDiv = verifyElement(arrayDiv, 2, 'div');
				buttonDiv.innerHTML = '';
				let buttonIndex = 0;
				if (arrayData.length > arrayDef.min) {
					const minus = verifyElement(buttonDiv, buttonIndex, 'button');
					buttonIndex++;
					let label = '-';
					if (activeGame === 'Veiled Fate' && arrayName === 'Demigods')
						label = 'Remove Sorcerer';
					if (activeGame === 'Veiled Fate' && arrayName === 'Hadria')
						label = 'Remove Hadria';
					minus.innerHTML = label;
					minus.onclick = () => {
						const arg: RemoveArrayItemArg = {
							game: activeGame,
							array: arrayName,
						};
						nodecg.sendMessage('removeArrayItem', arg);
					};
				}
				if (arrayData.length < arrayDef.max) {
					const plus = verifyElement(buttonDiv, buttonIndex, 'button');
					buttonIndex++;
					let label = '+';
					if (activeGame === 'Veiled Fate' && arrayName === 'Demigods')
						label = 'Add Sorcerer';
					if (activeGame === 'Veiled Fate' && arrayName === 'Hadria')
						label = 'Add Hadria';
					plus.innerHTML = label;
					plus.onclick = () => {
						const arg: AddArrayItemArg = { game: activeGame, array: arrayName };
						nodecg.sendMessage('addArrayItem', arg);
					};
				}
				if (arrayChanged) {
					const submit = verifyElement(buttonDiv, buttonIndex, 'button');
					buttonIndex++;
					submit.innerHTML = 'Submit';
					submit.onclick = () => {
						submitArray(activeGame, arrayName);
					};
				}
			}
		}
	});
}

function verifyElement<K extends keyof HTMLElementTagNameMap>(
	parent: HTMLElement,
	index: number,
	nodeName: K,
	last?: boolean
): HTMLElementTagNameMap[K] {
	const childNodes = parent.childNodes;
	const possibleExistingElement = childNodes[index];
	if (last) {
		for (let i = index + 1; i < childNodes.length; i++) {
			parent.removeChild(childNodes[i]);
		}
	}
	if (
		possibleExistingElement &&
		possibleExistingElement.nodeName == nodeName.toUpperCase()
	) {
		return possibleExistingElement as HTMLElementTagNameMap[K];
	}
	const newElement = document.createElement(nodeName);
	parent.appendChild(newElement);
	return newElement;
}

function verifyIncDecElement(
	minusFunc: () => void,
	plusFunc: () => void,
	val: number,
	parent: HTMLElement,
	index: number,
	changed?: boolean
): HTMLDivElement {
	const incDec = verifyElement(parent, index, 'div', true);
	incDec.classList.add('incDec');
	const minus = verifyElement(incDec, 0, 'div');
	minus.innerHTML = '-';
	minus.onclick = minusFunc;
	const num = verifyElement(incDec, 1, 'div');
	num.style.width = '1em';
	num.innerHTML = String(val);
	if (changed) {
		num.classList.add('changed');
	} else num.classList.remove('changed');
	const plus = verifyElement(incDec, 2, 'div', true);
	plus.innerHTML = '+';
	plus.onclick = plusFunc;
	return incDec;
}

function submitArray(gameName: string, arrayName: string, noChange?: boolean) {
	NodeCG.waitForReplicants(gamesdataRep, gamesRep).then(() => {
		if (!gamesdataRep.value || !gamesRep.value) return;
		const newRepArray: GameArrayData[] = JSON.parse(
			JSON.stringify(gamesdataRep.value[gameName][arrayName])
		);
		const animateData: AnimateData = [];
		const gameItemDefs = gamesRep.value[gameName].arrays[arrayName].fields;
		let vfSmites = 0;
		for (let i = 0; i < newRepArray.length; i++) {
			const repArrayItem = newRepArray[i];
			const animateArrayItem: AnimateData[number] = {};
			for (const key of Object.keys(repArrayItem)) {
				const itemDef = gameItemDefs[key];
				switch (itemDef.type) {
					case 'button': {
						if (
							gameName === 'Veiled Fate' &&
							arrayName === 'Demigods' &&
							key === 'smite' &&
							repArrayItem[key].val === 1
						)
							vfSmites++;
						animateArrayItem[key] = repArrayItem[key].val;
						repArrayItem[key].val = 0;
						break;
					}
					case 'image': {
						animateArrayItem[key] = itemDef.values[+repArrayItem[key].val];
						repArrayItem[key].old = repArrayItem[key].val;
						break;
					}
					default: {
						animateArrayItem[key] = repArrayItem[key].val;
						repArrayItem[key].old = repArrayItem[key].val;
						break;
					}
				}
			}
			animateData.push(animateArrayItem);
		}
		if (
			vfSmites &&
			typeof gamesdataRep.value['Veiled Fate']['Hadria'][0]?.renown?.val ===
				'number'
		) {
			const oldHadriaRenown =
				gamesdataRep.value['Veiled Fate']['Hadria'][0].renown.val;
			let newHadriaRenown = oldHadriaRenown + vfSmites;
			if (newHadriaRenown > 12) newHadriaRenown = 12;
			const arg: vfRenownChangeArg = {
				newVal: newHadriaRenown,
				demiIndex: 0,
				hadria: true,
			};
			nodecg.sendMessage('vfRenownChange', arg);
		}
		const arg: AnimateArrayArg = {
			game: gameName,
			array: arrayName,
			data: animateData,
		};
		nodecg.sendMessage('animateArray', arg);
		if (!noChange) gamesdataRep.value[gameName][arrayName] = newRepArray;
	});
}
