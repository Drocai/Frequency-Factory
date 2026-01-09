# Frequency Factory TODO

## 📅 Current Session (Jan 8, 2026)

### 🎯 Priority: Build Complete MVP from Reference Mockups

Based on user's reference images, implementing full mobile-friendly experience:

---

## ✅ Previously Completed
- [x] Database migrations (comments table + onboarding column)
- [x] Landing page with crown logo
- [x] Basic Feed page with track cards
- [x] PredictionModal with Factory Metrics
- [x] OnboardingModal with 3-step tutorial
- [x] CommentsModal with real-time submission
- [x] Discover page with sorting
- [x] Submit page (basic)
- [x] Profile page
- [x] Rewards page with leaderboard
- [x] QUENCY AI chat (basic)
- [x] YouTube/OBS overlay (basic)

---

## 🔥 NEW FEATURES FROM MOCKUPS

### 1. Avatar Selection System (Gear-Frame Vibe-atars)
- [x] Create avatar selection screen matching mockup
- [x] 6 avatars with gear frames (silver/gold based on tier)
- [x] Avatar names: BeatMaster, SynthQueen, DJ_Pulse, AudioPhreak, Freq_Factory
- [x] Crown logo inside each gear with different colors (blue, red, orange, purple, green, yellow-green)
- [x] "CHOOSE YOUR AVATAR" button at bottom
- [x] Save selected avatar to localStorage
- [ ] Show avatar on all user interactions (comments, predictions) - partially done

### 2. Enhanced Mobile Feed UI
- [x] Match mockup exactly: crown logo header, 50 FT badge top-right
- [x] "Personalized feed" section header
- [x] Track cards with circular artist photo (red ring border)
- [x] Artist name + track title layout
- [x] Orange-to-purple gradient waveform visualization (WaveSurfer integration)
- [x] Heart icon with like count (e.g., "1.2K")
- [x] Comment icon with count (e.g., "204")
- [x] Bottom nav: Home, Discover, Submit (center circle), Rewards, Profile
- [x] CERTIFY button with gradient and glow

### 3. Track Submission Form (From IMG_4168)
- [x] "Submit your track" header with description
- [x] Artist / Act Name field (e.g., "D RoC")
- [x] Track Title field (e.g., "Frequency Don't Fold")
- [x] Email field (to track your spot)
- [x] Best 45s Timestamp field (e.g., "0:45")
- [x] Streaming Link field (YouTube / Spotify / SoundCloud)
- [x] Genre Lane dropdown (Hip-Hop / Rap, etc.)
- [x] AI-assisted? dropdown (Yes/No)
- [x] Notes to Reviewers textarea (optional)
- [x] "Get Ticket & Join Conveyor" button (teal)
- [x] "Jump to Live Monitor" button (outline)
- [x] Award +1 FT on successful submission
- [x] Completeness progress bar (70% required)
- [x] Success screen with ticket number

### 4. Factory Monitor / Queue System (From IMG_8029)
- [x] "Factory Monitor" header with "Queue X" badge
- [x] Stats row: Now Playing, Avg Wait (mm:ss), Skips Purchased Today, Weekend Bracket Spots Left
- [x] Conveyor Order explanation: "queued → up next → processing → done"
- [x] "Highlight my entry" button
- [x] Queue table with columns: #, Artist, Track, ETA, Lane, Action
- [x] "Pay for Skip" button (costs 10 FT)
- [x] Real-time queue updates from Supabase
- [x] Footer: "ETAs are estimates. Skips move you forward but do not replace or kick others—just reorders fairly."

### 5. Receipts Wall (From IMG_4170)
- [x] "Receipts Wall" header
- [x] Featured winner card with crown decoration
- [x] Stats cards: Biggest 48h Lift, Most Saves, Fastest to 1k, Best CTR
- [x] Trophy badges (gold, silver, bronze)
- [x] All-Time Hall of Fame section
- [x] Leaderboard cards with rankings
- [ ] Import/Export CSV functionality (not in mockup priority)
- [ ] Week of date picker (not in mockup priority)

