import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://waapstehyslrjuqnthyj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhYXBzdGVoeXNscmp1cW50aHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MjAyMDEsImV4cCI6MjA3NzE5NjIwMX0.9HUyry4JU5Tv8xvKeQI_dHtW6guRODUJeLi8fgp77R8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export type Track = {
  id: number;
  title: string;
  artist: string;
  audio_url: string;
  artist_image?: string;
  tier: 'red' | 'blue' | 'purple' | 'gold';
  status: 'pending' | 'approved' | 'rejected';
  likes?: number;
  comments?: number;
  created_at: string;
};

export type Prediction = {
  id: number;
  user_id: string;
  submission_id: number;
  prediction: number;
  confidence: number;
  created_at: string;
};

export type User = {
  id: string;
  username: string;
  email: string;
  token_balance: number;
  level: number;
  created_at: string;
};
