import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { CosmicBackground } from "@/components/CosmicBackground";
import { QuencyPulse, QuencyAvatar } from "@/components/QuencyPulse";
import { useState } from "react";

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [quencyState, setQuencyState] = useState<'idle' | 'speaking' | 'listening'>('idle');

  return (
    <div className="min-h-screen relative">
      {/* Cosmic background */}
      <CosmicBackground />

      {/* Main content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="container min-h-screen flex flex-col items-center justify-center text-center px-4">
          {/* Logo */}
          <div className="mb-8 animate-float">
            <img
              src="/assets/logo-frequency-crown.png"
              alt="Frequency Factory"
              className="w-64 h-64 md:w-96 md:h-96 animate-glow-pulse"
            />
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="waveform-gradient bg-clip-text text-transparent">
              FREQUENCY FACTORY
            </span>
          </h1>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-foreground/80 mb-4 max-w-2xl">
            Where raw tracks get built into hits
          </p>

          <p className="text-lg text-foreground/60 mb-12 max-w-xl">
            Cross the cosmic bridge. Predict the next hit. Earn Frequency Tokens. 
            Become a legend in the music universe.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            {isAuthenticated ? (
              <>
                <Button 
                  size="lg" 
                  className="cosmic-glow-orange text-lg px-8"
                  onClick={() => window.location.href = '/feed'}
                >
                  Enter The Factory
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8"
                  onClick={logout}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button 
                  size="lg" 
                  className="cosmic-glow-orange text-lg px-8"
                  onClick={() => window.location.href = getLoginUrl()}
                >
                  Begin Your Journey
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8"
                  onClick={() => window.location.href = '#how-it-works'}
                >
                  Learn More
                </Button>
              </>
            )}
          </div>

          {/* QUENCY Introduction */}
          <div className="cosmic-bg-deep/50 backdrop-blur-sm rounded-lg p-8 max-w-2xl border border-border">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <QuencyAvatar size={120} />
              </div>
              <div className="text-left">
                <h3 className="text-2xl font-bold mb-2 ft-purple-glow">
                  Meet QUENCY
                </h3>
                <p className="text-foreground/80 mb-4">
                  Your AI Superfan guide in the Frequency Factory. QUENCY hosts live streams, 
                  awards tokens, and helps you discover the next generation of hits.
                </p>
                <p className="text-sm text-foreground/60 italic">
                  "Welcome to the Factory, where frequencies become legends." - QUENCY
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="container py-24 px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            <span className="waveform-gradient bg-clip-text text-transparent">
              How It Works
            </span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="cosmic-bg-deep/50 backdrop-blur-sm rounded-lg p-6 border border-border">
              <div className="text-6xl mb-4 ft-red-glow">01</div>
              <h3 className="text-2xl font-bold mb-3">Listen & Predict</h3>
              <p className="text-foreground/70">
                Discover new tracks from emerging artists. Make predictions on which songs will become hits.
              </p>
            </div>

            {/* Step 2 */}
            <div className="cosmic-bg-deep/50 backdrop-blur-sm rounded-lg p-6 border border-border">
              <div className="text-6xl mb-4 ft-blue-glow">02</div>
              <h3 className="text-2xl font-bold mb-3">Earn Tokens</h3>
              <p className="text-foreground/70">
                Correct predictions earn you Frequency Tokens (FT). Climb the leaderboard and unlock rewards.
              </p>
            </div>

            {/* Step 3 */}
            <div className="cosmic-bg-deep/50 backdrop-blur-sm rounded-lg p-6 border border-border">
              <div className="text-6xl mb-4 ft-gold-glow">03</div>
              <h3 className="text-2xl font-bold mb-3">Redeem & Flex</h3>
              <p className="text-foreground/70">
                Use your tokens for exclusive merch, discount codes, and bragging rights as a music oracle.
              </p>
            </div>
          </div>
        </section>

        {/* Token Tiers Section */}
        <section className="container py-24 px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            <span className="waveform-gradient bg-clip-text text-transparent">
              Frequency Token Tiers
            </span>
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Red Token */}
            <div className="cosmic-bg-deep/50 backdrop-blur-sm rounded-lg p-6 border border-border text-center">
              <img 
                src="/assets/tokens-colors.jpeg" 
                alt="Red Frequency Token" 
                className="w-32 h-32 mx-auto mb-4"
              />
              <h3 className="text-xl font-bold mb-2 ft-red-glow">Red FT</h3>
              <p className="text-foreground/60 text-sm">Base Tier • Common</p>
              <p className="text-foreground/70 mt-3">
                Earned for basic predictions and engagement
              </p>
            </div>

            {/* Blue Token */}
            <div className="cosmic-bg-deep/50 backdrop-blur-sm rounded-lg p-6 border border-border text-center">
              <img 
                src="/assets/tokens-colors.jpeg" 
                alt="Blue Frequency Token" 
                className="w-32 h-32 mx-auto mb-4"
              />
              <h3 className="text-xl font-bold mb-2 ft-blue-glow">Blue FT</h3>
              <p className="text-foreground/60 text-sm">Mid Tier • Uncommon</p>
              <p className="text-foreground/70 mt-3">
                Earned for accurate predictions and consistency
              </p>
            </div>

            {/* Purple Token */}
            <div className="cosmic-bg-deep/50 backdrop-blur-sm rounded-lg p-6 border border-border text-center">
              <img 
                src="/assets/tokens-colors.jpeg" 
                alt="Purple Frequency Token" 
                className="w-32 h-32 mx-auto mb-4"
              />
              <h3 className="text-xl font-bold mb-2 ft-purple-glow">Purple FT</h3>
              <p className="text-foreground/60 text-sm">High Tier • Rare</p>
              <p className="text-foreground/70 mt-3">
                Earned for exceptional prediction accuracy
              </p>
            </div>

            {/* Gold Token */}
            <div className="cosmic-bg-deep/50 backdrop-blur-sm rounded-lg p-6 border border-border text-center">
              <img 
                src="/assets/token-premium.jpeg" 
                alt="Gold Frequency Token" 
                className="w-32 h-32 mx-auto mb-4"
              />
              <h3 className="text-xl font-bold mb-2 ft-gold-glow">Gold FT</h3>
              <p className="text-foreground/60 text-sm">Top Tier • Legendary</p>
              <p className="text-foreground/70 mt-3">
                Earned by top predictors and community legends
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="container py-12 px-4 text-center border-t border-border">
          <p className="text-foreground/60 mb-4">
            © 2025 Frequency Factory. All frequencies reserved.
          </p>
          <p className="text-sm text-foreground/40">
            A cosmic platform for discovering the next generation of hits.
          </p>
        </footer>
      </div>
    </div>
  );
}
