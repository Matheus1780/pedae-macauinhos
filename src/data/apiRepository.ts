import type { Repository, Challenge } from './contracts';
import type { Snapshot, Command, Quote, Vehicle, CheckoutInput, Order } from '../domain/types';
import { DomainError } from '../domain/types';
export interface SessionVault {
  get(): Promise<string | null>;
  set(token: string | null): Promise<void>;
}
// Backend mediates the database and PSP. Database credentials never reach this app.
export class ApiRepository implements Repository {
  readonly mode = 'api' as const;
  constructor(
    private baseUrl: string,
    private vault: SessionVault,
    private fetcher: typeof fetch = fetch,
  ) {
    if (!/^https:\/\//.test(baseUrl)) throw new Error('EXPO_PUBLIC_API_URL deve usar HTTPS.');
  }
  private async request<T>(path: string, body?: unknown, key?: string): Promise<T> {
    const token = await this.vault.get();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await this.fetcher(`${this.baseUrl.replace(/\/$/, '')}${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        credentials: 'include',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(key ? { 'Idempotency-Key': key } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (!response.ok) {
        const e = (await response.json().catch(() => ({}))) as {
          code?: string;
          message?: string;
        };
        throw new DomainError(
          e.code ?? `HTTP_${response.status}`,
          e.message ?? 'Não foi possível concluir. Tente novamente.',
        );
      }
      return (await response.json()) as T;
    } catch (e) {
      if (e instanceof DomainError) throw e;
      throw new DomainError(
        'NETWORK',
        'Conexão indisponível. Confira sua internet e tente novamente.',
      );
    } finally {
      clearTimeout(timeout);
    }
  }
  load() {
    return this.request<Snapshot>('/snapshot');
  }
  async dispatch(command: Command) {
    if (command.type.startsWith('demo') || command.type === 'saveDemoCard')
      throw new DomainError('DEMO_ONLY', 'Este recurso é exclusivo da demonstração.');
    const s = await this.request<Snapshot>('/commands', command);
    if (['logout', 'deleteAccount'].includes(command.type)) await this.vault.set(null);
    return s;
  }
  requestOtp(phone: string, channel: 'sms' | 'whatsapp') {
    return this.request<Challenge>('/auth/otp', { phone, channel });
  }
  async verifyOtp(challengeId: string, code: string, name: string) {
    const result = await this.request<{
      snapshot: Snapshot;
      accessToken?: string;
    }>('/auth/verify', { challengeId, code, name });
    if (result.accessToken) await this.vault.set(result.accessToken);
    return result.snapshot;
  }
  async recover(identifier: string) {
    await this.request('/auth/recover', { identifier });
  }
  quote(addressId: string, vehicle: Vehicle) {
    return this.request<Quote>('/quotes', { addressId, vehicle });
  }
  checkout(input: CheckoutInput) {
    return this.request<{ snapshot: Snapshot; order: Order }>(
      '/checkout',
      input,
      input.idempotencyKey,
    );
  }
}
