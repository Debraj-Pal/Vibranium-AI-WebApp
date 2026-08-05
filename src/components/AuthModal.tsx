import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { Atom, Mail, Lock, User, LogIn, UserPlus, LogOut, X, AlertCircle } from 'lucide-react';
import { getInitials, getAvatarStyle } from '../types';
import SignOutConfirmModal from './SignOutConfirmModal';

interface AuthModalProps {
  onClose: () => void;
  currentUser: any;
}

export default function AuthModal({ onClose, currentUser }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!displayName.trim()) {
          setError('Name is required');
          setLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password sign-in is disabled in this Starter tier project. Please use the "Continue with Google" button below instead, which is fully enabled!');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password must be at least 6 characters.');
      } else if (
        err.code === 'auth/invalid-credential' || 
        err.code === 'auth/invalid-login-credentials' || 
        err.code === 'auth/user-not-found' || 
        err.code === 'auth/wrong-password' ||
        (err.message && err.message.toLowerCase().includes('credential')) ||
        (err.message && err.message.toLowerCase().includes('password'))
      ) {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError(err.message || 'An error occurred during authentication.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setError('');
    setLoading(true);
    try {
      await signOut(auth);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to sign out.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onClose();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || (err.message && err.message.includes('popup-closed-by-user'))) {
        console.warn('Google Sign-In popup closed by user before completion.');
        setError('The Google Sign-In window was closed before completion. Please try again and complete the sign-in.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        console.warn('Google Sign-In popup request was cancelled.');
        setError('Google Sign-In request was cancelled. Please try again.');
      } else if (err.code === 'auth/operation-not-allowed') {
        console.error(err);
        setError('This sign-in method is not enabled. Please use Google Sign-In which is enabled on your project.');
      } else {
        console.error(err);
        setError(err.message || 'Failed to sign in with Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 safe-pt safe-pb">
      <div 
        id="auth-container" 
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-[#111111] p-6 md:p-8 text-white shadow-2xl"
      >
        {/* Subtle accent glow */}
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="relative flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <Atom className="h-6 w-6 text-indigo-400 animate-[spin_10s_linear_infinite] drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
            <h2 className="text-xl font-bold tracking-tight text-white">
              {currentUser ? 'User Account' : isSignUp ? 'Create Account' : 'Vibranium Auth'}
            </h2>
          </div>
          <button 
            id="close-auth-btn"
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {currentUser ? (
          /* Profile & Logout State */
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center py-4 text-center">
              {(() => {
                const avatarStyle = getAvatarStyle(currentUser.uid || currentUser.email || currentUser.displayName);
                return (
                  <div className={`mb-3 flex h-16 w-16 items-center justify-center rounded-full ${avatarStyle.bg} text-2xl font-bold text-white shadow-lg ${avatarStyle.glow}`}>
                    {getInitials(currentUser.displayName, currentUser.email)}
                  </div>
                );
              })()}
              <h3 className="text-lg font-semibold text-white">
                {currentUser.displayName || 'Vibranium Explorer'}
              </h3>
              <p className="text-sm text-zinc-400 font-mono mt-1">{currentUser.email}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Securely Syncing
              </div>
            </div>

            <p className="text-xs text-center text-zinc-400">
              Your conversations, translation logs, and preferences are securely encrypted and synchronized across all your devices using our persistent cloud database.
            </p>

            <button
              id="sign-out-btn"
              onClick={() => setShowConfirmLogout(true)}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-md bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 py-3 text-sm font-medium text-red-400 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              Sign Out of Vibranium
            </button>

            {/* Confirmation Dialog overlay */}
            <SignOutConfirmModal
              isOpen={showConfirmLogout}
              onClose={() => setShowConfirmLogout(false)}
              onConfirmSignOut={handleSignOut}
              currentUser={currentUser}
              loading={loading}
            />
          </div>
        ) : (
          /* Log In / Sign Up Forms */
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 rounded-md bg-red-500/10 border border-red-500/20 p-3.5 text-sm text-red-400">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Full Name</label>
                <div className="relative">
                  <User className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    id="auth-name-input"
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full rounded-md border border-zinc-800 bg-zinc-900 py-3 pr-4 pl-10 text-sm text-white placeholder-zinc-500 outline-none focus:border-indigo-500/50 focus:bg-zinc-850 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Email Address</label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@example.com"
                  className="w-full rounded-md border border-zinc-800 bg-zinc-900 py-3 pr-4 pl-10 text-sm text-white placeholder-zinc-500 outline-none focus:border-indigo-500/50 focus:bg-zinc-850 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Password</label>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  id="auth-password-input"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-md border border-zinc-800 bg-zinc-900 py-3 pr-4 pl-10 text-sm text-white placeholder-zinc-500 outline-none focus:border-indigo-500/50 focus:bg-zinc-850 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono"
                />
              </div>
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-500 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/10 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
            >
              {isSignUp ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
              {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Log In'}
            </button>

            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800"></div>
              </div>
              <span className="relative bg-[#111111] px-3 text-[10px] uppercase tracking-widest text-zinc-500 font-mono font-bold">or</span>
            </div>

            <button
              id="google-signin-btn"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 rounded-md bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 py-3 text-sm font-medium text-white transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center justify-center pt-3 text-xs text-zinc-400">
              <span>{isSignUp ? 'Already have an account?' : "Don't have an account?"}</span>
              <button
                id="toggle-auth-mode-btn"
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="ml-1.5 font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {isSignUp ? 'Log In' : 'Sign Up'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
