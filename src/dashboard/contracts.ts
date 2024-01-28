/// <reference path="../../../../types/browser.d.ts" />
import { Contract } from '../extension/replicants'; //'./replicants';

const contractsRep = nodecg.Replicant<Contract[]>('contracts');
const selectedCard = nodecg.Replicant<string>('contractcard', {
  defaultValue: '',
});
const showCard = nodecg.Replicant<boolean>('showcard', {
  defaultValue: false,
});
const contractsDiv = document.getElementById('contracts') as HTMLDivElement;
const cardImg = document.getElementById('card') as HTMLImageElement;
const searchInput = document.getElementById('search') as HTMLInputElement;
const toggleButton = document.getElementById('toggle') as HTMLButtonElement;
//let selectedContractTitle = '';

searchInput.onkeyup = verifyAll;
searchInput.addEventListener('search', (e) => {
  //this is needed to handle user clicking the X
  searchInput.value === (e.target as HTMLInputElement).value;
  verifyAll();
});

showCard.on('change', (newVal) => {
  if (newVal) {
    toggleButton.innerHTML = 'Hide';
    toggleButton.onclick = () => {
      showCard.value = false;
    };
  } else {
    toggleButton.innerHTML = 'Show';
    toggleButton.onclick = () => {
      showCard.value = true;
    };
  }
});

selectedCard.on('change', (newVal) => {
  NodeCG.waitForReplicants(contractsRep).then(() => {
    if (contractsRep.value) {
      const contractIndex = contractsRep.value
        .map((x) => x.title)
        ?.indexOf(newVal);
      cardImg.src =
        contractIndex !== -1
          ? `assets/${contractsRep.value[contractIndex].imagePath}`
          : '';
    }
  });
  verifyAll();
});

function verifyAll() {
  NodeCG.waitForReplicants(selectedCard).then(() => {
    const selectedContractTitle = selectedCard.value ? selectedCard.value : '';
    for (let i = 0; i < contractsDiv.children.length; i++) {
      verify(contractsDiv.children[i] as HTMLDivElement, selectedContractTitle);
    }
  });
}

function verify(contractDiv: HTMLDivElement, selectedContractTitle: string) {
  if (
    searchInput.value.toUpperCase() ===
    contractDiv.innerHTML.slice(0, searchInput.value.length).toUpperCase()
  ) {
    contractDiv.classList.remove('hidden');
  } else contractDiv.classList.add('hidden');
  if (contractDiv.innerHTML === selectedContractTitle) {
    contractDiv.classList.remove('hidden');
    contractDiv.classList.add('selected');
  } else contractDiv.classList.remove('selected');
}

contractsRep.on('change', (newVal) => {
  NodeCG.waitForReplicants(selectedCard).then(() => {
    const selectedContractTitle = selectedCard.value ? selectedCard.value : '';
    contractsDiv.innerHTML = '';
    for (let i = 0; i < newVal.length; i++) {
      const contract = newVal[i];
      const contractDiv = newContractDiv(contract, selectedContractTitle);
      verify(contractDiv, selectedContractTitle);
      contractsDiv.appendChild(contractDiv);
    }
  });
});

function newContractDiv(contract: Contract, selectedContractTitle: string) {
  const rtn = document.createElement('div');
  rtn.innerHTML = contract.title;
  rtn.classList.add('contract-div');
  if (rtn.innerHTML === selectedContractTitle) rtn.classList.add('selected');
  rtn.onclick = () => {
    selectedCard.value = contract.title;
  };
  return rtn;
}
