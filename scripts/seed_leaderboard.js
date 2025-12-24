/*
 * Seed leaderboard collection using Firebase Admin SDK.
 *
 * Usage:
 *   node scripts/seed_leaderboard.js /path/to/serviceAccount.json       # run seeding
 *   node scripts/seed_leaderboard.js /path/to/serviceAccount.json --dry  # dry-run only
 *
 * The script writes each entry as a document with id = userId for easy upserts.
 * It will NOT run by default in this repo; you must provide admin credentials.
 */

const admin = require('firebase-admin');
const fs = require('fs');

async function main() {
  const serviceAccountPath = process.argv[2] || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const dryRun = process.argv.includes('--dry') || process.env.DRY_RUN === '1';

  if (!serviceAccountPath) {
    console.error('Missing service account path. Provide as first arg or set GOOGLE_APPLICATION_CREDENTIALS.');
    process.exit(1);
  }

  let serviceAccount;
  try {
    serviceAccount = require(serviceAccountPath);
  } catch (err) {
    console.error('Failed to load service account JSON:', err.message);
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  const db = admin.firestore();

  const entries = [
    { userId: 'uid_001', name: 'Sumaiyya', points: 1200, level: 5, avatar: '' },
    { userId: 'uid_002', name: 'Alex', points: 1100, level: 4, avatar: '' },
    { userId: 'uid_003', name: 'Rina', points: 1000, level: 4, avatar: '' },
    { userId: 'uid_004', name: 'Diego', points: 900, level: 3, avatar: '' },
    { userId: 'uid_005', name: 'Maya', points: 850, level: 3, avatar: '' }
  ];

  console.log('Dry run:', dryRun);

  for (const e of entries) {
    const docRef = db.collection('leaderboard').doc(e.userId);
    if (dryRun) {
      console.log(`[dry] would set ${docRef.path} =>`, e);
    } else {
      console.log('Writing', docRef.path);
      await docRef.set(e, { merge: true });
    }
  }

  console.log('Done');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
