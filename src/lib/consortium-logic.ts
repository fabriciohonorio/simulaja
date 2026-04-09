export const groupQuotaMap: Record<string, number> = {
  "5290": 1800,
  "5292": 2500,
  "5291": 1800,
  "6041": 3100,
  "5996": 1800,
  "6037": 2500,
  "5294": 2500,
  "1703": 2000,
};

export interface LoteriaResult {
  winCota: number;
  isWinner: boolean;
  isClose: boolean;
  diff: number | null;
  participants: number;
}

/**
 * Calculates the winning quota based on the Federal Lottery result.
 * 
 * Standard Rule: lotId % participants
 * Ademicon Vehicle Rule: (lotId % 10000) % participants
 */
export const getLoteriaStatus = (
  loteriaFederal: string,
  cotaStr: string | null,
  grupoStr: string | null,
  administradora: string | null = "MAGALU",
  tipoConsorcio: string | null = "",
  defaultParticipants: number = 600
): LoteriaResult | null => {
  if (!loteriaFederal) return null;
  const lotId = parseInt(loteriaFederal.replace(/\D/g, ''));
  if (isNaN(lotId)) return null;

  // Extreme cleaning for robustness
  const cleanGrupo = grupoStr?.replace(/\D/g, '') || ""; // Extrai apenas os números (ex: "GRUPO: 1703" -> "1703")
  const cleanAdmin = administradora?.trim().toUpperCase() || "";
  const cleanTipo = tipoConsorcio?.trim().toLowerCase() || "";

  // Get participants for this group
  const participants = cleanGrupo ? (groupQuotaMap[cleanGrupo] || defaultParticipants) : defaultParticipants;
  if (participants <= 0) return null;

  let calculationBasis = lotId;

  // Rule for Ademicon Vehicles: Use only the "milhar" (last 4 digits)
  const isAdemiconVehicle = cleanAdmin.includes("ADEMICON") && 
    (cleanTipo.includes("veículo") || cleanTipo.includes("veiculo"));

  if (isAdemiconVehicle) {
    calculationBasis = lotId % 10000;
  }

  const winCota = calculationBasis % participants === 0 ? participants : calculationBasis % participants;
  const clientCota = parseInt(cotaStr?.replace(/\D/g, '') || "0");
  
  if (!clientCota) return { winCota, isWinner: false, isClose: false, diff: null, participants };

  const diff = Math.min(
    Math.abs(clientCota - winCota),
    participants - Math.abs(clientCota - winCota)
  );
  
  return { 
    winCota, 
    isWinner: diff === 0, 
    isClose: diff > 0 && diff <= 10, 
    diff, 
    participants 
  };
};
