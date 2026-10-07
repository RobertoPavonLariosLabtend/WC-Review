export class ServiceError extends Error {
  constructor(status, code) { super(code); this.status = status; this.code = code; }
}
export const validId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,256}$/.test(value);
export function validPhoto(id, name) {
  return typeof name === 'string' && name.length <= 1024 && new RegExp(`^places/${id}/photos/[A-Za-z0-9_-]+$`).test(name);
}
export function createService({ verify, limit, provider }) {
  return async (kind, request) => {
    const match = /^Bearer (\S{1,8192})$/.exec(request.authorization ?? '');
    if (!match) throw new ServiceError(401, 'unauthorized');
    let user;
    try { user = await verify(match[1]); } catch { throw new ServiceError(401, 'unauthorized'); }
    if (!user?.uid) throw new ServiceError(401, 'unauthorized');
    const { placeId, photo } = request.query;
    if (!validId(placeId) || (kind === 'photo' && !validPhoto(placeId, photo))) throw new ServiceError(400, 'invalid-request');
    await limit(user.uid, kind);
    if (kind === 'details') return provider.details(placeId);
    // Membership is verified against fresh metadata; never persist Places content.
    await limit(user.uid, 'details');
    const details = await provider.details(placeId);
    if (details.photo?.resource !== photo) throw new ServiceError(400, 'invalid-photo');
    return { ...(await provider.photo(photo)), authors: details.photo.authors };
  };
}
export function createHttpHandler(kind, service) {
  return async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    if (req.method !== 'GET') { res.status(405).json({ code: 'method-not-allowed' }); return; }
    try { res.status(200).json(await service(kind, { authorization: req.headers.authorization, query: req.query })); }
    catch (error) {
      const safe = error instanceof ServiceError ? error : new ServiceError(503, 'unavailable');
      res.status(safe.status).json({ code: safe.code });
    }
  };
}
