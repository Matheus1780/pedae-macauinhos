import type { Snapshot, Command, CheckoutInput, Quote, Vehicle, Order } from '../domain/types';
export interface Challenge {
  id: string;
  expiresAt: number;
  resendAt: number;
}
export interface Repository {
  readonly mode: 'demo' | 'api';
  load(): Promise<Snapshot>;
  dispatch(command: Command): Promise<Snapshot>;
  requestOtp(phone: string, channel: 'sms' | 'whatsapp'): Promise<Challenge>;
  verifyOtp(challengeId: string, code: string, name: string): Promise<Snapshot>;
  recover(identifier: string): Promise<void>;
  quote(addressId: string, vehicle: Vehicle): Promise<Quote>;
  checkout(input: CheckoutInput): Promise<{ snapshot: Snapshot; order: Order }>;
}
export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}
