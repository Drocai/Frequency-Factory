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
