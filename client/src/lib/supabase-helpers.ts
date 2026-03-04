import { supabase } from './supabase';
import type { Track } from './supabase';

type User = Record<string, any>;
type Prediction = Record<string, any>;
type TokenTransaction = Record<string, any>;
type LeaderboardEntry = { rank: number; name: string; userId: string; predictions: number; tokens: number; accuracy: number };

// ============================================
// USER MANAGEMENT
// ============================================

/**
 * Get or create a user by their anonymous ID
 */
export async function getOrCreateUser(anonId: string): Promise<User | null> {
  // First try to find existing user
  const { data: existingUser, error: findError } = await supabase
    .from('users')
    .select('*')
    .eq('anon_id', anonId)
    .single();

  if (existingUser) {
    return existingUser;
  }

  // Create new user if not found
  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({
      anon_id: anonId,
      avatar_id: 1,
      avatar_name: 'BeatMaster',
      token_balance: 50,
      total_tokens_earned: 50,
      total_predictions: 0,
      login_streak: 0,
    })
    .select()
    .single();

  if (createError) {
    console.error('Error creating user:', createError);
    return null;
  }

  // Record signup bonus transaction
  await recordTransaction(anonId, 50, 'signup_bonus', 'Welcome bonus!');

  return newUser;
}

/**
 * Update user's avatar selection
 */
export async function updateUserAvatar(
  anonId: string,
  avatarId: number,
  avatarName: string
): Promise<boolean> {
  const { error } = await supabase
    .from('users')
    .update({ avatar_id: avatarId, avatar_name: avatarName })
    .eq('anon_id', anonId);

  return !error;
}

/**
 * Get user's token balance
 */
export async function getUserTokenBalance(anonId: string): Promise<number> {
  const { data, error } = await supabase
    .from('users')
    .select('token_balance')
    .eq('anon_id', anonId)
    .single();

  return data?.token_balance ?? 50;
}

// ============================================
// TOKEN OPERATIONS
// ============================================

/**
 * Record a token transaction
 */
async function recordTransaction(
  userId: string,
  amount: number,
  type: string,
  description: string,
  referenceId?: string
): Promise<void> {
  await supabase.from('token_transactions').insert({
    user_id: userId,
    amount,
    type,
    description,
    reference_id: referenceId,
  });
}

/**
 * Award tokens to a user
 */
export async function awardTokens(
  anonId: string,
  amount: number,
  type: string,
  description: string,
  referenceId?: string
): Promise<boolean> {
  // Get current balance
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('token_balance, total_tokens_earned')
    .eq('anon_id', anonId)
    .single();

  if (fetchError || !user) return false;

  // Update balance
  const { error: updateError } = await supabase
    .from('users')
    .update({
      token_balance: user.token_balance + amount,
      total_tokens_earned: user.total_tokens_earned + amount,
    })
    .eq('anon_id', anonId);

  if (updateError) return false;

  // Record transaction
  await recordTransaction(anonId, amount, type, description, referenceId);

  return true;
}

/**
 * Spend tokens (deduct from balance)
 */
export async function spendTokens(
  anonId: string,
  amount: number,
  type: string,
  description?: string
): Promise<boolean> {
  // Get current balance
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('token_balance')
    .eq('anon_id', anonId)
    .single();

  if (fetchError || !user || user.token_balance < amount) return false;

  // Update balance
  const { error: updateError } = await supabase
    .from('users')
    .update({ token_balance: user.token_balance - amount })
    .eq('anon_id', anonId);

  if (updateError) return false;

  // Record transaction (negative amount)
  await recordTransaction(anonId, -amount, type, description || `Spent ${amount} FT`);

  return true;
}

/**
 * Claim daily login bonus
 */
export async function claimDailyBonus(
  anonId: string
): Promise<{ awarded: number; streak: number; alreadyClaimed: boolean }> {
  const today = new Date().toISOString().split('T')[0];

  // Get user
  const { data: user, error } = await supabase
    .from('users')
    .select('last_daily_bonus, login_streak, token_balance, total_tokens_earned')
    .eq('anon_id', anonId)
    .single();

  if (error || !user) {
    return { awarded: 0, streak: 0, alreadyClaimed: false };
  }

  // Check if already claimed today
  if (user.last_daily_bonus === today) {
    return { awarded: 0, streak: user.login_streak, alreadyClaimed: true };
  }

  // Calculate streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newStreak = 1;
  if (user.last_daily_bonus === yesterdayStr) {
    newStreak = user.login_streak + 1;
  }

  // Calculate bonus (base 5 + streak bonus)
  const baseBonus = 5;
  const streakBonus = Math.min(newStreak - 1, 5); // Max +5 from streak
  const totalBonus = baseBonus + streakBonus;

  // Update user
  await supabase
    .from('users')
    .update({
      last_daily_bonus: today,
      login_streak: newStreak,
      token_balance: user.token_balance + totalBonus,
      total_tokens_earned: user.total_tokens_earned + totalBonus,
    })
    .eq('anon_id', anonId);

  // Record transaction
  await recordTransaction(anonId, totalBonus, 'daily_login', `Day ${newStreak} streak bonus!`);

  return { awarded: totalBonus, streak: newStreak, alreadyClaimed: false };
}

