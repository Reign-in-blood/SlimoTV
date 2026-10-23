import { Capacitor, registerPlugin } from '@capacitor/core';
import { CARRIER_FREQUENCY } from './codes';

interface ConsumerIrPlugin {
  isAvailable(): Promise<{ available: boolean }>;
  transmit(options: { code: string; carrierFrequency: number }): Promise<void>;
}

const consumerIr = registerPlugin<ConsumerIrPlugin>('ConsumerIr');

export async function isIrAvailable(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    return (await consumerIr.isAvailable()).available;
  } catch {
    return false;
  }
}

export async function transmitIr(code: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('L’émission IR nécessite l’application Android.');
  }
  await consumerIr.transmit({ code, carrierFrequency: CARRIER_FREQUENCY });
}
