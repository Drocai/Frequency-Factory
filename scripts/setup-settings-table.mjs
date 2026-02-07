#!/usr/bin/env node

/**
 * Run this script to create the `settings` table in your Supabase instance.
 * It uses the Supabase JS client with the anon key.
 *
 * Usage:  node scripts/setup-settings-table.mjs
 *
 * If this fails due to RLS, paste the SQL from migrations/create_settings_table.sql
 * directly into the Supabase SQL Editor at:
 *   https://supabase.com/dashboard/project/waapstehyslrjuqnthyj/sql/new
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  "https://waapstehyslrjuqnthyj.supabase.co";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhYXBzdGVoeXNscmp1cW50aHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MjAyMDEsImV4cCI6MjA3NzE5NjIwMX0.9HUyry4JU5Tv8xvKeQI_dHtW6guRODUJeLi8fgp77R8";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log("Checking if settings table exists...");

  const { data, error } = await supabase
    .from("settings")
    .select("id")
    .limit(1);

  if (!error) {
    console.log("Settings table already exists.");
    if (!data || data.length === 0) {
      console.log("Seeding initial settings row...");
      const { error: insertErr } = await supabase
        .from("settings")
        .insert({});
      if (insertErr) {
        console.log("Could not seed row (may need to run SQL manually):", insertErr.message);
      } else {
        console.log("Settings row seeded.");
      }
    } else {
      console.log("Settings row already exists. All good!");
    }
    return;
  }

  // Table doesn't exist — tell user to run SQL
  console.log("\n");
  console.log("The settings table does not exist yet.");
  console.log("Open the Supabase SQL Editor and paste the contents of:");
  console.log("  migrations/create_settings_table.sql");
  console.log("");
  console.log("Direct link:");
  console.log("  https://supabase.com/dashboard/project/waapstehyslrjuqnthyj/sql/new");
  console.log("");
  console.log("The SQL to paste:");
  console.log("─".repeat(60));

  const fs = await import("fs");
  const path = await import("path");
  const sql = fs.readFileSync(
    path.resolve(import.meta.dirname, "..", "migrations", "create_settings_table.sql"),
    "utf-8"
  );
  console.log(sql);
  console.log("─".repeat(60));
}

main().catch(console.error);
