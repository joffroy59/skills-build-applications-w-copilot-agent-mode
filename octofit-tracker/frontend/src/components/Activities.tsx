import { useCallback } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

export default function Activities() {
  const request = useCallback(() => getJson<unknown>('/api/activities'), []);
  return <CapabilityCard title="Activities" description="Track student activity minutes and points." request={request} collection="activities" emptyMessage="No activities yet." />;
}