/**
 * Get token transaction history
 */
export async function getTokenHistory(
  anonId: string,
  limit: number = 20
): Promise<TokenTransaction[]> {
  const { data, error } = await supabase
    .from('token_transactions')
    .select('*')
    .eq('user_id', anonId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return data || [];
}

// ============================================
// PREDICTIONS
// ============================================

/**
 * Create a prediction (certification)
 */
export async function createPrediction(
  anonId: string,
  trackId: string,
  hookStrength: number,
  originality: number,
  productionQuality: number
): Promise<{ success: boolean; error?: string }> {
  // Check if already predicted
  const alreadyPredicted = await hasUserPredicted(anonId, trackId);
  if (alreadyPredicted) {
    return { success: false, error: 'already_predicted' };
  }

  // Calculate overall score
  const overallScore = Math.round((hookStrength + originality + productionQuality) / 3);

  // Insert prediction
  const { error: insertError } = await supabase.from('predictions').insert({
    user_id: anonId,
    track_id: trackId,
    hook_strength: hookStrength,
    originality: originality,
    production_quality: productionQuality,
    overall_score: overallScore,
  });

  if (insertError) {
    console.error('Error creating prediction:', insertError);
    return { success: false, error: 'insert_failed' };
  }

  // Update user's total predictions
  await supabase.rpc('increment_user_predictions', { user_anon_id: anonId });

  // Award tokens for prediction
  await awardTokens(anonId, 5, 'prediction', 'Track certified!', trackId);

  // Update track's aggregated metrics
  await updateTrackMetrics(trackId);

  return { success: true };
}

/**
 * Update track's aggregated prediction metrics
 */
async function updateTrackMetrics(trackId: string): Promise<void> {
  const { data: predictions } = await supabase
    .from('predictions')
    .select('hook_strength, originality, production_quality')
    .eq('track_id', trackId);

  if (!predictions || predictions.length === 0) return;

  const count = predictions.length;
  const avgHook = Math.round(predictions.reduce((sum, p) => sum + p.hook_strength, 0) / count);
  const avgOrig = Math.round(predictions.reduce((sum, p) => sum + p.originality, 0) / count);
  const avgProd = Math.round(predictions.reduce((sum, p) => sum + p.production_quality, 0) / count);

  await supabase
    .from('tracks')
    .update({
      avg_hook_strength: avgHook,
      avg_originality: avgOrig,
      avg_production_quality: avgProd,
      total_certifications: count,
    })
    .eq('id', trackId);
}

/**
 * Check if user has already predicted a track
 */
export async function hasUserPredicted(anonId: string, trackId: string): Promise<boolean> {
  const { data } = await supabase
    .from('predictions')
    .select('id')
    .eq('user_id', anonId)
    .eq('track_id', trackId)
    .single();

  return !!data;
}

/**
 * Get user's predictions
 */
export async function getUserPredictions(anonId: string): Promise<Prediction[]> {
  const { data, error } = await supabase
    .from('predictions')
    .select(`
      *,
      tracks (
        id,
        title,
        artist
      )
    `)
    .eq('user_id', anonId)
    .order('created_at', { ascending: false });

  return data || [];
}

/**
 * Get all user's predicted track IDs (for UI state)
 */
export async function getUserPredictedTrackIds(anonId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from('predictions')
    .select('track_id')
    .eq('user_id', anonId);

  return new Set((data || []).map((p) => p.track_id));
}

// ============================================
// LIKES
// ============================================

/**
 * Toggle like on a track
 */
export async function toggleLike(
  anonId: string,
  trackId: string
): Promise<{ liked: boolean }> {
  // Check if already liked
  const { data: existing } = await supabase
    .from('likes')
    .select('id')
    .eq('user_id', anonId)
    .eq('track_id', trackId)
    .single();

  if (existing) {
    // Unlike
    await supabase.from('likes').delete().eq('id', existing.id);

    // Decrement track likes count
    await supabase.rpc('decrement_track_likes', { tid: trackId });

    return { liked: false };
  } else {
    // Like
    await supabase.from('likes').insert({
      user_id: anonId,
      track_id: trackId,
    });

    // Increment track likes count
    await supabase.rpc('increment_track_likes', { tid: trackId });

    return { liked: true };
  }
}

/**
 * Get user's liked track IDs
 */
export async function getUserLikes(anonId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from('likes')
    .select('track_id')
    .eq('user_id', anonId);

  return new Set((data || []).map((l) => l.track_id));
}

// ============================================
// TRACKS
// ============================================

/**
 * Get tracks feed
 */
export async function getTracks(
  status: 'pending' | 'approved' | 'rejected' = 'approved',
  limit: number = 20
): Promise<Track[]> {
  const { data, error } = await supabase
    .from('tracks')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(limit);

  return data || [];
}

/**
 * Get queue (pending tracks with position)
 */
export async function getQueue(): Promise<Track[]> {
  const { data } = await supabase
    .from('tracks')
    .select('*')
    .eq('status', 'pending')
    .order('queue_position', { ascending: true });

  return data || [];
}

/**
 * Skip queue by paying tokens
 */
export async function skipQueue(
  anonId: string,
  trackId: string
): Promise<{ success: boolean; error?: string }> {
  const SKIP_COST = 10;

  // Check balance
  const balance = await getUserTokenBalance(anonId);
  if (balance < SKIP_COST) {
    return { success: false, error: 'insufficient_balance' };
  }

  // Spend tokens
  const spent = await spendTokens(anonId, SKIP_COST, 'skip_queue', 'Queue skip purchase');
  if (!spent) {
    return { success: false, error: 'payment_failed' };
  }

  // Update queue position (move up by 1)
  const { data: track } = await supabase
    .from('tracks')
    .select('queue_position')
    .eq('id', trackId)
    .single();

  if (track && track.queue_position && track.queue_position > 1) {
    await supabase
      .from('tracks')
      .update({ queue_position: track.queue_position - 1 })
      .eq('id', trackId);
  }

  return { success: true };
}

// ============================================
// LEADERBOARDS
// ============================================

/**
 * Get top predictors (most certifications)
 */
export async function getTopPredictors(limit: number = 10): Promise<LeaderboardEntry[]> {
  const { data } = await supabase
    .from('users')
    .select('anon_id, avatar_name, total_predictions, token_balance')
    .order('total_predictions', { ascending: false })
    .limit(limit);

  return (data || []).map((u, index) => ({
    rank: index + 1,
    name: u.avatar_name || 'Anonymous',
    userId: u.anon_id,
    predictions: u.total_predictions || 0,
    tokens: u.token_balance || 0,
    accuracy: 0, // Would need prediction outcome tracking
  }));
}

/**
 * Get top token earners
 */
export async function getTopTokenEarners(limit: number = 10): Promise<LeaderboardEntry[]> {
  const { data } = await supabase
    .from('users')
    .select('anon_id, avatar_name, total_tokens_earned, total_predictions')
    .order('total_tokens_earned', { ascending: false })
    .limit(limit);

  return (data || []).map((u, index) => ({
    rank: index + 1,
    name: u.avatar_name || 'Anonymous',
    userId: u.anon_id,
    tokens: u.total_tokens_earned || 0,
    predictions: u.total_predictions || 0,
    accuracy: 0,
  }));
}

/**
 * Get most certified tracks
 */
export async function getMostCertifiedTracks(limit: number = 10): Promise<Track[]> {
  const { data } = await supabase
    .from('tracks')
    .select('*')
    .order('total_certifications', { ascending: false })
    .limit(limit);

  return data || [];
}

/**
 * Get tracks with highest average scores
 */
export async function getTopRatedTracks(limit: number = 10): Promise<Track[]> {
  const { data } = await supabase
    .from('tracks')
    .select('*')
    .gt('total_certifications', 0)
    .order('avg_hook_strength', { ascending: false })
    .limit(limit);

  return data || [];
}

// ============================================
// NOTIFICATIONS
// ============================================

/**
 * Get user's notifications
 */
export async function getNotifications(
  anonId: string,
  limit: number = 20
): Promise<any[]> {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', anonId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return data || [];
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(anonId: string): Promise<number> {
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', anonId)
    .eq('is_read', false);

  return count || 0;
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(anonId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', anonId)
    .eq('is_read', false);
}

/**
 * Create a notification
 */
export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message?: string,
  referenceId?: string
): Promise<void> {
  await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    reference_id: referenceId,
  });
}
