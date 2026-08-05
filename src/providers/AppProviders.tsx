import React, { useState, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { SettingsContext } from '../contexts/SettingsContext';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserSettings } from '../types';
import { DEFAULT_USER_SETTINGS } from '../config/constants';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<'free' | 'pro' | 'max'>(() => {
    return (localStorage.getItem('vibranium_user_plan') as 'free' | 'pro' | 'max') || 'free';
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('vibranium_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse local settings:", e);
      }
    }
    return DEFAULT_USER_SETTINGS;
  });

  useEffect(() => {
    let userDocUnsubscribe: (() => void) | null = null;

    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);

      if (userDocUnsubscribe) {
        userDocUnsubscribe();
        userDocUnsubscribe = null;
      }

      if (user) {
        const userRef = doc(db, 'users', user.uid);
        userDocUnsubscribe = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.plan && ['free', 'pro', 'max'].includes(data.plan)) {
              setUserPlan(data.plan as 'free' | 'pro' | 'max');
            } else {
              setUserPlan('free');
            }
          } else {
            setUserPlan('free');
            setDoc(userRef, {
              email: user.email || '',
              plan: 'free',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            }, { merge: true }).catch(e => console.error("Error initializing user doc:", e));
          }
        }, (err) => {
          console.error("Firestore user plan subscription error:", err);
          setUserPlan('free');
        });
      } else {
        const savedLocalPlan = localStorage.getItem('vibranium_user_plan');
        setUserPlan((savedLocalPlan as 'free' | 'pro' | 'max') || 'free');
      }
    });

    return () => {
      authUnsubscribe();
      if (userDocUnsubscribe) userDocUnsubscribe();
    };
  }, []);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('vibranium_settings', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ currentUser, authLoading, userPlan, setUserPlan }}>
      <SettingsContext.Provider value={{ settings, updateSettings }}>
        {children}
      </SettingsContext.Provider>
    </AuthContext.Provider>
  );
}
