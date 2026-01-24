/**
 * Seed Script for Demo Tracks
 *
 * Run with: pnpm tsx scripts/seed-tracks.ts
 *
 * This seeds the database with demo tracks for testing and development.
 */

import { drizzle } from "drizzle-orm/mysql2";
import { submissions } from "../drizzle/schema";

// Demo tracks data
const DEMO_TRACKS = [
  {
    artistName: "Neon Dreams",
    trackTitle: "Electric Pulse",
    genre: "Electronic",
    streamingLink: "https://open.spotify.com/track/example1",
    status: "approved" as const,
  },
  {
    artistName: "Sunset Vibes",
    trackTitle: "Golden Hour",
    genre: "Synthwave",
    streamingLink: "https://open.spotify.com/track/example2",
    status: "approved" as const,
  },
  {
    artistName: "Bass Factory",
    trackTitle: "Drop Zone",
    genre: "Electronic",
    streamingLink: "https://open.spotify.com/track/example3",
    status: "approved" as const,
  },
  {
    artistName: "Crystal Clear",
    trackTitle: "Ocean Waves",
    genre: "Ambient",
    streamingLink: "https://open.spotify.com/track/example4",
    status: "approved" as const,
  },
  {
    artistName: "Urban Flow",
    trackTitle: "City Lights",
    genre: "Hip-Hop",
    streamingLink: "https://open.spotify.com/track/example5",
    status: "approved" as const,
  },
  {
    artistName: "Retro Runner",
    trackTitle: "Midnight Chase",
    genre: "Synthwave",
    streamingLink: "https://open.spotify.com/track/example6",
    status: "approved" as const,
  },
  {
    artistName: "Cloud Nine",
    trackTitle: "Above the Sky",
    genre: "Pop",
    streamingLink: "https://open.spotify.com/track/example7",
    status: "approved" as const,
  },
  {
    artistName: "Deep State",
    trackTitle: "Underground",
    genre: "Electronic",
    streamingLink: "https://open.spotify.com/track/example8",
    status: "approved" as const,
  },
  {
    artistName: "Rhythm Section",
    trackTitle: "Groove Theory",
    genre: "Hip-Hop",
    streamingLink: "https://open.spotify.com/track/example9",
    status: "approved" as const,
  },
  {
    artistName: "Aurora Beats",
    trackTitle: "Northern Lights",
    genre: "Ambient",
    streamingLink: "https://open.spotify.com/track/example10",
    status: "approved" as const,
  },
  {
    artistName: "Voltage",
    trackTitle: "High Energy",
    genre: "Electronic",
    streamingLink: "https://open.spotify.com/track/example11",
    status: "approved" as const,
  },
  {
    artistName: "Silk Road",
    trackTitle: "Eastern Promise",
    genre: "Pop",
    streamingLink: "https://open.spotify.com/track/example12",
    status: "approved" as const,
  },
  {
    artistName: "Heavy Rotation",
    trackTitle: "Breaking Point",
    genre: "Rock",
    streamingLink: "https://open.spotify.com/track/example13",
    status: "approved" as const,
  },
  {
    artistName: "Whisper",
    trackTitle: "Silent Echo",
    genre: "Ambient",
    streamingLink: "https://open.spotify.com/track/example14",
    status: "approved" as const,
  },
  {
    artistName: "Frequency Factory",
    trackTitle: "Factory Floor",
    genre: "Electronic",
    streamingLink: "https://open.spotify.com/track/example15",
    status: "approved" as const,
  },
  {
    artistName: "Digital Nomad",
    trackTitle: "Wanderlust",
    genre: "Synthwave",
    streamingLink: "https://open.spotify.com/track/example16",
    status: "pending" as const,
  },
  {
    artistName: "Cosmic Drift",
    trackTitle: "Stardust",
    genre: "Ambient",
    streamingLink: "https://open.spotify.com/track/example17",
    status: "pending" as const,
  },
  {
    artistName: "Street Level",
    trackTitle: "Block Party",
    genre: "Hip-Hop",
    streamingLink: "https://open.spotify.com/track/example18",
    status: "pending" as const,
  },
  {
    artistName: "Neon Signs",
    trackTitle: "After Dark",
    genre: "Synthwave",
    streamingLink: "https://open.spotify.com/track/example19",
    status: "pending" as const,
  },
  {
    artistName: "Echo Chamber",
    trackTitle: "Reverb",
    genre: "Electronic",
    streamingLink: "https://open.spotify.com/track/example20",
    status: "pending" as const,
  },
];

async function seedTracks() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("❌ DATABASE_URL environment variable is not set");
    console.log("\nTo seed the database, set DATABASE_URL and run:");
    console.log("  DATABASE_URL=mysql://... pnpm tsx scripts/seed-tracks.ts");
    process.exit(1);
  }

  console.log("🌱 Seeding demo tracks...\n");

  try {
    const db = drizzle(databaseUrl);

    for (const track of DEMO_TRACKS) {
      const ticketNumber = `FF-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

      await db.insert(submissions).values({
        ...track,
        ticketNumber,
        queuePosition: track.status === "pending" ? DEMO_TRACKS.indexOf(track) + 1 : null,
        plays: Math.floor(Math.random() * 1000),
        likes: Math.floor(Math.random() * 100),
        commentsCount: Math.floor(Math.random() * 20),
        avgHookStrength: Math.floor(Math.random() * 40) + 60,
        avgOriginality: Math.floor(Math.random() * 40) + 60,
        avgProductionQuality: Math.floor(Math.random() * 40) + 60,
        totalCertifications: Math.floor(Math.random() * 50),
      });

      console.log(`  ✅ ${track.artistName} - ${track.trackTitle} (${track.status})`);

      // Small delay to ensure unique ticket numbers
      await new Promise(r => setTimeout(r, 10));
    }

    console.log(`\n🎉 Successfully seeded ${DEMO_TRACKS.length} demo tracks!`);
    console.log("\nTrack breakdown:");
    console.log(`  - Approved: ${DEMO_TRACKS.filter(t => t.status === "approved").length}`);
    console.log(`  - Pending: ${DEMO_TRACKS.filter(t => t.status === "pending").length}`);

  } catch (error) {
    console.error("❌ Error seeding tracks:", error);
    process.exit(1);
  }

  process.exit(0);
}

seedTracks();
