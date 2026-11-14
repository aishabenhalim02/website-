import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app-server.js';
import { localStorage } from './local-storage.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const storage = await localStorage(process.env.MMS_DATA_DIR || path.join(root, '.data'));
const port = Number(process.env.PORT) || 3000;
createApp(storage, { publicDir: path.join(root, 'public') })
  .listen(port, '0.0.0.0', () => console.log('MMS server listening on port ' + port));
