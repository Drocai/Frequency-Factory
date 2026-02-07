import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { supabase, GENRES } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Upload, Music, Image, X, Plus, ChevronDown, Loader2, CheckCircle,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TrackDraft {
  key: string;
  title: string;
  artist: string;
  genre: string;
  socials: string;
  notes: string;
  audioFile: File | null;
  coverFile: File | null;
  audioPreview: string | null;
  coverPreview: string | null;
  uploading: boolean;
  progress: number;
  done: boolean;
}

const emptyDraft = (): TrackDraft => ({
  key: crypto.randomUUID(),
  title: '',
  artist: '',
  genre: '',
  socials: '',
  notes: '',
  audioFile: null,
  coverFile: null,
  audioPreview: null,
  coverPreview: null,
  uploading: false,
  progress: 0,
  done: false,
});

/* ------------------------------------------------------------------ */
/*  DropZone                                                           */
/* ------------------------------------------------------------------ */

function DropZone({
  accept,
  label,
  icon: Icon,
  file,
  preview,
  onFile,
  onClear,
}: {
  accept: string;
  label: string;
  icon: React.ElementType;
  file: File | null;
  preview: string | null;
  onFile: (f: File) => void;
  onClear: () => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) onFile(f);
    },
    [onFile],
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !file && inputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all cursor-pointer ${
        dragOver ? 'border-[#ff6d00] bg-[#ff6d00]/10' : 'border-[#333] bg-[#111] hover:border-[#ff6d00]/50'
      }`}
      style={{ minHeight: 140 }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) onFile(e.target.files[0]); }}
      />

      {file ? (
        <div className="flex items-center gap-3 w-full">
          {preview && accept.startsWith('image') ? (
            <img src={preview} alt="" className="w-16 h-16 rounded-lg object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-[#222] flex items-center justify-center">
              <Music className="w-6 h-6 text-[#ff6d00]" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{file.name}</p>
            <p className="text-gray-500 text-xs">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="p-1 rounded-full hover:bg-[#333] text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          <Icon className="w-8 h-8 text-gray-500 mb-2" />
          <p className="text-gray-400 text-sm text-center">{label}</p>
          <p className="text-gray-600 text-xs mt-1">or click to browse</p>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TrackForm                                                          */
/* ------------------------------------------------------------------ */

function TrackForm({
  draft,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  draft: TrackDraft;
  index: number;
  onChange: (d: TrackDraft) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const set = (patch: Partial<TrackDraft>) => onChange({ ...draft, ...patch });

  const handleAudioFile = (f: File) => {
    set({ audioFile: f, audioPreview: URL.createObjectURL(f) });
  };

  const handleCoverFile = (f: File) => {
    set({ coverFile: f, coverPreview: URL.createObjectURL(f) });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="rounded-2xl p-6 space-y-4"
      style={{
        background: 'linear-gradient(135deg, #111 0%, #0a0a0a 100%)',
        border: draft.done ? '1px solid #22c55e' : '1px solid #222',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold flex items-center gap-2">
          {draft.done ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <span className="w-6 h-6 rounded-full bg-[#ff6d00] flex items-center justify-center text-xs text-black font-bold">
              {index + 1}
            </span>
          )}
          Track {index + 1}
        </h3>
        {canRemove && !draft.uploading && (
          <button onClick={onRemove} className="text-gray-500 hover:text-red-400 transition">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Drop zones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DropZone
          accept="audio/*"
          label="Drop audio file here"
          icon={Upload}
          file={draft.audioFile}
          preview={draft.audioPreview}
          onFile={handleAudioFile}
          onClear={() => set({ audioFile: null, audioPreview: null })}
        />
        <DropZone
          accept="image/*"
          label="Drop cover art here"
          icon={Image}
          file={draft.coverFile}
          preview={draft.coverPreview}
          onFile={handleCoverFile}
          onClear={() => set({ coverFile: null, coverPreview: null })}
        />
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Track Title *"
          value={draft.title}
          onChange={(e) => set({ title: e.target.value })}
          className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-[#333] text-white placeholder-gray-500 focus:border-[#ff6d00] focus:outline-none transition"
        />
        <input
          type="text"
          placeholder="Artist Name *"
          value={draft.artist}
          onChange={(e) => set({ artist: e.target.value })}
          className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-[#333] text-white placeholder-gray-500 focus:border-[#ff6d00] focus:outline-none transition"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <select
            value={draft.genre}
            onChange={(e) => set({ genre: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-[#333] text-white appearance-none focus:border-[#ff6d00] focus:outline-none transition"
          >
            <option value="">Select Genre</option>
            {GENRES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>
        <input
          type="text"
          placeholder="Socials (IG, Twitter, etc.)"
          value={draft.socials}
          onChange={(e) => set({ socials: e.target.value })}
          className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-[#333] text-white placeholder-gray-500 focus:border-[#ff6d00] focus:outline-none transition"
        />
      </div>

      <textarea
        placeholder="Notes for the A&R team..."
        value={draft.notes}
        onChange={(e) => set({ notes: e.target.value })}
        rows={2}
        className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-[#333] text-white placeholder-gray-500 focus:border-[#ff6d00] focus:outline-none transition resize-none"
      />

      {/* Progress bar */}
      {draft.uploading && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Uploading...</span>
            <span>{Math.round(draft.progress)}%</span>
          </div>
          <div className="h-2 rounded-full bg-[#222] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #ff6d00, #ff8f33)' }}
              initial={{ width: 0 }}
              animate={{ width: `${draft.progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Landing (main)                                                     */
/* ------------------------------------------------------------------ */

export default function Landing() {
  const [, setLocation] = useLocation();
  const [drafts, setDrafts] = useState<TrackDraft[]>([emptyDraft()]);
  const [submitting, setSubmitting] = useState(false);

  const updateDraft = (idx: number, d: TrackDraft) => {
    setDrafts((prev) => prev.map((p, i) => (i === idx ? d : p)));
  };

  const removeDraft = (idx: number) => {
    setDrafts((prev) => prev.filter((_, i) => i !== idx));
  };

  const addDraft = () => {
    setDrafts((prev) => [...prev, emptyDraft()]);
  };

  /* Upload a single track */
  const uploadTrack = async (draft: TrackDraft, idx: number): Promise<boolean> => {
    if (!draft.audioFile || !draft.title.trim() || !draft.artist.trim()) {
      toast.error(`Track ${idx + 1}: title, artist, and audio file are required`);
      return false;
    }

    updateDraft(idx, { ...draft, uploading: true, progress: 10 });

    try {
      // 1. Upload audio
      const audioPath = `${Date.now()}-${draft.audioFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { error: audioErr } = await supabase.storage
        .from('audio')
        .upload(audioPath, draft.audioFile);
      if (audioErr) throw audioErr;

      updateDraft(idx, { ...draft, uploading: true, progress: 50 });

      const { data: audioUrl } = supabase.storage.from('audio').getPublicUrl(audioPath);

      // 2. Upload cover (optional)
      let coverPublicUrl: string | null = null;
      if (draft.coverFile) {
        const coverPath = `${Date.now()}-${draft.coverFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const { error: coverErr } = await supabase.storage
          .from('covers')
          .upload(coverPath, draft.coverFile);
        if (coverErr) throw coverErr;
        const { data: cu } = supabase.storage.from('covers').getPublicUrl(coverPath);
        coverPublicUrl = cu.publicUrl;
      }

      updateDraft(idx, { ...draft, uploading: true, progress: 80 });

      // 3. Insert track row
      const { error: insertErr } = await supabase.from('tracks').insert({
        title: draft.title.trim(),
        artist: draft.artist.trim(),
        audio_url: audioUrl.publicUrl,
        cover_url: coverPublicUrl,
        genre: draft.genre || null,
        socials: draft.socials.trim() || null,
        notes: draft.notes.trim() || null,
        status: 'pending',
      });
      if (insertErr) throw insertErr;

      updateDraft(idx, { ...draft, uploading: false, progress: 100, done: true });
      return true;
    } catch (err: any) {
      updateDraft(idx, { ...draft, uploading: false, progress: 0 });
      toast.error(`Track ${idx + 1} failed: ${err.message}`);
      return false;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    let successes = 0;

    for (let i = 0; i < drafts.length; i++) {
      if (drafts[i].done) { successes++; continue; }
      const ok = await uploadTrack(drafts[i], i);
      if (ok) successes++;
    }

    setSubmitting(false);
    if (successes === drafts.length) {
      toast.success(`${successes} track${successes > 1 ? 's' : ''} submitted for review!`);
    } else if (successes > 0) {
      toast.info(`${successes}/${drafts.length} tracks submitted. Fix errors and retry.`);
    }
  };

  const allDone = drafts.length > 0 && drafts.every((d) => d.done);

  return (
    <div className="min-h-screen" style={{ background: '#000' }}>
      {/* Nav */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-[#222]"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <img src="/assets/frequency-crown-actual.png" alt="FF" className="w-8 h-8 object-contain" />
          <span className="text-white font-bold tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            FREQUENCY FACTORY
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setLocation('/listen')}
            className="text-gray-400 hover:text-white text-sm transition">Listen</button>
          <button onClick={() => setLocation('/admin')}
            className="text-gray-400 hover:text-white text-sm transition">Admin</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-16 pb-8 text-center"
        style={{ backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(255,109,0,0.08) 0%, transparent 60%)' }}>
        <motion.img
          src="/assets/frequency-crown-actual.png"
          alt="Frequency Factory"
          className="w-48 h-48 mb-6 object-contain"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
        />
        <h1 className="text-5xl md:text-6xl font-bold mb-3 tracking-wider"
          style={{
            background: 'linear-gradient(180deg, #fff 0%, #aaa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: 'Rajdhani, Impact, sans-serif',
            letterSpacing: '0.08em',
          }}>
          FREQUENCY FACTORY
        </h1>
        <p className="text-gray-400 text-lg max-w-lg mb-2">Where raw tracks get built into hits</p>
        <div className="h-1 w-24 mt-2 rounded-full" style={{ background: 'linear-gradient(90deg, #ff6d00, #ff8f33)' }} />
      </section>

      {/* Submission section */}
      <section className="max-w-3xl mx-auto px-4 pb-24">
        <h2 className="text-2xl text-white font-bold mb-6 flex items-center gap-2"
          style={{ fontFamily: 'Rajdhani, sans-serif' }}>
          <Music className="w-6 h-6 text-[#ff6d00]" />
          SUBMIT YOUR TRACK
        </h2>

        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {drafts.map((d, i) => (
              <TrackForm
                key={d.key}
                draft={d}
                index={i}
                onChange={(updated) => updateDraft(i, updated)}
                onRemove={() => removeDraft(i)}
                canRemove={drafts.length > 1}
              />
            ))}
          </AnimatePresence>

          {/* Add another track */}
          {!allDone && (
            <button
              onClick={addDraft}
              className="w-full py-3 rounded-xl border-2 border-dashed border-[#333] text-gray-400 hover:border-[#ff6d00] hover:text-[#ff6d00] transition flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Another Track
            </button>
          )}

          {/* Submit */}
          {allDone ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4"
            >
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <p className="text-white text-lg font-medium">All tracks submitted!</p>
              <p className="text-gray-400 text-sm">Our A&R team will review your submission.</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => { setDrafts([emptyDraft()]); }}
                  className="px-6 py-3 rounded-lg bg-[#222] text-white hover:bg-[#333] transition"
                >
                  Submit More
                </button>
                <button
                  onClick={() => setLocation('/listen')}
                  className="px-6 py-3 rounded-lg text-white font-bold transition"
                  style={{ background: '#ff6d00' }}
                >
                  Browse Approved Tracks
                </button>
              </div>
            </motion.div>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-4 rounded-xl text-white font-bold text-lg tracking-wider transition-all disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #ff6d00, #ff8f33)',
                boxShadow: '0 0 30px rgba(255,109,0,0.4)',
              }}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> Uploading...
                </span>
              ) : (
                `SUBMIT ${drafts.length > 1 ? `${drafts.length} TRACKS` : 'TRACK'}`
              )}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
