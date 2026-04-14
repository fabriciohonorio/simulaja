/**
 * Padrões de formatação para o CRM
 */

/**
 * Formata um nome para TODAS LETRAS MAIÚSCULAS
 */
export const formatToUpper = (text: string | null | undefined): string => {
  if (!text) return "";
  return text.trim().toUpperCase();
};

/**
 * Formata números para o padrão de 4 dígitos (ex: 0392)
 * Se não for um número válido, retorna o texto original limpo
 */
export const formatToFourDigits = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return "";
  
  const strValue = String(value).trim();
  if (strValue === "") return "";
  
  // Remove qualquer caractere que não seja número para a formatação
  const cleanValue = strValue.replace(/\D/g, "");
  
  if (cleanValue === "") return strValue.toUpperCase(); // Caso contenha apenas letras, mantém maiúsculo
  
  return cleanValue.padStart(4, "0");
};
