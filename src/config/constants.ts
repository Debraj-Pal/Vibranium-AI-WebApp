import { UserSettings } from '../types';

/**
 * Global Configuration & Defaults for Vibranium AI
 */
export const DEFAULT_USER_SETTINGS: UserSettings = {
  userId: 'guest',
  theme: 'dark',
  accessibility: {
    fontSize: 'md',
    screenReader: false,
    speechRate: 1.0,
  },
};

export const APP_CONFIG = {
  name: 'Vibranium AI',
  version: '1.0.0',
  description: 'Next-Generation Multi-Model AI Assistant & Workspace',
  apiEndpoints: {
    chat: '/api/chat',
    models: '/api/models',
    generateVideo: '/api/generate-video',
    videoStatus: '/api/video-status',
    downloadVideo: '/api/download-video',
    translate: '/api/translate',
    synthesize: '/api/synthesize',
    bulletin: '/api/bulletin',
  },
  plans: {
    free: { name: 'Free', limit: 'Standard speed & models' },
    pro: { name: 'Pro', limit: 'Faster response, Thinking Mode, Deep Research' },
    max: { name: 'Max', limit: 'Unlimited high-compute access & Veo 3.1 Video Lab' },
  }
};
