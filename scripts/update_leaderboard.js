/**
 * scripts/update_leaderboard.js
 *
 * Lightweight admin script to recompute and update leaderboard entries.
 * - Uses firebase-admin and requires service account credentials (via --serviceAccount or GOOGLE_APPLICATION_CREDENTIALS)
 * - Supports --dry-run (default: false)
 *
 * This script uses a conservative heuristic to compute points from several collections.
 * Adjust collection names and weights to match your project schema.
 */

const path = require('path');
const fs = require('fs');

// Simple CLI parsing (avoid new deps):
const rawArgs = process.argv.slice(2);
const dryRun = rawArgs.includes('--dry-run') || rawArgs.includes('--dry');
let svcPath = null;
for (let i = 0; i < rawArgs.length; i++) {
  if (rawArgs[i] === '--serviceAccount' || rawArgs[i] === '--sa') {
    svcPath = rawArgs[i + 1];
    break;
  }
}
svcPath = svcPath || process.env.GOOGLE_APPLICATION_CREDENTIALS;

async function main() {
  if (!svcPath) {
    console.error('Service account required. Pass --serviceAccount <path> or set GOOGLE_APPLICATION_CREDENTIALS.');
    process.exit(1);
  }

  const admin = require('firebase-admin');

  let cert;
  try {
    const resolved = path.isAbsolute(svcPath) ? svcPath : path.resolve(process.cwd(), svcPath);
    cert = require(resolved);
  } catch (err) {
    console.error('Could not load service account JSON at', svcPath, err.message);
    process.exit(1);
  }

  admin.initializeApp({ credential: admin.credential.cert(cert) });
  const db = admin.firestore();

  console.log(`Starting leaderboard update (dryRun=${dryRun})`);

  // Helper: compute points for a single user using simple heuristics.
  const computePointsForUser = async (userId) => {
    let points = 0;

    // 1) activities: if docs have numeric 'points', sum them; otherwise +1 per activity
    try {
      const snap = await db.collection('activities').where('userId', '==', userId).get();
      for (const d of snap.docs) {
        const data = d.data();
        if (typeof data.points === 'number') points += data.points;
        else points += 1;
      }
    } catch (e) {
      // ignore missing collection or permission issues in admin context
    }

    // 2) habits: completed habits are worth 5 points each
    try {
      const snap = await db.collection('habits').where('userId', '==', userId).where('status', '==', 'completed').get();
      points += snap.size * 5;
    } catch (e) {}

    // 3) study_sessions: add 2 points per session or use durationMinutes/seconds
    try {
      const snap = await db.collection('study_sessions').where('userId', '==', userId).get();
      for (const d of snap.docs) {
        const data = d.data();
        if (typeof data.durationMinutes === 'number') points += Math.round(data.durationMinutes / 30) * 2; // 2 points per 30 minutes
        else points += 2;
      }
    } catch (e) {}

    // 4) weight_logs / water_intake etc: optional small bonuses
    try {
      const snap = await db.collection('water_intake').where('userId', '==', userId).get();
      points += Math.floor(snap.size / 7); // weekly bonus placeholder
    } catch (e) {}

    return points;
  };

  // Load users
  const usersSnap = await db.collection('users').get();
  console.log(`Found ${usersSnap.size} users`);

  const results = [];
  for (const udoc of usersSnap.docs) {
    const u = udoc.data();
    const userId = udoc.id;
    const displayName = u.displayName || u.name || u.email || userId;
    try {
      const points = await computePointsForUser(userId);
      results.push({ userId, displayName, points });
      if (!dryRun) {
        const ref = db.collection('leaderboard').doc(userId);
        await ref.set({ userId, displayName, points, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      }
      console.log(`User ${displayName} (${userId}) -> ${points} pts`);
    } catch (err) {
      console.error('Error computing for user', userId, err.message || err);
    }
  }

  console.log('Leaderboard update complete');
  if (dryRun) {
    console.log('Dry-run output sample:', results.slice(0, 10));
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error', err);
  process.exit(1);
});
