import React from 'react';
import { getInitials, getAvatarStyle } from '../types';

interface SignOutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSignOut: () => Promise<void> | void;
  currentUser: any;
  loading?: boolean;
}

export default function SignOutConfirmModal({
  isOpen,
  onClose,
  onConfirmSignOut,
  currentUser,
  loading = false,
}: SignOutConfirmModalProps) {
  if (!isOpen || !currentUser) return null;

  const displayName = currentUser.displayName || 'Vibranium Explorer';
  const email = currentUser.email || '';
  const avatarStyle = getAvatarStyle(currentUser.uid || email || displayName);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4 animate-in fade-in duration-200">
      <div 
        id="sign-out-confirm-card"
        className="relative w-full max-w-[380px] overflow-hidden rounded-3xl border border-zinc-800 bg-[#1e1e20] p-7 text-white shadow-2xl flex flex-col items-center"
      >
        {/* Title */}
        <h2 className="text-2xl font-bold tracking-tight text-white text-center mb-6 leading-tight">
          Are you sure you want to log out?
        </h2>

        {/* User Card info block */}
        <div className="w-full bg-[#121214] border border-zinc-800/90 rounded-2xl p-3.5 flex items-center gap-3.5 mb-7">
          <div className={`h-11 w-11 rounded-full ${avatarStyle.bg} text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-md`}>
            {getInitials(displayName, email)}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <h3 className="text-sm font-bold text-white truncate leading-snug">
              {displayName}
            </h3>
            <p className="text-xs text-zinc-400 font-normal truncate mt-0.5">
              {email}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-3">
          <button
            id="confirm-logout-btn"
            onClick={onConfirmSignOut}
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-[0_0_25px_rgba(99,102,241,0.6)] border border-indigo-400/40 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Logging out...' : 'Log out'}
          </button>

          <button
            id="cancel-logout-btn"
            onClick={onClose}
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-transparent hover:bg-zinc-800/80 border border-zinc-700 text-white font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
