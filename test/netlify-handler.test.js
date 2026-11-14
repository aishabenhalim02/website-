import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { localStorage } from '../local-storage.js';
import { expressHandler } from '../netlify/express-handler.js';

test('Netlify request adapter preserves query strings, secure cookies and binary uploads', async t => {
  const directory = await mkdtemp(path.join(tmpdir(), 'mms-handler-'));
  const previousPassword = process.env.ADMIN_PASSWORD;
  const password = randomBytes(24).toString('hex');
  process.env.ADMIN_PASSWORD = password;
  t.after(async () => {
    if (previousPassword === undefined) delete process.env.ADMIN_PASSWORD;
    else process.env.ADMIN_PASSWORD = previousPassword;
    await rm(directory, { recursive: true, force: true });
  });
  const storage = await localStorage(directory);
  const invoke = expressHandler(storage);
  const origin = 'https://mms.example.test';
  const request = (route, init) => invoke(new Request(origin + route, init), { ip: '192.0.2.2' });

  const prayers = await request('/api/prayers?month=2024-02');
  assert.equal(prayers.status, 200);
  assert.equal((await prayers.json()).days.length, 29);

  const form = new FormData();
  for (const [key, value] of Object.entries({ type: 'business', name: 'Fixture', email: 'test@example.test', consent: 'yes' })) {
    form.append(key, value);
  }
  const bytes = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.from([0xff, 0, 0x81])]);
  form.append('documents', new Blob([bytes], { type: 'application/pdf' }), 'proof.pdf');
  const submission = await request('/api/submissions', { method: 'POST', body: form, headers: { origin } });
  assert.equal(submission.status, 201);
  const [{ files: [file] }] = (await storage.read()).submissions;
  const filePath = '/api/admin/files/' + file.id;
  assert.equal((await request(filePath)).status, 401);

  const login = await request('/api/admin/login', {
    method: 'POST',
    headers: { origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  assert.equal(login.status, 200);
  const setCookie = login.headers.get('set-cookie');
  assert.match(setCookie, /HttpOnly.*SameSite=Strict.*Secure/);
  const download = await request(filePath, { headers: { Cookie: setCookie.split(';')[0] } });
  assert.equal(download.status, 200);
  assert.deepEqual(Buffer.from(await download.arrayBuffer()), bytes);
});
