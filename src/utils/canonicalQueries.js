import { collection, query, where, orderBy, limit } from '@/lib/localDb';

/**
 * Canonical user-owned collection query
 * - Always filter by userId == uid
 * - Always order by date desc
 * - Single shared query shape across pages
 */
export const userRecent = (db, collectionName, uid, limitCount = 50) =>
  query(
    collection(db, collectionName),
    where('userId', '==', uid),
    orderBy('date', 'desc'),
    limit(limitCount)
  );

export default userRecent;
