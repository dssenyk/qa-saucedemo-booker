import type { APIRequestContext } from '@playwright/test';
import { booker } from '../config';

export type ApiResult = {
  status: number;
  body: unknown;
};

/**
 * Thin client for https://restful-booker.herokuapp.com/apidoc .
 * A successful delete is documented as HTTP 201 Created. Callers should
 * treat "the following GET is 404" as the real proof that the booking is gone.
 */
export class BookerClient {
  constructor(private readonly request: APIRequestContext) {}

  async authenticate(
    username: string = booker.username,
    password: string = booker.password,
  ): Promise<ApiResult & { token?: string }> {
    const result = await this.send('/auth', {
      method: 'POST',
      data: { username, password },
    });
    const token =
      typeof result.body === 'object' &&
      result.body !== null &&
      'token' in result.body &&
      typeof result.body.token === 'string'
        ? result.body.token
        : undefined;
    return { ...result, token };
  }

  createBooking(data: unknown): Promise<ApiResult> {
    return this.send('/booking', { method: 'POST', data });
  }

  getBooking(id: number): Promise<ApiResult> {
    return this.send(`/booking/${id}`, { method: 'GET' });
  }

  updateBooking(id: number, data: unknown, token?: string): Promise<ApiResult> {
    return this.send(`/booking/${id}`, {
      method: 'PUT',
      data,
      headers: this.authHeader(token),
    });
  }

  deleteBooking(id: number, token?: string): Promise<ApiResult> {
    return this.send(`/booking/${id}`, {
      method: 'DELETE',
      headers: this.authHeader(token),
    });
  }

  private authHeader(token?: string): Record<string, string> | undefined {
    return token ? { Cookie: `token=${token}` } : undefined;
  }

  private async send(
    path: string,
    options: {
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      data?: unknown;
      headers?: Record<string, string>;
    },
  ): Promise<ApiResult> {
    const response = await this.request.fetch(path, {
      method: options.method,
      data: options.data,
      headers: options.headers,
    });
    const text = await response.text();
    let body: unknown = text;
    if (text) {
      try {
        body = JSON.parse(text) as unknown;
      } catch {
        body = text;
      }
    }
    return { status: response.status(), body };
  }
}
