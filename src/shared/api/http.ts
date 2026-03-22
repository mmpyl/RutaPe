const parseErrorMessage = async (response: Response, fallback: string) => {
  try {
    const data = await response.json();
    if (typeof data?.error === 'string') return data.error;
    if (typeof data?.message === 'string') return data.message;
  } catch {
    // ignore malformed/non-json responses and use fallback
  }

  return fallback;
};

export const requestJson = async <T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  fallbackError = 'Request failed',
  validate?: (value: unknown) => value is T,
): Promise<T> => {
  const response = await fetch(input, init);

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, fallbackError));
  }

  const data = (await response.json()) as unknown;

  if (validate && !validate(data)) {
    throw new Error('Unexpected response payload');
  }

  return data as T;
};
