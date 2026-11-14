import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';

export const emptyRecords = () => ({
  submissions: [], listings: [], schedules: [], sources: [], products: [], audit: []
});

export async function localStorage(directory) {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const records = path.join(directory, 'records.json');
  const sessions = new Map();
  const files = id => path.join(directory, id);
  let queue = Promise.resolve();

  async function read() {
    try {
      return { ...emptyRecords(), ...JSON.parse(await readFile(records, 'utf8')) };
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      return emptyRecords();
    }
  }

  return {
    read,
    update(change) {
      const operation = queue.then(async () => {
        const state = await read();
        const result = await change(state);
        if (result.error) return result;
        const temporary = records + '.tmp';
        await writeFile(temporary, JSON.stringify(state), { mode: 0o600 });
        await rename(temporary, records);
        return result;
      });
      queue = operation.catch(() => {});
      return operation;
    },
    putFile: (id, bytes) => writeFile(files(id), bytes, { mode: 0o600 }),
    getFile: id => readFile(files(id)),
    putSession: (token, session) => sessions.set(token, session),
    getSession: token => sessions.get(token),
    deleteSession: token => sessions.delete(token)
  };
}
