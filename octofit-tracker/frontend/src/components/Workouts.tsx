import { useCallback } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

export default function Workouts() {
  const userEmail = 'mona@example.com';
  const request = useCallback(
    () => getJson<unknown>(`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`),
    [userEmail],
  );
  return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." request={request} collection="suggestions" emptyMessage="No workout suggestions yet." />;
}
