/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const functions = require('firebase-functions');

exports.getGenAIKey = functions.https.onCall(async () => {
  const client = new SecretManagerServiceClient();
  const name = 'projects/385087703943/secrets/GOOGLE_GENAI_API_KEY/versions/latest';

  try {
    const [version] = await client.accessSecretVersion({ name });
    const payload = version.payload.data.toString('utf8');
    return { apiKey: payload };
  } catch (error) {
    console.error('Failed to access secret:', error);
    throw new functions.https.HttpsError('internal', 'Failed to retrieve API key');
  }
});

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
