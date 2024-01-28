/// <reference path="../../../../types/browser.d.ts" />
import { Contract } from '../extension/replicants'; //'./replicants';

const contractsRep = nodecg.Replicant<Contract[]>('contracts');
const selectedCard = nodecg.Replicant<string>('contractcard');
const showCard = nodecg.Replicant<boolean>('showcard');
const cardImg = document.getElementById('card') as HTMLImageElement;

selectedCard.on('change', (newVal) => {
  console.log(newVal);
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
});

showCard.on('change', (newVal) => {
  if (newVal) {
    cardImg.style.animation = 'fade-in 3000ms forwards';
  } else cardImg.style.animation = 'fade-out 3000ms forwards';
})