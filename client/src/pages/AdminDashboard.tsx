import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { supabase, type Track } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  LayoutDashboard, Music, CheckCircle, XCircle, Clock, Trash2,
  Play, Pause, RefreshCw, Bell, BellOff, ArrowLeft, ListOrdered,
  Star, Volume2,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.25;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.stop(ctx.currentTime + 0.4);
  } catch { /* audio not available */ }
}

function sendBrowserNotification(title: string, body: string) {
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/assets/frequency-crown-actual.png' });
  }
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    approved: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${map[status] ?? 'bg-gray-700 text-gray-300'}`}>
      {status}
    </span>
  );
}

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

type Tab = 'pending' | 'approved' | 'rejected' | 'all';

/* ------------------------------------------------------------------ */
/*  AdminDashboard (main)                                              */
/* ------------------------------------------------------------------ */

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<Tab>('pending');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const initialLoad = useRef(true);

  /* ---- Fetch ---- */
  const fetchTracks = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('tracks').select('*').order('created_at', { ascending: false });
    if (tab !== 'all') q = q.eq('status', tab);
    const { data } = await q;
    setTracks(data ?? []);
    setLoading(false);
  }, [tab]);

  const fetchStats = useCallback(async () => {
    const { count: total } = await supabase.from('tracks').select('*', { count: 'exact', head: true });
    const { count: pending } = await supabase.from('tracks').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    const { count: approved } = await supabase.from('tracks').select('*', { count: 'exact', head: true }).eq('status', 'approved');
    const { count: rejected } = await supabase.from('tracks').select('*', { count: 'exact', head: true }).eq('status', 'rejected');
    setStats({ total: total ?? 0, pending: pending ?? 0, approved: approved ?? 0, rejected: rejected ?? 0 });
  }, []);

  useEffect(() => { fetchTracks(); fetchStats(); }, [fetchTracks, fetchStats]);

  /* ---- Realtime ---- */
  useEffect(() => {
    const channel = supabase
      .channel('admin_tracks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tracks' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newTrack = payload.new as Track;
          if (!initialLoad.current) {
            if (soundOn) playNotificationSound();
            sendBrowserNotification('New Track Submitted', `${newTrack.artist} — ${newTrack.title}`);
            toast.info(`New submission: ${newTrack.artist} — ${newTrack.title}`);
          }
        }
        fetchTracks();
        fetchStats();
      })
      .subscribe();

    initialLoad.current = false;
    return () => { supabase.removeChannel(channel); };
  }, [soundOn, fetchTracks, fetchStats]);

  /* ---- Request notification permission ---- */
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  /* ---- Actions ---- */
  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase.from('tracks').update({ status }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Track ${status}`);
    fetchTracks();
    fetchStats();
  };

  const deleteTrack = async (id: string) => {
    if (!confirm('Delete this track permanently?')) return;
    const { error } = await supabase.from('tracks').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Track deleted');
    fetchTracks();
    fetchStats();
  };

  const tabs: { id: Tab; label: string; count: number; icon: React.ElementType }[] = [
    { id: 'pending', label: 'Pending', count: stats.pending, icon: Clock },
    { id: 'approved', label: 'Approved', count: stats.approved, icon: CheckCircle },
    { id: 'rejected', label: 'Rejected', count: stats.rejected, icon: XCircle },
    { id: 'all', label: 'All', count: stats.total, icon: Music },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#000' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b border-[#222]"
        style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => setLocation('/')} className="p-2 hover:bg-[#222] rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              ADMIN DASHBOARD
            </h1>
            <p className="text-gray-500 text-xs">Manage track submissions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setLocation('/admin/queue')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#222] text-gray-300 hover:text-white transition text-sm">
            <ListOrdered className="w-4 h-4" /> Queue
          </button>
          <button onClick={() => setSoundOn(!soundOn)}
            className="p-2 rounded-lg bg-[#222] text-gray-400 hover:text-white transition"
            title={soundOn ? 'Mute alerts' : 'Unmute alerts'}>
            {soundOn ? <Volume2 className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </button>
          <button onClick={() => { fetchTracks(); fetchStats(); }}
            className="p-2 rounded-lg bg-[#222] text-gray-400 hover:text-white transition">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 py-6">
        {[
          { label: 'Total', value: stats.total, color: '#ff6d00' },
          { label: 'Pending', value: stats.pending, color: '#eab308' },
          { label: 'Approved', value: stats.approved, color: '#22c55e' },
          { label: 'Rejected', value: stats.rejected, color: '#ef4444' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4" style={{ background: '#111', border: '1px solid #222' }}>
            <p className="text-3xl font-bold text-white">{s.value}</p>
            <p className="text-sm" style={{ color: s.color }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#222] px-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition ${
              tab === t.id
                ? 'text-[#ff6d00] border-[#ff6d00]'
                : 'text-gray-500 border-transparent hover:text-white'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-[#222]">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Track list */}
      <div className="px-6 py-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#ff6d00] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Music className="w-10 h-10 mx-auto mb-3 text-[#333]" />
            No tracks in this view.
          </div>
        ) : (
          <div className="space-y-2">
            {tracks.map((t) => (
              <TrackRow key={t.id} track={t} onApprove={() => updateStatus(t.id, 'approved')}
                onReject={() => updateStatus(t.id, 'rejected')} onDelete={() => deleteTrack(t.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TrackRow                                                           */
/* ------------------------------------------------------------------ */

function TrackRow({
  track,
  onApprove,
  onReject,
  onDelete,
}: {
  track: Track;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#111', border: '1px solid #222' }}>
      {/* Main row */}
      <div
        className="grid grid-cols-12 gap-3 items-center px-4 py-3 cursor-pointer hover:bg-[#1a1a1a] transition"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Cover */}
        <div className="col-span-1">
          {track.cover_url ? (
            <img src={track.cover_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-[#222] flex items-center justify-center">
              <Music className="w-4 h-4 text-[#555]" />
            </div>
          )}
        </div>
        <div className="col-span-3 min-w-0">
          <p className="text-white text-sm font-medium truncate">{track.title}</p>
          <p className="text-gray-500 text-xs truncate">{track.artist}</p>
        </div>
        <div className="col-span-2 text-gray-400 text-xs">{track.genre || '—'}</div>
        <div className="col-span-1">
          <StatusBadge status={track.status} />
        </div>
        <div className="col-span-2 flex items-center gap-1">
          {track.average_rating ? (
            <>
              <Star className="w-3 h-3 text-[#ff6d00]" fill="#ff6d00" />
              <span className="text-white text-xs">{track.average_rating.toFixed(1)}</span>
              <span className="text-gray-600 text-[10px]">({track.rating_count})</span>
            </>
          ) : (
            <span className="text-gray-600 text-xs">No ratings</span>
          )}
        </div>
        {/* Actions */}
        <div className="col-span-3 flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
          <InlinePlayer url={track.audio_url} />
          {track.status !== 'approved' && (
            <button onClick={onApprove}
              className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition"
              title="Approve">
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          {track.status !== 'rejected' && (
            <button onClick={onReject}
              className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
              title="Reject">
              <XCircle className="w-4 h-4" />
            </button>
          )}
          <button onClick={onDelete}
            className="p-2 rounded-lg bg-[#222] text-gray-500 hover:text-red-400 transition"
            title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t border-[#222]">
              <div>
                <p className="text-gray-500 text-xs">Created</p>
                <p className="text-white">{new Date(track.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Socials</p>
                <p className="text-white">{track.socials || '—'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500 text-xs">Notes</p>
                <p className="text-white">{track.notes || '—'}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