### 6. Artist Dashboard (From web_platform_mockup)
- [x] Sidebar navigation: Dashboard, Tracks, Analytics, Rewards, Community, Settings
- [x] Header with token balance badge
- [x] Track Performance section with charts
- [x] Stats cards: Total Plays, Likes, Comments, Tracks Submitted
- [x] Weekly Performance bar chart
- [x] Listener Demographics breakdown
- [x] Token Earnings section
- [x] Your Tracks list with engagement metrics
- [x] Submit New Track button

### 7. Factory Metrics Display (From IMG_8058)
- [x] Full-page metrics modal in PredictionModal
- [x] Hook Strength % with slider
- [x] Originality % with slider
- [x] Production Quality % with slider
- [x] Overall score calculation
- [x] "CERTIFY THIS TRACK" button
- [x] Token reward note (+5 FT)

### 8. Token System (WORKING)
- [x] Display balance in header (50 FT badge style)
- [x] Award tokens for actions:
  - [x] Submit track = +1 FT
  - [x] Accurate prediction = +5 FT
  - [x] Comment on track = +0.5 FT
  - [ ] Daily login = +1 FT (not implemented yet)
- [x] Pay-to-skip queue = -10 FT
- [ ] Token transaction history (not priority)

### 9. QUENCY AI Chat
- [x] Enhanced UI with gradient header
- [x] Intelligent fallback responses
- [x] Quick action buttons
- [x] Auto-scroll to latest message
- [x] Better error handling
- [x] Typing indicator animation

### 10. Live Overlay (From IMG_4165)
- [x] Now Playing card with track info
- [x] Queue card showing up next tracks
- [x] Live Predictions card with real-time updates
- [x] Top Predictors leaderboard
- [x] Transparent background for OBS
- [x] Frequency Factory watermark

---

## 🔧 Technical Tasks

### Database Updates
- [ ] Add avatar_id column to users table (using localStorage for MVP)
- [ ] Add queue_position column to submissions (calculated dynamically)
- [ ] Add skip_count column to submissions (tracked in state)
- [ ] Add tokens_spent column to users (tracked in state)

### Components Created
- [x] AvatarSelection.tsx
- [x] FactoryMonitor.tsx
- [x] LiveOverlay.tsx
- [x] ArtistDashboard.tsx
- [x] ReceiptsWall.tsx
- [x] PredictionModal.tsx (updated with Factory Metrics)
- [x] CommentsModal.tsx
- [x] BottomNav.tsx
- [x] QuencyChat.tsx (enhanced)
- [x] Feed.tsx (completely rewritten)
- [x] Submit.tsx (completely rewritten)

### Mobile Responsiveness
- [x] All pages use mobile-first design
- [x] Bottom nav with proper z-index
- [x] Touch targets are 44px+ minimum
- [x] Responsive grid layouts
- [x] Proper overflow handling

---

## 📊 Launch Checklist
- [x] All core features from mockups implemented
- [x] Mobile responsive design
- [x] QUENCY chat working with fallbacks
- [x] Token system awarding correctly
- [x] Queue system functional
- [x] Factory Metrics rating system
- [x] Comments and likes working
- [ ] 10-20 real tracks submitted (user needs to add)
- [ ] Save checkpoint
- [ ] Publish

---

## 🎨 Design System Implemented
- Primary: #FF4500 (Orange)
- Primary Light: #FF6B35
- Teal: #14B8A6
- Blue: #1E90FF
- Purple: #8B00FF
- Gold: #FFD700
- Gray900: #0A0A0A (background)
- Gray800: #1A1A1A (cards)
- Gray700: #2A2A2A (borders)

---

**Last Updated:** January 8, 2026
**Status:** MVP Complete - Ready for Checkpoint


---

## 🎵 NEW: Spotify & YouTube API Integration (Jan 8, 2026)

### Audio Playback Integration
- [x] Set up YouTube embedded player (iframe API)
- [x] Set up Spotify embedded player (iframe API)
- [x] Create unified StreamingPlayer component
- [x] Add platform detection from streaming links
- [x] Extract video/track IDs from URLs
- [x] Update Feed to use real audio playback
- [x] Add playback controls (play, pause, mute for YouTube)
- [x] Handle playback errors gracefully
- [x] Add loading states for audio
- [x] Test with unit tests (15 tests passing)
- [x] Platform badges showing YouTube/Spotify/SoundCloud
- [x] External link button to open in platform
- [ ] Update FactoryMonitor to use real audio (optional)
- [ ] Update LiveOverlay to show currently playing track (optional)
