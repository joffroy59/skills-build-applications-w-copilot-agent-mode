import { useCallback } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

export default function Leaderboard() {
  const request = useCallback(() => getJson<unknown>('/api/leaderboard'), []);
  return <CapabilityCard title="Leaderboard" description="Compare team point totals." request={request} collection="leaderboard" emptyMessage="No leaderboard rankings yet." />;
}
