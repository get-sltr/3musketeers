#!/usr/bin/env node

/**
 * SLTR Black Card Importer
 * Imports generated cards to Supabase database
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importCards() {
  console.log('📥 SLTR Black Card Importer\n');

  // Read cards registry
  const registryPath = path.join(__dirname, '../public/black_cards/cards_index.json');

  if (!fs.existsSync(registryPath)) {
    console.error('❌ Error: cards_index.json not found');
    console.error('Please run: node scripts/generate_black_cards.js first');
    process.exit(1);
  }

  const cardsData = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  console.log(`📋 Found ${cardsData.length} cards to import\n`);

  // Prepare data for database
  const cardsToInsert = cardsData.map((card) => ({
    founder_number: card.id,
    founder_name: card.name,
    verification_code: card.code,
    verify_url: card.url,
    redeemed: false,
    is_active: true,
  }));

  // Insert cards
  console.log('⏳ Inserting cards into database...\n');

  const { data, error } = await supabase
    .from('founder_cards')
    .upsert(cardsToInsert, {
      onConflict: 'founder_number',
      ignoreDuplicates: false,
    });

  if (error) {
    console.error('❌ Error importing cards:', error.message);
    process.exit(1);
  }

  console.log(`✅ Successfully imported ${cardsData.length} cards!\n`);

  // Verify import
  const { data: countData, error: countError } = await supabase
    .from('founder_cards')
    .select('id', { count: 'exact', head: true });

  if (!countError) {
    console.log(`📊 Total cards in database: ${countData?.length || 0}\n`);
  }

  console.log('🎉 Import complete!\n');
  console.log('Next steps:');
  console.log('  1. Deploy verification pages');
  console.log('  2. Deploy admin dashboard');
  console.log('  3. Send cards to founders\n');
}

importCards().catch(console.error);
