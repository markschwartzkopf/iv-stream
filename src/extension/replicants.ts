import { NodeCG } from '../../../../types/server';

const nodecg: NodeCG = require('./nodecg-api-context').get();

/* const contracts = require('./contracts.json');
const contractsRep = nodecg.Replicant<Contract[]>('contracts', {
	defaultValue: contracts,
});



export type Contract = {
	id: number;
	title: string;
	cardType: 'Contract';
	type: ContractType;
	imagePath: string;
	fileName: string;
};
export type ContractType = string; */


const moonrakers: Game = {
	name: 'Moonrakers',
	arrays: [],
};
const veiledFate: Game = {
	name: 'Veiled Fate',
	arrays: [
		{
			name: 'players',
			fields: [{ name: 'name', type: 'string', unique: true }],
			min: 2,
			max: 8,
		},
		{
			name: 'Demigods',
			fields: [
				{
					name: 'name',
					type: 'stringEnum',
					unique: true,
					values: [
						'Pentha',
						'Agamar',
						'Klar',
						'Aponi',
						'Saghari',
						'Namari',
						'Naka',
						'Belan',
						'Isabel',
					],
				},
				{ name: 'score', type: 'integer', min: 0, max: 12 },
			],
			min: 3,
			max: 9,
		},
	],
};

type Game = {
	name: string;
	arrays: { name: string; fields: ArrayField[]; max: number; min: number }[];
};

type ArrayField = { name: string; unique?: true } & (
	| StringField
	| StringEnumField
	| IntegerField
);
type StringField = { type: 'string' };
type StringEnumField = { type: 'stringEnum'; values: string[] };
type IntegerField = { type: 'integer'; min?: number; max?: number };
