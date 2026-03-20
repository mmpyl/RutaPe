import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export interface Repository<T> {
  findAll(): Promise<T[]>;
  save(items: T[]): Promise<void>;
}

/**
 * Implementación de repositorio que persiste en un archivo JSON local.
 * Si el archivo no existe, se inicializa con los datos semilla provistos.
 *
 * Escrituras serializadas: cada llamada a save() encola la operación de disco
 * detrás de la anterior, evitando race conditions cuando llegan dos mutaciones
 * antes de que la primera writeFile termine.
 */
export const createJsonRepository = <T>(
  filePath: string,
  seed: () => T[],
): Repository<T> => {
  // Cola de escritura: cada save() encadena sobre la promesa anterior
  let writeQueue: Promise<void> = Promise.resolve();

  const ensureDir = async (): Promise<void> => {
    const dir = path.dirname(filePath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  };

  const findAll = async (): Promise<T[]> => {
    await ensureDir();

    if (!existsSync(filePath)) {
      const initial = seed();
      await writeFile(filePath, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }

    const raw = await readFile(filePath, 'utf-8');

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        console.error(`[repo] ${filePath} no contiene un array — usando seed`);
        return seed();
      }
      return parsed as T[];
    } catch (err) {
      console.error(`[repo] JSON malformado en ${filePath} — usando seed:`, err);
      return seed();
    }
  };

  const save = (items: T[]): Promise<void> => {
    // Encadenar sobre la cola existente para serializar escrituras
    writeQueue = writeQueue.then(async () => {
      await ensureDir();
      await writeFile(filePath, JSON.stringify(items, null, 2), 'utf-8');
    }).catch((err) => {
      console.error(`[repo] Error escribiendo ${filePath}:`, err);
    });
    return writeQueue;
  };

  return { findAll, save };
};
