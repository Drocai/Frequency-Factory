import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://waapstehyslrjuqnthyj.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhYXBzdGVoeXNscmp1cW50aHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MjAyMDEsImV4cCI6MjA3NzE5NjIwMX0.9HUyry4JU5Tv8xvKeQI_dHtW6guRODUJeLi8fgp77R8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------- Types matching live Supabase schema ----------

export type Track = {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  cover_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  genre: string | null;
  socials: string | null;
  notes: string | null;
  total_rating: number;
  rating_count: number;
  average_rating: number | null;
  created_at: string;
};

export type Rating = {
  id: string;
  track_id: string;
  user_id: string;
  rating: number;
  created_at: string;
};

export type Settings = {
  id: string;
  current_track_id: string | null;
  created_at: string;
  updated_at: string;
};

// ---------- Helpers ----------

const GENRES = [
  'Hip-Hop', 'R&B', 'Pop', 'Rock', 'Electronic', 'Country',
  'Jazz', 'Latin', 'Afrobeats', 'Drill', 'Trap', 'Lo-Fi',
  'Indie', 'Soul', 'Reggae', 'Alternative', 'Other',
] as const;

export { GENRES };

/** Get or create an anonymous user id stored in localStorage */
export function getAnonUserId(): string {
  const key = 'ff_anon_user_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}
