import { useCallback } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

export default function Teams() {
  const request = useCallback(() => getJson<unknown>('/api/teams'), []);
  return <CapabilityCard title="Teams" description="Manage teams and members." request={request} collection="teams" emptyMessage="No teams yet." />;
}
