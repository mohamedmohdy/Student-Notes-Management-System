export const toNum = (val: any): number => (val === true || val === 1 || val === '1' ? 1 : 0);
export const toBool = (val: any): boolean => val === true || val === 1 || val === '1';
