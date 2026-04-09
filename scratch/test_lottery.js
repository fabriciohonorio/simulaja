import { getLoteriaStatus } from '../src/lib/consortium-logic';

const testCases = [
  {
    loteriaFederal: "17282",
    cota: "1282",
    grupo: "1703",
    administradora: "ADEMICON",
    tipoConsorcio: "Veículo",
    expectedWinCota: 1282
  },
  {
    loteriaFederal: "17282",
    cota: "482",
    grupo: "5290", // participants 1800
    administradora: "MAGALU",
    tipoConsorcio: "Imóvel",
    expectedWinCota: 1082 // 17282 % 1800 = 1082
  }
];

testCases.forEach((tc, i) => {
  const result = getLoteriaStatus(tc.loteriaFederal, tc.cota, tc.grupo, tc.administradora, tc.tipoConsorcio);
  console.log(`Test Case ${i + 1}:`);
  console.log(`  Win Cota: ${result?.winCota}`);
  console.log(`  Expected: ${tc.expectedWinCota}`);
  console.log(`  isWinner: ${result?.isWinner}`);
  console.log(`  Match: ${result?.winCota === tc.expectedWinCota}`);
});
