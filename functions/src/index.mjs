import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { defineInt, defineSecret, defineString } from 'firebase-functions/params';
import { onRequest } from 'firebase-functions/v2/https';
import { createHttpHandler, createService } from './service.mjs';
import { createPlacesProvider } from './provider.mjs';
import { createSharedLimiter } from './limiter.mjs';
initializeApp();
const key = defineSecret('PLACES_API_KEY');
const region = defineString('PLACES_REGION', { default: 'europe-west1' });
const detailsLimit = defineInt('PLACES_DETAILS_PER_MINUTE', { default: 30 });
const photosLimit = defineInt('PLACES_PHOTOS_PER_MINUTE', { default: 30 });
const options = { region, secrets: [key], timeoutSeconds: 30, memory: '256MiB', maxInstances: 10, cors: false };
function handler(kind) {
  return (req, res) => createHttpHandler(kind, createService({
    verify: token => getAuth().verifyIdToken(token, true),
    limit: createSharedLimiter(getFirestore(), { details: Math.max(1, detailsLimit.value()), photo: Math.max(1, photosLimit.value()) }),
    provider: createPlacesProvider(() => key.value()),
  }))(req, res);
}
export const placeDetails = onRequest(options, handler('details'));
export const placePhoto = onRequest(options, handler('photo'));
