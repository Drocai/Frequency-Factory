import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { CheckCircle, Music, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { trpc } from '@/lib/trpc';

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'verifying' | 'submitting' | 'done' | 'error'>('verifying');
  const [trackInfo, setTrackInfo] = useState<{ title: string; artist: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const submittedRef = useRef(false);

  // Get session_id from URL
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session_id');

  const verifyQuery = trpc.stripe.verifySession.useQuery(
    { sessionId: sessionId || '' },
    { enabled: !!sessionId, retry: false }
  );

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      setErrorMsg('No payment session found.');
      return;
    }

    if (verifyQuery.isLoading) return;

    if (verifyQuery.error) {
      setStatus('error');
      setErrorMsg(verifyQuery.error.message);
      return;
    }

    if (!verifyQuery.data?.paid) {
      setStatus('error');
      setErrorMsg('Payment not completed. Please try again.');
      return;
    }

    // Prevent double submission
    if (submittedRef.current) return;
    submittedRef.current = true;

    const meta = verifyQuery.data.metadata;
    if (!meta) {
      setStatus('error');
      setErrorMsg('Missing track data from payment session.');
      return;
    }

    setTrackInfo({ title: meta.trackTitle, artist: meta.artistName });
    setStatus('submitting');

    // Insert the track into Supabase with payment_status = 'paid'
    (async () => {
      const { error } = await supabase.from('tracks').insert({
        title: meta.trackTitle,
        artist: meta.artistName,
        audio_url: meta.audioUrl,
        cover_url: meta.coverUrl || null,
        genre: meta.genre || null,
        socials: meta.socials || null,
        notes: meta.notes || null,
        status: 'pending',
      });

      if (error) {
        setStatus('error');
        setErrorMsg(`Failed to submit track: ${error.message}`);
        return;
      }

      // Also insert into submissions table for the pipeline
      await supabase.from('submissions').insert({
        artist_name: meta.artistName,
        track_title: meta.trackTitle,
        file_url: meta.audioUrl,
        payment_status: 'paid',
        submission_status: 'pending',
      });

      setStatus('done');
    })();
  }, [sessionId, verifyQuery.isLoading, verifyQuery.data, verifyQuery.error]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#000' }}>
      <div className="max-w-md w-full mx-4">
        {status === 'verifying' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto" />
            <p className="text-white text-lg">Verifying payment...</p>
          </motion.div>
        )}

        {status === 'submitting' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto" />
            <p className="text-white text-lg">Submitting your track...</p>
            {trackInfo && (
              <p className="text-gray-400">"{trackInfo.title}" by {trackInfo.artist}</p>
            )}
          </motion.div>
        )}

        {status === 'done' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-6"
          >
            <div
              className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                boxShadow: '0 0 40px rgba(34, 197, 94, 0.3)',
              }}
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                PAYMENT CONFIRMED
              </h1>
              <p className="text-gray-400">Your $25 submission fee has been processed.</p>
            </div>

            {trackInfo && (
              <div
                className="rounded-xl p-4"
                style={{ background: '#111', border: '1px solid #222' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ background: '#1a1a1a', border: '1px solid #333' }}
                  >
                    <Music className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-semibold">{trackInfo.title}</p>
                    <p className="text-gray-400 text-sm">{trackInfo.artist}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-green-400 text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/10">
                    Paid
                  </span>
                  <span className="text-orange-400 text-xs font-medium px-2 py-0.5 rounded-full bg-orange-500/10">
                    In Queue
                  </span>
                </div>
              </div>
            )}

            <p className="text-gray-500 text-sm">
              Our A&R team will review your submission. You'll appear in the queue shortly.
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setLocation('/')}
                className="px-6 py-3 rounded-lg bg-[#222] text-white hover:bg-[#333] transition"
              >
                Submit Another
              </button>
              <button
                onClick={() => setLocation('/listen')}
                className="px-6 py-3 rounded-lg text-white font-bold transition flex items-center gap-2"
                style={{ background: '#ff6d00' }}
              >
                Listen Now
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-red-500/10">
              <span className="text-3xl">!</span>
            </div>
            <h2 className="text-xl text-white font-bold">Something went wrong</h2>
            <p className="text-gray-400">{errorMsg}</p>
            <button
              onClick={() => setLocation('/')}
              className="px-6 py-3 rounded-lg text-white font-bold transition"
              style={{ background: '#ff6d00' }}
            >
              Back to Home
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
