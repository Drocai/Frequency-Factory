import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Heart } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

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

interface Comment {
  id: number;
  user_id: string;
  user_name: string;
  content: string;
  likes: number;
  created_at: string;
}

interface CommentsModalProps {
  track: any;
  onClose: () => void;
  userId: string;
}

export default function CommentsModal({ track, onClose, userId }: CommentsModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();

    // Real-time subscription
    const subscription = supabase
      .channel(`comments_${track.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'comments',
        filter: `track_id=eq.${track.id}`,
      }, (payload) => {
        setComments(prev => [payload.new as Comment, ...prev]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [track.id]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('track_id', track.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      const userName = localStorage.getItem('selectedAvatar') || 'Anonymous';
      
      const { error } = await supabase
        .from('comments')
        .insert({
          track_id: track.id,
          user_id: userId,
          user_name: userName,
          content: newComment.trim(),
          likes: 0,
        });

      if (error) throw error;

      // Update comment count on track
      await supabase
        .from('submissions')
        .update({ comments_count: (track.comments_count || 0) + 1 })
        .eq('id', track.id);

      setNewComment('');
      toast.success('Comment posted! +0.5 FT earned');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: number) => {
    // Optimistic update
    setComments(prev => prev.map(c => 
      c.id === commentId ? { ...c, likes: c.likes + 1 } : c
    ));

    await supabase
      .from('comments')
      .update({ likes: comments.find(c => c.id === commentId)!.likes + 1 })
      .eq('id', commentId);
  };

  const formatTime = (dateString: string) => {
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
            <p className="text-gray-400 text-sm">{track.track_title} by {track.artist_name}</p>
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
          ) : comments.length > 0 ? (
            comments.map(comment => (
              <div key={comment.id} className="flex gap-3">
                {/* Avatar */}
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: colors.gray700, color: colors.primaryLight }}
                >
                  {comment.user_name.charAt(0).toUpperCase()}
                </div>
                
                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm">{comment.user_name}</span>
                    <span className="text-gray-500 text-xs">{formatTime(comment.created_at)}</span>
                  </div>
                  <p className="text-gray-300 text-sm mt-1">{comment.content}</p>
                  
                  {/* Like button */}
                  <button 
                    onClick={() => handleLikeComment(comment.id)}
                    className="flex items-center gap-1 mt-2 text-gray-500 hover:text-red-500 transition text-xs"
                  >
                    <Heart className="w-4 h-4" />
                    <span>{comment.likes}</span>
                  </button>
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
          className="sticky bottom-0 p-4 flex gap-3"
          style={{ background: colors.gray800, borderTop: `1px solid ${colors.gray700}` }}
        >
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
            disabled={!newComment.trim() || isSubmitting}
            className="p-3 rounded-xl transition"
            style={{ 
              background: newComment.trim() ? colors.primaryLight : colors.gray700,
              color: colors.white,
            }}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
