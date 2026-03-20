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
    const data = await response.json();
    if (typeof data?.error === 'string') return data.error;
    if (typeof data?.message === 'string') return data.message;
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
