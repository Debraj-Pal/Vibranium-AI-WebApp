import React from 'react';
import ExtraTools from '../components/ExtraTools';

interface ExtraToolsPageProps {
  toolType: 'camera' | 'screenshot' | 'alarms' | 'news';
  currentUser: any;
}

export function ExtraToolsPage({ toolType, currentUser }: ExtraToolsPageProps) {
  return <ExtraTools toolType={toolType} currentUser={currentUser} />;
}

export default ExtraToolsPage;
