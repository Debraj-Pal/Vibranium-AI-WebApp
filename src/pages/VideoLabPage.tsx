import React from 'react';
import VeoVideoLab from '../components/VeoVideoLab';

interface VideoLabPageProps {
  currentUser: any;
}

export function VideoLabPage({ currentUser }: VideoLabPageProps) {
  return <VeoVideoLab currentUser={currentUser} />;
}

export default VideoLabPage;
