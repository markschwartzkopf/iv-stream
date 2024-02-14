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
