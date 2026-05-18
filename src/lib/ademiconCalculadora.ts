// Definição dos grupos da Ademicon conforme tabela
export const GRUPOS_ADEMICON = {
  IMOVEIS: [
    { nome: "GRUPO 1", participantes: 1000 },
    { nome: "GRUPO 2", participantes: 2000 },
    { nome: "GRUPO 3", participantes: 3333 },
    { nome: "GRUPO 4", participantes: 5000 },
    { nome: "GRUPO 5", participantes: 9999 },
  ],
  BENS_MOVEIS: [
    { nome: "GRUPO DE BENS MÓVEIS", participantes: 500 },
  ],
};

export interface ResultadoSorteio {
  premio1: number;
  premio2: number;
  premio3: number;
  premio4: number;
  premio5: number;
}

export interface CotasSorteadas {
  nome: string;
  participantes: number;
  cotas: ResultadoSorteio;
}

export interface ResultadosAdemicon {
  imoveis: CotasSorteadas[];
  bensMoveis: CotasSorteadas[];
}

/**
 * Pega os últimos 4 dígitos de um prêmio da Loteria Federal
 */
const extrairUltimos4Digitos = (premio: string | number): number => {
  const premioStr = String(premio).padStart(5, '0');
  return parseInt(premioStr.slice(-4), 10);
};

/**
 * Calcula a cota sorteada para um prêmio específico e quantidade de participantes
 */
const calcularCotaSorteada = (ultimos4Digitos: number, participantes: number): number => {
  const resto = ultimos4Digitos % participantes;
  // Se o resto for 0, a cota sorteada é igual à quantidade máxima de participantes
  return resto === 0 ? participantes : resto;
};

/**
 * Calcula os resultados para todos os grupos da Ademicon baseados nos prêmios informados
 */
export const calcularSorteioAdemicon = (premios: ResultadoSorteio): ResultadosAdemicon => {
  // 1. Extrair os 4 últimos dígitos de cada prêmio
  const base4Digitos = {
    premio1: extrairUltimos4Digitos(premios.premio1),
    premio2: extrairUltimos4Digitos(premios.premio2),
    premio3: extrairUltimos4Digitos(premios.premio3),
    premio4: extrairUltimos4Digitos(premios.premio4),
    premio5: extrairUltimos4Digitos(premios.premio5),
  };

  // 2. Função auxiliar para calcular todas as cotas de um grupo
  const calcularParaGrupo = (grupo: { nome: string; participantes: number }): CotasSorteadas => {
    return {
      nome: grupo.nome,
      participantes: grupo.participantes,
      cotas: {
        premio1: calcularCotaSorteada(base4Digitos.premio1, grupo.participantes),
        premio2: calcularCotaSorteada(base4Digitos.premio2, grupo.participantes),
        premio3: calcularCotaSorteada(base4Digitos.premio3, grupo.participantes),
        premio4: calcularCotaSorteada(base4Digitos.premio4, grupo.participantes),
        premio5: calcularCotaSorteada(base4Digitos.premio5, grupo.participantes),
      }
    };
  };

  // 3. Processar todos os grupos
  return {
    imoveis: GRUPOS_ADEMICON.IMOVEIS.map(calcularParaGrupo),
    bensMoveis: GRUPOS_ADEMICON.BENS_MOVEIS.map(calcularParaGrupo),
  };
};
