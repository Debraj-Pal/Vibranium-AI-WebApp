import { auth, db, initFirebaseWithConfig } from '../lib/firebase';
import * as FirebaseAuth from 'firebase/auth';
import * as FirebaseFirestore from 'firebase/firestore';

/**
 * Firebase Client & Authentication Exports
 * Supports Firebase Firestore & Auth synchronization across Web and Capacitor Native platforms.
 */
export { auth, db, initFirebaseWithConfig, FirebaseAuth, FirebaseFirestore };
