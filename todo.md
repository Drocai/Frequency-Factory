# Frequency Factory TODO

## Phase 1: Core UI & Authentication (In Progress)
- [x] Install dependencies (WaveSurfer, Supabase, Framer Motion)
- [x] Set up Supabase client configuration
- [x] Create Feed page with professional dark UI
- [x] Implement WaveSurfer audio player component
- [x] Build prediction modal with slider (0.0-10.0)
- [x] Add track cards with artist photos and engagement metrics
- [x] Implement bottom navigation bar
- [x] Copy Frequency Crown logo and factory images to assets
- [x] Apply dark theme with orange accents
- [x] Configure Supabase authentication (Demo mode)
- [x] Add sample tracks to database
- [x] Test authentication flow
- [x] Test track feed loading
- [x] Test prediction submission
- [x] Fix CORS issues with audio URLs
- [x] Add RLS policies for public read access

## Phase 2: Additional Pages
- [ ] Create Discover page (browse all tracks)
- [ ] Create Submit page (track submission form)
- [ ] Create Rewards page (token redemption, leaderboards)
- [ ] Create Profile page (user stats, badges, predictions history)
- [ ] Implement navigation between pages

## Phase 3: Token Economy
- [ ] Display user token balance
- [ ] Implement token rewards for predictions
- [ ] Add token tier system (Red, Blue, Purple, Gold)
- [ ] Create token redemption system
- [ ] Build leaderboards

## Phase 4: Real-time Features
- [ ] Add real-time track updates via Supabase subscriptions
- [ ] Implement live prediction tracking
- [ ] Add engagement metrics (likes, comments)
- [ ] Build notification system

## Phase 5: QUENCY AI Chatbot
- [ ] Integrate ElevenLabs for voice synthesis
- [ ] Build chat interface
- [ ] Add QUENCY personality and responses
- [ ] Implement voice playback

## Phase 6: YouTube Integration
- [ ] Design OBS overlay for live stream
- [ ] Build real-time queue display
- [ ] Add live prediction visualization
- [ ] Implement chat integration

## Phase 7: Admin & Management
- [ ] Create admin dashboard for track approval
- [ ] Build moderation tools
- [ ] Add analytics and reporting
- [ ] Implement user management

## Phase 8: Polish & Testing
- [ ] Mobile responsiveness testing
- [ ] Cross-browser compatibility
- [ ] Performance optimization
- [ ] Bug fixes and refinements
- [ ] User acceptance testing

## Phase 9: Deployment
- [ ] Configure production Supabase settings
- [ ] Set up Vercel deployment
- [ ] Configure custom domain
- [ ] Set up monitoring and analytics
- [ ] Launch!

## Critical Fixes
- [x] Fix mobile viewport - app showing tiny preview instead of full interface
- [x] Remove or hide the preview image on mobile
- [x] Test responsive design on mobile devices
- [x] Verify prediction submission works on mobile
- [x] Verify audio waveforms display correctly

## Landing Page & Onboarding (PRIORITY)
- [x] Create landing page with hero section (Frequency Factory crown logo, cosmic theme)
- [x] Add "Begin Your Journey" button (blue, glowing)
- [x] Add "Learn More" button
- [x] Create scrollable onboarding sections:
  - [x] "Meet QUENCY" section with AI guide intro
  - [x] "Earn Tokens" section explaining the system
  - [x] Token tiers section (Red FT, Blue FT, Purple FT, Gold FT with descriptions)
- [x] Wire up "Begin Your Journey" to navigate to feed
- [x] Update feed to match the actual design (proper track cards with artist images)

## Match User's Actual Design (CRITICAL)
- [x] Copy user's actual logo files (crown with waveforms) to project
- [x] Update color scheme to match mockups (orange #FF4500, blue/purple gradients, metallic gray)
- [x] Change typography to industrial/metallic "FREQUENCY FACTORY" style
- [ ] Rebuild track cards with circular artist photos (not crown logos) - NEEDS REAL ARTIST PHOTOS
- [ ] Update waveforms to gradient style (orange→pink→purple→blue) - WaveSurfer gradient config
- [x] Match exact layout from mobile_app_mockup.png
- [x] Add proper metallic/industrial visual theme
- [x] Remove any generated assets that don't match user's design

## Vibe-atar System (NEW FEATURE)
- [x] Generate diverse vibe-atar portraits (chill, energetic, cosmic, edgy, mysterious)
- [x] Update track cards to use circular vibe-atar portraits instead of crown logos
- [ ] Implement gradient waveforms (orange→pink→purple→blue) matching mockup - WaveSurfer limitation
- [x] Add certified gear badge (778FD033...png) for completed predictions
- [x] Test complete prediction flow with new visuals

## Complete App Features (PRIORITY)
- [x] Build Discover page (browse tracks, filter by genre, search)
- [x] Build Submit page (track upload form, audio file handling, S3 storage)
- [x] Build Profile page (user stats, prediction history, token balance, achievements)
- [x] Build Rewards page (leaderboard, token redemption, achievement badges)
- [x] Add notification center (bell icon in header, activity feed dropdown)
- [x] Implement QUENCY AI chat (floating button, using built-in LLM responses)
- [ ] Replace demo mode with real Google OAuth (Supabase Auth) - OPTIONAL
- [x] Test complete user journey from landing to all pages
