import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Props = {
  title: string;
  description: string;
  endpoint: string;
  collection: string;
  emptyMessage: string;
};

type Entry = Record<string, unknown>;

function isEntry(value: unknown): value is Entry {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function CapabilityCard({ title, description, endpoint, collection, emptyMessage }: Props) {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<Record<string, unknown>>(endpoint)
      .then((response) => {
        const values = response[collection];
        if (!Array.isArray(values) || !values.every(isEntry)) throw new Error(`Invalid ${collection} response`);
        if (active) setEntries(values);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load data');
      });
    return () => { active = false; };
  }, [collection, endpoint]);

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">{title}</h2>
    <p>{description}</p>
    {error ? <p role="alert">Unable to load {title.toLowerCase()}: {error}</p>
      : entries === null ? <p role="status">Loading {title.toLowerCase()}...</p>
        : entries.length === 0 ? <p>{emptyMessage}</p>
          : <div aria-live="polite">
            <p role="status">{title} loaded.</p>
            <ul>{entries.map((entry, index) => <li key={String(entry._id ?? entry.title ?? entry.teamName ?? entry.name ?? index)}>
              {Object.entries(entry).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : String(value)}`).join(' · ')}
            </li>)}</ul>
          </div>}
  </div></section>;
}
