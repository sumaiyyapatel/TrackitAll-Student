/**
 * Cloud Functions scaffold for scheduled leaderboard update.
 *
 * Note: To deploy this you need to initialize Firebase Functions in this directory,
 * add firebase-admin and firebase-functions to package.json and deploy with `firebase deploy --only functions`.
 *
 * The function below is a placeholder that demonstrates where to plug the admin logic
 * (you can copy the logic from scripts/update_leaderboard.js into a shared module and call it here).
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize admin (the runtime will provide credentials)
try {
  admin.initializeApp();
} catch (e) {
  // may already be initialized in local/invoked context
}

const db = admin.firestore();

// Simple scheduled function: runs daily and updates the leaderboard.
exports.updateLeaderboardDaily = functions.pubsub
  .schedule('every 24 hours')
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('Running scheduled leaderboard update');

    // TODO: move compute logic into a shared module and import here.
    // For now we do a simple placeholder that does nothing destructive.
    try {
      // Example: touch a timestamp in a metadata doc
      await db.collection('leaderboard_meta').doc('last_run').set({ lastRun: admin.firestore.FieldValue.serverTimestamp() });
      console.log('Updated last_run timestamp');
    } catch (err) {
      console.error('Error during scheduled leaderboard update', err);
    }

    return null;
  });
