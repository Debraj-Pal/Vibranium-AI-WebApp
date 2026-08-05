import { getInitials, getAvatarStyle, stripMarkdown } from '../types';

/**
 * Utility functions for Vibranium AI
 */
export { getInitials, getAvatarStyle, stripMarkdown };

/** Format date/timestamp safely for UI display */
export function formatDate(timestamp: any): string {
  if (!timestamp) return '';
  let date: Date;
  if (typeof timestamp?.toMillis === 'function') {
    date = new Date(timestamp.toMillis());
  } else if (typeof timestamp?.seconds === 'number') {
    date = new Date(timestamp.seconds * 1000);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else {
    date = new Date();
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
