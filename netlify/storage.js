import { createHash } from 'node:crypto';
import { getDatabase } from '@netlify/database';
import { getDeployStore, getStore } from '@netlify/blobs';

const hash = value => createHash('sha256').update(value).digest('hex');

export function netlifyStorage(deployContext) {
  const { pool, sql } = getDatabase();
  const uploads = () => deployContext === 'production'
    ? getStore({ name: 'mms-private-uploads', consistency: 'strong', region: 'eu-central-1' })
    : getDeployStore({ name: 'mms-private-uploads', region: 'eu-central-1' });
  return {
    async read() {
      const [row] = await sql`SELECT state FROM mms_records WHERE id`;
      return row.state;
    },
    async update(change) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const { rows: [row] } = await client.query('SELECT state FROM mms_records WHERE id FOR UPDATE');
        const result = await change(row.state);
        if (!result.error) {
          await client.query('UPDATE mms_records SET state = $1 WHERE id', [JSON.stringify(row.state)]);
        }
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },
    putFile: (id, bytes) => uploads().set(id, bytes),
    async getFile(id) {
      const data = await uploads().get(id, { type: 'arrayBuffer', consistency: 'strong' });
      return data === null ? null : Buffer.from(data);
    },
    async putSession(token, { role, expires }) {
      await sql`DELETE FROM mms_sessions WHERE expires <= ${Date.now()}`;
      await sql`INSERT INTO mms_sessions VALUES (${hash(token)}, ${expires}, ${role})`;
    },
    async getSession(token) {
      const [session] = await sql`SELECT role, expires FROM mms_sessions WHERE token_hash = ${hash(token)} AND expires > ${Date.now()}`;
      return session;
    },
    async deleteSession(token) {
      await sql`DELETE FROM mms_sessions WHERE token_hash = ${hash(token)}`;
    },
    limit(windowMs, limit) {
      return async (req, res, next) => {
        const now = Date.now();
        const expires = Math.floor(now / windowMs) * windowMs + windowMs;
        const bucket = hash(JSON.stringify([req.ip, windowMs, limit, expires]));
        if (Math.random() < 0.01) await sql`DELETE FROM mms_limits WHERE expires <= ${now}`;
        const [{ hits }] = await sql`
          INSERT INTO mms_limits (bucket, hits, expires) VALUES (${bucket}, 1, ${expires})
          ON CONFLICT (bucket) DO UPDATE SET hits = mms_limits.hits + 1 RETURNING hits
        `;
        if (hits <= limit) return next();
        res.set('Retry-After', String(Math.ceil((expires - now) / 1000)));
        res.status(429).json({ error: 'Too many requests. Please try again later.' });
      };
    }
  };
}
