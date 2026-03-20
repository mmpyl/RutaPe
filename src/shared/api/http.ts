import { isApiErrorBody } from '../contracts/guards';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const parseErrorMessage = async (response: Response, fallback: string): Promise<string> => {
  try {
    const data: unknown = await response.json();
    if (isApiErrorBody(data)) return data.error;
    // Algunos servidores devuelven { message } en lugar de { error }
    if (typeof data === 'object' && data !== null && 'message' in data) {
      const msg = (data as Record<string, unknown>).message;
      if (typeof msg === 'string') return msg;
    }
  } catch {
    // respuesta sin JSON — usar fallback
  }
  return fallback;
};

/**
 * Realiza un fetch y devuelve el cuerpo parseado como JSON.
 * Si se proporciona `guard`, valida la forma del cuerpo y lanza si no coincide.
 */
export const requestJson = async <T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  fallbackError = 'Request failed',
  guard?: (v: unknown) => v is T,
): Promise<T> => {
  const response = await fetch(input, init);

  if (!response.ok) {
    const message = await parseErrorMessage(response, fallbackError);
    throw new ApiError(message, response.status);
  }

  const data: unknown = await response.json();

  if (guard && !guard(data)) {
    console.error('[API] Respuesta inesperada del servidor:', data);
    throw new ApiError('Respuesta del servidor con formato inesperado', 502);
  }

  return data as T;
};
