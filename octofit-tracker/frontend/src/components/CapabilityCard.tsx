import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Props = {
  title: string;
  description: string;
  request: () => Promise<unknown>;
  collection: string;
  emptyMessage: string;
};

type Entry = Record<string, unknown>;

function isEntry(value: unknown): value is Entry {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : fallback;
}

function renderEntry(collection: string, entry: Entry, index: number) {
  if (collection === 'activities') {
    const date = text(entry.occurredAt);
    const parsedDate = date ? new Date(date) : null;
    return <article className="border rounded p-3 mb-2" key={text(entry._id, String(index))}>
      <h3 className="h5 text-capitalize">{text(entry.type, 'Activity')}</h3>
      <p className="mb-1">{text(entry.minutes, '—')} minutes · {text(entry.points, '—')} points</p>
      {parsedDate && !Number.isNaN(parsedDate.getTime()) && <p className="text-muted mb-0">{parsedDate.toLocaleDateString()}</p>}
    </article>;
  }

  if (collection === 'teams') {
    const members = Array.isArray(entry.members) ? entry.members.length : 0;
    return <article className="border rounded p-3 mb-2" key={text(entry._id, String(index))}>
      <h3 className="h5">{text(entry.name, 'Team')}</h3>
      <p className="mb-1">Mascot: {text(entry.mascot, '—')}</p>
      <p className="mb-0">{members} {members === 1 ? 'member' : 'members'}</p>
    </article>;
  }

  if (collection === 'leaderboard') {
    return <article className="border rounded p-3 mb-2" key={text(entry.teamName, String(index))}>
      <h3 className="h5">#{text(entry.rank, String(index + 1))} {text(entry.teamName, 'Team')}</h3>
      <p className="mb-0">{text(entry.totalPoints, '0')} points</p>
    </article>;
  }

  return <article className="border rounded p-3 mb-2" key={text(entry._id ?? entry.title, String(index))}>
    <h3 className="h5">{text(entry.title, 'Workout')}</h3>
    <p className="mb-1">{text(entry.focus, 'General')} · {text(entry.minutes, '—')} minutes · {text(entry.difficulty, '—')}</p>
    {text(entry.reason) && <p className="mb-0">{text(entry.reason)}</p>}
  </article>;
}

export function CapabilityCard({ title, description, request, collection, emptyMessage }: Props) {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    request()
      .then((response) => {
        if (!isEntry(response)) throw new Error(`Invalid ${collection} response`);
        return response;
      })
      .then((response) => {
        const values = response[collection];
        if (!Array.isArray(values) || !values.every(isEntry)) throw new Error(`Invalid ${collection} response`);
        if (active) setEntries(values);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load data');
      });
    return () => { active = false; };
  }, [collection, request]);

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">{title}</h2>
    <p>{description}</p>
    {error ? <p role="alert">Unable to load {title.toLowerCase()}: {error}</p>
      : entries === null ? <p role="status">Loading {title.toLowerCase()}...</p>
        : entries.length === 0 ? <p>{emptyMessage}</p>
          : <div aria-live="polite">
            <p role="status">{title} loaded.</p>
            {entries.map((entry, index) => renderEntry(collection, entry, index))}
          </div>}
  </div></section>;
}
