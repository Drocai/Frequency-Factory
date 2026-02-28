import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Music, CheckCircle, XCircle, Clock, Play, Pause,
  RefreshCw, ArrowLeft, Lock,
} from 'lucide-react';
import { useLocation } from 'wouter';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Submission = {
  id: string;
  artist_name: string;
  track_title: string;
  file_url: string;
  email: string | null;
  payment_status: string;
  submission_status: string;
  submitted_at: string;
};

/* ------------------------------------------------------------------ */
/*  Password gate                                                      */
/* ------------------------------------------------------------------ */

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || '';

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ADMIN_PASSWORD) {
      setError(true);
      return;
    }
    if (input === ADMIN_PASSWORD) {
      sessionStorage.setItem('stream_admin_unlocked', '1');
      onUnlock();
    } else {
      setError(true);
      setInput('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#000' }}>
      <form onSubmit={submit} className="w-full max-w-sm p-8 rounded-2xl" style={{ background: '#111', border: '1px solid #222' }}>
        <div className="flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-[#ff6d00]" />
        </div>
        <h2 className="text-white text-xl font-bold text-center mb-2">Stream Admin</h2>
        <p className="text-gray-500 text-sm text-center mb-6">Enter password to continue</p>
        <input
          type="password"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(false); }}
          placeholder="Password"
          className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
          style={{ background: '#222', border: error ? '1px solid #ef4444' : '1px solid #333' }}
          autoFocus
        />
        {error && (
          <p className="text-red-400 text-xs mt-2">
            {ADMIN_PASSWORD ? 'Wrong password.' : 'VITE_ADMIN_PASSWORD not set.'}
          </p>
        )}
        <button type="submit"
          className="w-full mt-4 py-3 rounded-lg text-black font-semibold text-sm transition hover:opacity-90"
          style={{ background: '#ff6d00' }}>
          Unlock
        </button>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Inline audio player                                                */
/* ------------------------------------------------------------------ */

function InlinePlayer({ url }: { url: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    if (!ref.current) return;
    playing ? ref.current.pause() : ref.current.play();
    setPlaying(!playing);
  };

  return (
    <>
      <audio ref={ref} src={url} onEnded={() => setPlaying(false)} />
      <button onClick={toggle}
        className="p-2 rounded-lg transition"
        style={{ background: playing ? '#ff6d00' : '#222' }}>
        {playing ? <Pause className="w-4 h-4 text-black" /> : <Play className="w-4 h-4 text-white" />}
      </button>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  StreamAdmin (main)                                                 */
/* ------------------------------------------------------------------ */

export default function StreamAdmin() {
  const [, setLocation] = useLocation();
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('stream_admin_unlocked') === '1');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInFlight, setActionInFlight] = useState<string | null>(null);

  /* ---- Fetch pending submissions ---- */
  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('submission_status', 'pending')
      .order('submitted_at', { ascending: true });

    if (error) {
      toast.error('Failed to load submissions: ' + error.message);
      setSubmissions([]);
    } else {
      setSubmissions(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authed) fetchSubmissions();
  }, [authed, fetchSubmissions]);

  /* ---- Realtime subscription ---- */
  useEffect(() => {
    if (!authed) return;

    const channel = supabase
      .channel('stream_submissions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, () => {
        fetchSubmissions();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [authed, fetchSubmissions]);

  /* ---- Approve: copy to approved_tracks, update submission_status ---- */
  const approve = async (sub: Submission) => {
    setActionInFlight(sub.id);
    try {
      // 1. Insert into approved_tracks
      const { error: insertErr } = await supabase.from('approved_tracks').insert({
        artist_name: sub.artist_name,
        track_title: sub.track_title,
        file_url: sub.file_url,
        approved: true,
        added_to_stream: false,
        approved_at: new Date().toISOString(),
      });

      if (insertErr) {
        toast.error('Failed to add to approved_tracks: ' + insertErr.message);
        return;
      }

      // 2. Update submission status
      const { error: updateErr } = await supabase
        .from('submissions')
        .update({ submission_status: 'approved' })
        .eq('id', sub.id);

      if (updateErr) {
        toast.error('Failed to update submission: ' + updateErr.message);
        return;
      }

      toast.success(`Approved: ${sub.artist_name} — ${sub.track_title}`);
      fetchSubmissions();
    } finally {
      setActionInFlight(null);
    }
  };

  /* ---- Reject ---- */
  const reject = async (sub: Submission) => {
    setActionInFlight(sub.id);
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ submission_status: 'rejected' })
        .eq('id', sub.id);

      if (error) {
        toast.error('Failed to reject: ' + error.message);
        return;
      }

      toast.success(`Rejected: ${sub.artist_name} — ${sub.track_title}`);
      fetchSubmissions();
    } finally {
      setActionInFlight(null);
    }
  };

  /* ---- Password gate ---- */
  if (!authed) {
    return <PasswordGate onUnlock={() => setAuthed(true)} />;
  }

  /* ---- Main UI ---- */
  return (
    <div className="min-h-screen" style={{ background: '#000' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b border-[#222]"
        style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => setLocation('/admin')} className="p-2 hover:bg-[#222] rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              STREAM ADMIN
            </h1>
            <p className="text-gray-500 text-xs">Review submissions for 24/7 YouTube stream</p>
          </div>
        </div>
        <button onClick={fetchSubmissions}
          className="p-2 rounded-lg bg-[#222] text-gray-400 hover:text-white transition">
          <RefreshCw className="w-4 h-4" />
        </button>
      </header>

      {/* Pending count */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-yellow-400" />
          <span className="text-white text-sm font-medium">{submissions.length} pending submission(s)</span>
        </div>
      </div>

      {/* Submission list */}
      <div className="px-6 pb-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#ff6d00] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Music className="w-10 h-10 mx-auto mb-3 text-[#333]" />
            No pending submissions.
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((sub) => {
              const busy = actionInFlight === sub.id;
              return (
                <div key={sub.id} className="rounded-xl p-4"
                  style={{ background: '#111', border: '1px solid #222', opacity: busy ? 0.5 : 1 }}>
                  <div className="flex items-center justify-between gap-4">
                    {/* Track info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{sub.track_title}</p>
                      <p className="text-gray-400 text-sm truncate">{sub.artist_name}</p>
                      {sub.email && <p className="text-gray-600 text-xs mt-1">{sub.email}</p>}
                      <p className="text-gray-600 text-xs mt-1">
                        Submitted {new Date(sub.submitted_at).toLocaleString()}
                        {' '}&middot; Payment: {sub.payment_status}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <InlinePlayer url={sub.file_url} />
                      <button onClick={() => approve(sub)} disabled={busy}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition text-sm font-medium disabled:opacity-30">
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                      <button onClick={() => reject(sub)} disabled={busy}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition text-sm font-medium disabled:opacity-30">
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
