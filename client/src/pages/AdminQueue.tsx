import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase, type Track, GENRES, getAnonUserId } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  GripVertical, Play, Pause, CheckCircle, XCircle, Star,
  ArrowLeft, Filter, Music, Loader2,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  SortableTrackItem                                                  */
/* ------------------------------------------------------------------ */

function SortableTrackItem({
  track,
  index,
  selected,
  onSelect,
  onApprove,
  onReject,
  onRate,
}: {
  track: Track;
  index: number;
  selected: boolean;
  onSelect: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRate: (trackId: string, rating: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: track.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 0,
  };

  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [hoverStar, setHoverStar] = useState(0);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    playing ? audioRef.current.pause() : audioRef.current.play();
    setPlaying(!playing);
  };

  const priority = index < 3 ? 'high' : index < 8 ? 'medium' : 'low';
  const priorityColor = priority === 'high' ? '#ff6d00' : priority === 'medium' ? '#eab308' : '#555';

  return (
    <div ref={setNodeRef} style={style} className="mb-2">
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
        style={{
          background: selected ? 'rgba(255,109,0,0.08)' : '#111',
          border: `1px solid ${selected ? '#ff6d00' : '#222'}`,
        }}
      >
        {/* Drag handle */}
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none">
          <GripVertical className="w-5 h-5 text-gray-600" />
        </div>

        {/* Priority indicator */}
        <div className="w-1.5 h-10 rounded-full shrink-0" style={{ background: priorityColor }} />

        {/* Checkbox */}
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(track.id)}
          className="w-4 h-4 accent-[#ff6d00]"
          onClick={(e) => e.stopPropagation()}
        />

        {/* Cover */}
        <div className="w-10 h-10 rounded-lg shrink-0 bg-[#222] overflow-hidden flex items-center justify-center">
          {track.cover_url ? (
            <img src={track.cover_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <Music className="w-4 h-4 text-[#555]" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{track.title}</p>
          <p className="text-gray-500 text-xs truncate">{track.artist}{track.genre ? ` · ${track.genre}` : ''}</p>
        </div>

        {/* 5-star rating inline */}
        <div className="flex items-center gap-0.5 shrink-0">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onMouseEnter={() => setHoverStar(s)}
              onMouseLeave={() => setHoverStar(0)}
              onClick={(e) => { e.stopPropagation(); onRate(track.id, s); }}
              className="transition"
            >
              <Star
                className="w-3.5 h-3.5"
                fill={(hoverStar || Math.round(track.average_rating ?? 0)) >= s ? '#ff6d00' : 'transparent'}
                stroke={(hoverStar || Math.round(track.average_rating ?? 0)) >= s ? '#ff6d00' : '#444'}
              />
            </button>
          ))}
          <span className="text-gray-600 text-[10px] ml-1">
            {track.average_rating ? track.average_rating.toFixed(1) : '—'}
          </span>
        </div>

        {/* Quick listen */}
        <audio ref={audioRef} src={track.audio_url} onEnded={() => setPlaying(false)} />
        <button onClick={togglePlay}
          className="p-2 rounded-lg shrink-0 transition"
          style={{ background: playing ? '#ff6d00' : '#222' }}>
          {playing ? <Pause className="w-4 h-4 text-black" /> : <Play className="w-4 h-4 text-white" />}
        </button>

        {/* Approve / Reject */}
        <button onClick={(e) => { e.stopPropagation(); onApprove(track.id); }}
          className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition shrink-0">
          <CheckCircle className="w-4 h-4" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onReject(track.id); }}
          className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition shrink-0">
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AdminQueue (main)                                                  */
/* ------------------------------------------------------------------ */

