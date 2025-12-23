import { db } from '@/firebase/config';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  setDoc,
  doc
} from 'firebase/firestore';

/**
 * Initialize collections on first user login
 * Call this in onAuthStateChanged after user creation
 */
export const initializeUserCollections = async (userId) => {
  try {
    // Check if user already initialized
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDocs(query(collection(db, 'users'), where('uid', '==', userId)));
    
    if (!userSnap.empty) {
      console.log('User collections already initialized');
      return;
    }

    // Initialize empty collections by creating a dummy doc and deleting it
    const collectionsToInitialize = [
      'attendance',
      'courses',
      'expenses',
      'goals',
      'habits',
      'health',
      'mood_entries',
      'study_sessions',
      'exams',
      'recurring_expenses',
      'water_intake',
      'weight_logs',
      'friends',
      'activities',
      'challenges'
    ];

    for (const collName of collectionsToInitialize) {
      try {
        const dummyRef = doc(db, collName, `_initialize_${userId}`);
        await setDoc(dummyRef, {
          userId: userId,
          _initialized: true,
          createdAt: new Date().toISOString()
        });
        // Optional: Delete dummy doc if you want completely empty collections
        // await deleteDoc(dummyRef);
      } catch (error) {
        console.warn(`Could not initialize ${collName}:`, error.message);
      }
    }

    console.log('Collections initialized successfully');
  } catch (error) {
    console.error('Error initializing collections:', error);
  }
};

/**
 * Safe query with error handling
 */
export const safeQuery = async (queryFn, errorMessage = 'Error fetching data') => {
  try {
    return await queryFn();
  } catch (error) {
    console.error(errorMessage, error);
    throw new Error(`${errorMessage}: ${error.message}`);
  }
};