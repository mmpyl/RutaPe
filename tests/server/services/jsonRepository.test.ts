import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mockear fs/promises ANTES de importar el módulo bajo test
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('fs', () => ({
  existsSync: vi.fn(),
}));

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { createJsonRepository } from '../../../server/repository/jsonRepository';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface Item { id: string; value: number }

const seed = (): Item[] => [{ id: 'seed-1', value: 10 }, { id: 'seed-2', value: 20 }];

const mockExists = (exists: boolean) => vi.mocked(existsSync).mockReturnValue(exists);
const mockRead = (content: string) => vi.mocked(readFile).mockResolvedValue(content as never);

// ---------------------------------------------------------------------------
// findAll
// ---------------------------------------------------------------------------

describe('jsonRepository.findAll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(writeFile).mockResolvedValue(undefined);
    vi.mocked(mkdir).mockResolvedValue(undefined);
  });

  it('devuelve seed y escribe el archivo si no existe', async () => {
    mockExists(false);
    const repo = createJsonRepository<Item>('/data/test.json', seed);

    const result = await repo.findAll();

    expect(result).toEqual(seed());
    expect(writeFile).toHaveBeenCalledWith(
      '/data/test.json',
      JSON.stringify(seed(), null, 2),
      'utf-8',
    );
  });

  it('lee y parsea el archivo si existe', async () => {
    const stored: Item[] = [{ id: 'stored-1', value: 99 }];
    mockExists(true);
    mockRead(JSON.stringify(stored));

    const repo = createJsonRepository<Item>('/data/test.json', seed);
    const result = await repo.findAll();

    expect(result).toEqual(stored);
    expect(writeFile).not.toHaveBeenCalled();
  });

  it('devuelve seed si el archivo contiene JSON malformado', async () => {
    mockExists(true);
    mockRead('{ esto no es json válido }}}');

    const repo = createJsonRepository<Item>('/data/test.json', seed);
    const result = await repo.findAll();

    expect(result).toEqual(seed());
  });

  it('devuelve seed si el archivo contiene un objeto en lugar de array', async () => {
    mockExists(true);
    mockRead(JSON.stringify({ not: 'an array' }));

    const repo = createJsonRepository<Item>('/data/test.json', seed);
    const result = await repo.findAll();

    expect(result).toEqual(seed());
  });

  it('devuelve array vacío si el archivo tiene []', async () => {
    mockExists(true);
    mockRead('[]');

    const repo = createJsonRepository<Item>('/data/test.json', seed);
    const result = await repo.findAll();

    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// save
// ---------------------------------------------------------------------------

describe('jsonRepository.save', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(writeFile).mockResolvedValue(undefined);
    vi.mocked(mkdir).mockResolvedValue(undefined);
    mockExists(true);
  });

  it('escribe los items serializados en el archivo', async () => {
    const repo = createJsonRepository<Item>('/data/test.json', seed);
    const items: Item[] = [{ id: 'a', value: 1 }];

    await repo.save(items);

    expect(writeFile).toHaveBeenCalledWith(
      '/data/test.json',
      JSON.stringify(items, null, 2),
      'utf-8',
    );
  });

  it('serializa escrituras concurrentes — la segunda espera a la primera', async () => {
    const order: string[] = [];
    let resolveFirst!: () => void;

    vi.mocked(writeFile)
      .mockImplementationOnce(() => {
        order.push('start-1');
        return new Promise<void>((res) => { resolveFirst = () => { order.push('end-1'); res(); }; });
      })
      .mockImplementationOnce(() => {
        order.push('write-2');
        return Promise.resolve();
      });

    const repo = createJsonRepository<Item>('/data/test.json', seed);

    const p1 = repo.save([{ id: '1', value: 1 }]);
    const p2 = repo.save([{ id: '2', value: 2 }]);

    // La segunda escritura no ha empezado mientras la primera está pendiente
    expect(order).toEqual(['start-1']);

    // Resolver la primera escritura
    resolveFirst();
    await Promise.all([p1, p2]);

    // Las escrituras ocurrieron en orden
    expect(order).toEqual(['start-1', 'end-1', 'write-2']);
  });

  it('continúa con siguientes escrituras aunque una falle', async () => {
    vi.mocked(writeFile)
      .mockRejectedValueOnce(new Error('disco lleno'))
      .mockResolvedValueOnce(undefined);

    const repo = createJsonRepository<Item>('/data/test.json', seed);

    // Primera falla — no debe lanzar (el error se loguea internamente)
    await expect(repo.save([{ id: '1', value: 1 }])).resolves.toBeUndefined();

    // Segunda debe ejecutarse igualmente
    await repo.save([{ id: '2', value: 2 }]);
    expect(writeFile).toHaveBeenCalledTimes(2);
  });
});
