import { createHash } from 'node:crypto';
import { ServiceError } from './service.mjs';
export function createSharedLimiter(db, limits, now = Date.now) {
  return async (uid, kind) => {
    const timestamp = now();
    const window = Math.floor(timestamp / 60000);
    const id = createHash('sha256').update(`${uid}:${kind}:${window}`).digest('hex');
    const ref = db.collection('placesRequestLimits').doc(id);
    await db.runTransaction(async tx => {
      const snapshot = await tx.get(ref);
      const count = snapshot.data()?.count ?? 0;
      if (count >= limits[kind]) throw new ServiceError(429, 'rate-limit');
      tx.set(ref, { count: count + 1, expiresAt: new Date(timestamp + 120000) });
    });
  };
}
