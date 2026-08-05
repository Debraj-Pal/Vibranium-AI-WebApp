import { createContext } from 'react';

export interface AuthContextType {
  currentUser: any;
  authLoading: boolean;
  userPlan: 'free' | 'pro' | 'max';
  setUserPlan: (plan: 'free' | 'pro' | 'max') => void;
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  authLoading: true,
  userPlan: 'free',
  setUserPlan: () => {},
});
