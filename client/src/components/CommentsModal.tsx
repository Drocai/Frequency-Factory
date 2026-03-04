import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Heart, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';
import { Button } from '@/components/ui/button';

const colors = {
  primary: '#FF4500',
  primaryLight: '#FF6B35',
  gray900: '#0A0A0A',
  gray800: '#1A1A1A',
  gray700: '#2A2A2A',
  white: '#FFFFFF',
  textSecondary: '#A0A0A0',
  gradientCard: 'linear-gradient(135deg, #2A2A2A 0%, #1A1A1A 100%)',
};

interface CommentsModalProps {
  track: any;
  onClose: () => void;
  userId: string;
}

export default function CommentsModal({ track, onClose, userId }: CommentsModalProps) {
  const { isAuthenticated, user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);

  const fetchComments = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("track_id", track.id)
      .order("created_at", { ascending: false });
    setComments(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchComments();
  }, [track.id]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    if (!isAuthenticated) {
      toast.error('Please sign in to comment');
      return;
    }

    setIsPosting(true);
    const { error } = await supabase.from("comments").insert({
      track_id: track.id,
      user_id: userId,
      username: user?.name || "Anonymous",
      comment_text: newComment.trim(),
    });

    if (error) {
      toast.error("Failed to post comment: " + error.message);
      setIsPosting(false);
      return;
    }

    setNewComment('');
    setIsPosting(false);
    await fetchComments();
    toast.success('Comment posted! +1 FT earned');
  };

  const formatTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.85)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl overflow-hidden"
        style={{ 
          background: colors.gray900, 
          maxHeight: '80vh',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="sticky top-0 p-4 flex items-center justify-between"
          style={{ background: colors.gray800, borderBottom: `1px solid ${colors.gray700}` }}
        >
          <div>
            <h2 className="text-lg font-bold text-white">Comments</h2>
            <p className="text-gray-400 text-sm">
              {track.trackTitle || track.track_title} by {track.artistName || track.artist_name}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-700 transition"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Comments List */}
        <div className="overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(80vh - 140px)' }}>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" />
            </div>
          ) : comments && comments.length > 0 ? (
            comments.map((comment: any) => (
              <div key={comment.id} className="flex gap-3">
                {/* Avatar */}
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: colors.gray700, color: colors.primaryLight }}
                >
                  {(comment.username || 'A').charAt(0).toUpperCase()}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm">{comment.username || 'Anonymous'}</span>
                    <span className="text-gray-500 text-xs">{formatTime(comment.created_at)}</span>
                  </div>
                  <p className="text-gray-300 text-sm mt-1">{comment.comment_text}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No comments yet</p>
              <p className="text-gray-600 text-sm">Be the first to share your thoughts!</p>
            </div>
          )}
        </div>

        {/* Input */}
        <div 
          className="sticky bottom-0 p-4"
          style={{ background: colors.gray800, borderTop: `1px solid ${colors.gray700}` }}
        >
          {isAuthenticated ? (
            <div className="flex gap-3">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none"
                style={{ background: colors.gray700 }}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
              <button
                onClick={handleSubmit}
                disabled={!newComment.trim() || isPosting}
                className="p-3 rounded-xl transition"
                style={{
                  background: newComment.trim() ? colors.primaryLight : colors.gray700,
                  color: colors.white,
                  opacity: isPosting ? 0.7 : 1,
                }}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <a href={getLoginUrl()}>
              <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                <LogIn className="w-4 h-4 mr-2" />
                Sign In to Comment (+1 FT)
              </Button>
            </a>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
