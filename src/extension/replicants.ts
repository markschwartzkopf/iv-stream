import NodeCG from '@nodecg/types';

const nodecg: NodeCG.ServerAPI = require('./nodecg-api-context').get();

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