export default function AdminQueue() {
  const [, setLocation] = useLocation();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [genreFilter, setGenreFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [batchProcessing, setBatchProcessing] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const fetchTracks = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('tracks').select('*').eq('status', 'pending').order('created_at', { ascending: true });
    if (genreFilter) q = q.eq('genre', genreFilter);
    const { data } = await q;
    setTracks(data ?? []);
    setLoading(false);
  }, [genreFilter]);

  useEffect(() => { fetchTracks(); }, [fetchTracks]);

  /* Drag end */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setTracks((prev) => {
      const oldIdx = prev.findIndex((t) => t.id === active.id);
      const newIdx = prev.findIndex((t) => t.id === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
  };

  /* Selection */
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === tracks.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(tracks.map((t) => t.id)));
    }
  };

  /* Batch actions */
  const batchAction = async (status: 'approved' | 'rejected') => {
    if (selected.size === 0) return;
    setBatchProcessing(true);
    const ids = Array.from(selected);
    const { error } = await supabase.from('tracks').update({ status }).in('id', ids);
    setBatchProcessing(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${ids.length} track${ids.length > 1 ? 's' : ''} ${status}`);
    setSelected(new Set());
    fetchTracks();
  };

  /* Single actions */
  const approveTrack = async (id: string) => {
    await supabase.from('tracks').update({ status: 'approved' }).eq('id', id);
    toast.success('Track approved');
    fetchTracks();
  };

  const rejectTrack = async (id: string) => {
    await supabase.from('tracks').update({ status: 'rejected' }).eq('id', id);
    toast.success('Track rejected');
    fetchTracks();
  };

  const rateTrack = async (trackId: string, rating: number) => {
    const userId = getAnonUserId();
    const { error } = await supabase.from('ratings').upsert(
      { track_id: trackId, user_id: userId, rating },
      { onConflict: 'track_id,user_id' },
    );
    if (error) { toast.error(error.message); return; }
    toast.success(`Rated ${rating}/5`);
    fetchTracks();
  };

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
              CONTROL HUB
            </h1>
            <p className="text-gray-500 text-xs">Drag to reorder · Review queue</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition ${showFilters ? 'bg-[#ff6d00] text-black' : 'bg-[#222] text-gray-400'}`}>
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Filters */}
      {showFilters && (
        <div className="px-6 py-3 border-b border-[#222] bg-[#0a0a0a] flex flex-wrap gap-2">
          <button onClick={() => setGenreFilter('')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              !genreFilter ? 'bg-[#ff6d00] text-black' : 'bg-[#222] text-gray-400'
            }`}>All Genres</button>
          {GENRES.map((g) => (
            <button key={g} onClick={() => setGenreFilter(g)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                genreFilter === g ? 'bg-[#ff6d00] text-black' : 'bg-[#222] text-gray-400'
              }`}>{g}</button>
          ))}
        </div>
      )}

      {/* Batch actions bar */}
      {selected.size > 0 && (
        <div className="sticky top-[65px] z-40 px-6 py-3 flex items-center gap-3 border-b border-[#222]"
          style={{ background: 'rgba(0,0,0,0.95)' }}>
          <input type="checkbox" checked={selected.size === tracks.length && tracks.length > 0}
            onChange={selectAll} className="w-4 h-4 accent-[#ff6d00]" />
          <span className="text-gray-400 text-sm">{selected.size} selected</span>
          <div className="flex gap-2 ml-auto">
            <button onClick={() => batchAction('approved')} disabled={batchProcessing}
              className="px-4 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition disabled:opacity-50">
              {batchProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Approve ({selected.size})</>}
            </button>
            <button onClick={() => batchAction('rejected')} disabled={batchProcessing}
              className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition disabled:opacity-50">
              Reject ({selected.size})
            </button>
          </div>
        </div>
      )}

      {/* Queue */}
      <div className="px-6 py-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#ff6d00] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Music className="w-10 h-10 mx-auto mb-3 text-[#333]" />
            Queue is empty{genreFilter ? ` for ${genreFilter}` : ''}.
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={tracks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              {tracks.map((t, i) => (
                <SortableTrackItem
                  key={t.id}
                  track={t}
                  index={i}
                  selected={selected.has(t.id)}
                  onSelect={toggleSelect}
                  onApprove={approveTrack}
                  onReject={rejectTrack}
                  onRate={rateTrack}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
