/**
 * Profil de départ supposé compatible LG 6710V00090N (Older TV), NEC1.
 * Les commandes ne sont pas encore validées sur la LG 42CS460-ZA.
 * Chaque commande peut être remplacée depuis Réglages, sans recompiler.
 */
export const CARRIER_FREQUENCY = 38_000;

export const DEFAULT_CODES = {
  power: '0x20DF10EF',
  volumeUp: '0x20DF40BF',
  volumeDown: '0x20DFC03F',
} as const;

export type CommandId = keyof typeof DEFAULT_CODES;
export type IrCodeMap = Record<CommandId, string>;
export const COMMAND_IDS: CommandId[] = ['power', 'volumeUp', 'volumeDown'];

export function normalizeIrCode(value: string): string | null {
  const code = value.trim().toUpperCase();
  if (!/^0X[0-9A-F]{8}$/.test(code)) return null;
  return '0x' + code.slice(2);
}
