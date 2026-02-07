#!/usr/bin/env node

/**
 * End-to-end smoke test for Frequency Factory.
 * Tests Supabase connection, track submission, admin ops, and cleanup.
 *
 * Usage:  node scripts/test-e2e.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  "https://waapstehyslrjuqnthyj.supabase.co";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhYXBzdGVoeXNscmp1cW50aHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MjAyMDEsImV4cCI6MjA3NzE5NjIwMX0.9HUyry4JU5Tv8xvKeQI_dHtW6guRODUJeLi8fgp77R8";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PASS = "\x1b[32mPASS\x1b[0m";
const FAIL = "\x1b[31mFAIL\x1b[0m";
const SKIP = "\x1b[33mSKIP\x1b[0m";

let testTrackId = null;

async function test(name, fn) {
  try {
    const result = await fn();
    if (result === "skip") {
      console.log(`  ${SKIP}  ${name}`);
    } else {
      console.log(`  ${PASS}  ${name}`);
    }
  } catch (err) {
    console.log(`  ${FAIL}  ${name}: ${err.message}`);
  }
}

async function main() {
  console.log("\nFrequency Factory — E2E Smoke Test");
  console.log("══════════════════════════════════\n");
  console.log(`Supabase: ${SUPABASE_URL}\n`);

  // 1. Can we read tracks?
  await test("Read tracks table", async () => {
    const { error } = await supabase
      .from("tracks")
      .select("*", { count: "exact", head: true });
    if (error) throw new Error(error.message);
  });

  // 2. Can we insert a pending track (public submission)?
  await test("Submit a track (insert pending)", async () => {
    const { data, error } = await supabase
      .from("tracks")
      .insert({
        title: "E2E Test Track",
        artist: "E2E Bot",
        audio_url: "https://example.com/test-audio.mp3",
        cover_url: null,
        genre: "Electronic",
        socials: "@e2etest",
        notes: "Automated smoke test — safe to delete",
        status: "pending",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    testTrackId = data.id;
  });

  // 3. Can we read pending tracks (admin view)?
  await test("Read pending tracks (admin)", async () => {
    const { data, error } = await supabase
      .from("tracks")
      .select("*")
      .eq("status", "pending");
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error("No pending tracks found");
  });

  // 4. Can we approve a track (admin action)?
  await test("Approve track (admin update)", async () => {
    if (!testTrackId) return "skip";
    const { error } = await supabase
      .from("tracks")
      .update({ status: "approved" })
      .eq("id", testTrackId);
    if (error) throw new Error(error.message);
  });

  // 5. Can we read approved tracks (public /listen)?
  await test("Read approved tracks (public /listen)", async () => {
    const { data, error } = await supabase
      .from("tracks")
      .select("*")
      .eq("status", "approved");
    if (error) throw new Error(error.message);
  });

  // 6. Can we insert a rating?
  await test("Submit a rating", async () => {
    if (!testTrackId) return "skip";
    const { error } = await supabase.from("ratings").insert({
      track_id: testTrackId,
      user_id: "e2e-test-user",
      rating: 4,
    });
    if (error) throw new Error(error.message);
  });

  // 7. Check average_rating auto-trigger
  await test("Auto-trigger updated average_rating", async () => {
    if (!testTrackId) return "skip";
    const { data, error } = await supabase
      .from("tracks")
      .select("average_rating, rating_count")
      .eq("id", testTrackId)
      .single();
    if (error) throw new Error(error.message);
    if (data.average_rating === null)
      throw new Error("average_rating still null after rating insert");
  });

  // 8. Settings table
  await test("Settings table exists", async () => {
    const { error } = await supabase
      .from("settings")
      .select("id")
      .limit(1);
    if (error) throw new Error(error.message + " — run: node scripts/setup-settings-table.mjs");
  });

  // 9. Storage buckets
  await test("Audio storage bucket exists", async () => {
    const { data, error } = await supabase.storage.from("audio").list("", { limit: 1 });
    if (error) throw new Error(error.message);
  });

  await test("Covers storage bucket exists", async () => {
    const { data, error } = await supabase.storage.from("covers").list("", { limit: 1 });
    if (error) throw new Error(error.message);
  });

  // 10. Can we delete a track (admin)?
  await test("Delete track (admin cleanup)", async () => {
    if (!testTrackId) return "skip";
    // First delete the rating
    await supabase.from("ratings").delete().eq("track_id", testTrackId);
    const { error } = await supabase
      .from("tracks")
      .delete()
      .eq("id", testTrackId);
    if (error) throw new Error(error.message);
  });

  console.log("\n══════════════════════════════════");
  console.log("Done. Fix any FAIL items above.\n");
}

main().catch(console.error);
