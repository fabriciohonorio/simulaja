
/**
 * Utilitário para lidar com conversões de data de nascimento do CRM
 */

export function parseBirthday(birthStr: string | any): Date | null {
  if (!birthStr || typeof birthStr !== 'string') return null;
  
  try {
    let day, month, year;
    
    if (birthStr.includes('/')) {
      // Formato DD/MM/YYYY
      const parts = birthStr.split('/');
      day = parseInt(parts[0]);
      month = parseInt(parts[1]) - 1; // 0-indexed
      year = parseInt(parts[2]);
    } else if (birthStr.includes('-')) {
      // Formato YYYY-MM-DD
      const parts = birthStr.split('-');
      year = parseInt(parts[0]);
      month = parseInt(parts[1]) - 1;
      day = parseInt(parts[2]);
    } else if (birthStr.length === 8) {
      // Formato DDMMYYYY
      day = parseInt(birthStr.substring(0, 2));
      month = parseInt(birthStr.substring(2, 4)) - 1;
      year = parseInt(birthStr.substring(4, 8));
    } else {
      return null;
    }
    
    const date = new Date(year, month, day);
    if (isNaN(date.getTime())) return null;
    return date;
  } catch (e) {
    return null;
  }
}

export function isBirthdayToday(birthStr: string | any): boolean {
  const date = parseBirthday(birthStr);
  if (!date) return false;
  
  const today = new Date();
  return date.getDate() === today.getDate() && date.getMonth() === today.getMonth();
}

export function isBirthdayThisMonth(birthStr: string | any): boolean {
  const date = parseBirthday(birthStr);
  if (!date) return false;
  
  const today = new Date();
  return date.getMonth() === today.getMonth();
}
