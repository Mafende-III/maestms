#!/usr/bin/env node

/**
 * Asset Production Import Script
 *
 * Imports assets to production database via API
 * Run with: node docs/import/import-assets-to-production.js
 */

const fs = require('fs');
const path = require('path');

// Production configuration
const PRODUCTION_URL = 'https://www.maest.streamlinexperts.rw'; // Update with actual production URL
const ADMIN_EMAIL = 'admin@mafende.com';
const ADMIN_PASSWORD = 'Admin123!'; // This should be passed as environment variable in production

// Asset data to import (predefined for consistency)
const ASSETS_TO_IMPORT = [
  {
    id: 'cmh2iqi9y0000ttaxuvz4ynaj',
    name: 'Ngoma Business Center',
    description: 'Main business center housing shop, salon, cinema, and mobile money services',
    category: 'PROPERTY',
    purchasePrice: 50000000, // 50M UGX
    currentValue: 60000000,  // 60M UGX
    purchaseDate: '2020-01-01T00:00:00.000Z',
    condition: 'GOOD',
    location: 'Ngoma District, Rwanda',
    status: 'ACTIVE',
    notes: 'Multi-purpose business facility generating revenue from various services'
  },
  {
    id: 'cmh2iqia00001ttaxe2o8g4f8',
    name: 'Nakasongola Ranch',
    description: 'Agricultural ranch for livestock and property development',
    category: 'PROPERTY',
    purchasePrice: 2000000000, // 2B UGX
    currentValue: 2500000000,  // 2.5B UGX
    purchaseDate: '2018-06-15T00:00:00.000Z',
    condition: 'EXCELLENT',
    location: 'Nakasongola District, Uganda',
    status: 'ACTIVE',
    notes: 'Large ranch for livestock farming and land development projects'
  }
];

// Login and get session cookie
async function loginToProduction() {
  console.log('🔐 Logging into production...');

  const loginResponse = await fetch(`${PRODUCTION_URL}/api/auth/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    })
  });

  if (!loginResponse.ok) {
    throw new Error(`Login failed: ${loginResponse.status}`);
  }

  // Extract session cookie
  const cookies = loginResponse.headers.get('set-cookie');
  console.log('✅ Login successful');
  return cookies;
}

// Create asset via API
async function createAsset(asset, cookies) {
  console.log(`📝 Creating asset: ${asset.name}...`);

  const response = await fetch(`${PRODUCTION_URL}/api/assets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies || ''
    },
    body: JSON.stringify(asset)
  });

  if (response.ok) {
    const result = await response.json();
    console.log(`   ✅ Created: ${result.name} (ID: ${result.id})`);
    return result;
  } else {
    const error = await response.text();
    console.log(`   ❌ Error: ${response.status} - ${error}`);
    return null;
  }
}

// Main import function
async function importAssetsToProduction() {
  try {
    console.log('🚀 Starting Asset Import to Production...\n');
    console.log(`📍 Target: ${PRODUCTION_URL}`);
    console.log(`📊 Assets to import: ${ASSETS_TO_IMPORT.length}\n`);

    // Login to production
    const cookies = await loginToProduction();

    // Import each asset
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < ASSETS_TO_IMPORT.length; i++) {
      const asset = ASSETS_TO_IMPORT[i];
      try {
        const result = await createAsset(asset, cookies);
        if (result) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        console.log(`   ❌ Error creating ${asset.name}: ${error.message}`);
        errorCount++;
      }
    }

    // Summary
    console.log('\n📈 Import Summary:');
    console.log(`✅ Successfully imported: ${successCount} assets`);
    console.log(`❌ Errors: ${errorCount} assets`);

    if (successCount === ASSETS_TO_IMPORT.length) {
      console.log('\n🎉 All assets imported successfully!');
      console.log('🔗 Assets are now available for sales data import.');
    } else {
      console.log('\n⚠️  Some assets failed to import. Check errors above.');
    }

  } catch (error) {
    console.error('💥 Fatal error during import:', error);
    process.exit(1);
  }
}

// Run the import
if (require.main === module) {
  importAssetsToProduction()
    .then(() => {
      console.log('\n👋 Asset import finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Asset import failed:', error);
      process.exit(1);
    });
}

module.exports = { importAssetsToProduction, ASSETS_TO_IMPORT };