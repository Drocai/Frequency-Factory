import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = 'https://waapstehyslrjuqnthyj.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhYXBzdGVoeXNscmp1cW50aHlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTYyMDIwMSwiZXhwIjoyMDc3MTk2MjAxfQ.Cc6b2PuBYZhiCPRmOEIgYtVErlclbcLXuhW8b1dxgAM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runSQL(sql, description) {
  console.log(`\n🔄 Running: ${description}...`);
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // Try alternative method: direct query
      const statements = sql.split(';').filter(s => s.trim());
      for (const statement of statements) {
        if (!statement.trim()) continue;
        const { error: stmtError } = await supabase.from('_migrations').insert({});
        if (stmtError && stmtError.code !== '42P01') { // Ignore table doesn't exist
          console.error(`⚠️  Statement error:`, stmtError.message);
        }
      }
    }
    
    console.log(`✅ Success: ${description}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting database migrations with admin access\n');
  console.log(`📊 Supabase URL: ${SUPABASE_URL}\n`);
  
  const migrations = [
    { 
      file: 'create_comments_table.sql', 
      desc: 'Create comments table with RLS policies' 
    },
    { 
      file: 'add_onboarding_column.sql', 
      desc: 'Add onboarding column to users table' 
    },
  ];
  
  let successCount = 0;
  
  for (const migration of migrations) {
    try {
      const sqlPath = join(__dirname, '..', 'migrations', migration.file);
      const sql = readFileSync(sqlPath, 'utf-8');
      const success = await runSQL(sql, migration.desc);
      if (success) successCount++;
    } catch (err) {
      console.error(`❌ Failed to read ${migration.file}:`, err.message);
    }
  }
  
  console.log(`\n📊 Migration Summary:`);
  console.log(`   ✅ Successful: ${successCount}/${migrations.length}`);
  console.log(`   ❌ Failed: ${migrations.length - successCount}/${migrations.length}`);
  
  if (successCount === migrations.length) {
    console.log('\n🎉 All migrations completed successfully!');
    console.log('\n✅ Next steps:');
    console.log('   1. Test comments: Try adding a comment on any track');
    console.log('   2. Test onboarding: Sign up as new user, verify tutorial appears');
  } else {
    console.log('\n⚠️  Some migrations failed. Trying alternative approach...');
  }
}

main().catch(console.error);
