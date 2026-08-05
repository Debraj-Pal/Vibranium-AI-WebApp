import React from 'react';
import TranslationModule from '../components/TranslationModule';

interface TranslatorPageProps {
  speechRate: number;
}

export function TranslatorPage({ speechRate }: TranslatorPageProps) {
  return <TranslationModule speechRate={speechRate} />;
}

export default TranslatorPage;
