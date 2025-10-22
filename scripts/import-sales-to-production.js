#!/usr/bin/env node

/**
 * Sales Production Import Script
 *
 * Imports Ngoma Business Center sales data to production via API
 * Run with: node scripts/import-sales-to-production.js
 */

const fs = require('fs');
const path = require('path');

// Production configuration
const PRODUCTION_URL = 'https://www.maest.streamlinexperts.rw'; // Update with actual production URL
const ADMIN_EMAIL = 'admin@mafende.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!'; // Use environment variable in production

// CSV data path
const CSV_PATH = path.join(__dirname, 'ngoma-sales-import.csv');

// Ngoma Business Center Asset ID (must exist in production)
const NGOMA_BUSINESS_CENTER_ID = 'cmh2iqi9y0000ttaxuvz4ynaj';

// Category mapping to our system categories
const CATEGORY_MAPPING = {
  'SHOP': 'SHOP',
  'SALON': 'SALON',
  'CINEMA': 'CINEMA',
  'MOBILE_MONEY': 'MOBILE_MONEY',
  'CHARCOAL': 'CHARCOAL'
};

// Sale type mapping based on category-specific logic
const getSaleType = (category) => {
  if (['SHOP', 'SALON', 'CINEMA', 'MOBILE_MONEY'].includes(category)) {
    return 'SHOP_SALE'; // Daily business sales
  }
  if (category === 'CHARCOAL') {
    return 'BULK_SALE'; // Default for charcoal sales
  }
  return 'CASH_SALE'; // Default fallback
};

// Auto-description based on category
const getAutoDescription = (category, date) => {
  const autoDescriptions = {
    'SHOP': 'Daily Shop Sales',
    'SALON': 'Daily Salon Services',
    'CINEMA': 'Daily Cinema Tickets',
    'MOBILE_MONEY': 'Daily Mobile Money Transactions',
    'CHARCOAL': 'Charcoal Bags'
  };
  return autoDescriptions[category] || `${category} Sale - ${date}`;
};

// Payment method defaults based on category
const getDefaultPaymentMethod = (category) => {
  if (['SHOP', 'SALON', 'CINEMA'].includes(category)) {
    return 'CASH'; // Physical businesses default to cash
  }
  if (category === 'MOBILE_MONEY') {
    return 'MPESA'; // Mobile money transactions
  }
  if (category === 'CHARCOAL') {
    return 'CASH'; // Charcoal sales typically cash
  }
  return 'CASH'; // Default fallback
};

// Parse CSV data
function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',');

  return lines.slice(1).map(line => {
    const values = line.split(',');
    const row = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || '';
    });
    return row;
  });
}

// Transform CSV row to sales record
function transformToSaleRecord(row) {
  const category = CATEGORY_MAPPING[row.category] || 'OTHER';
  const saleType = getSaleType(category);

  // Parse date (format: YYYY-MM-DD)
  const saleDate = new Date(row.date);
  const dateString = saleDate.toLocaleDateString();

  // Parse amounts (remove any non-numeric characters except decimal)
  const totalAmount = parseFloat(row.totalAmount.replace(/[^0-9.]/g, '')) || 0;
  const unitPrice = parseFloat(row.unitPrice.replace(/[^0-9.]/g, '')) || 0;
  const quantity = parseFloat(row.quantity) || 1;

  // Build the sale record
  const saleRecord = {
    assetId: NGOMA_BUSINESS_CENTER_ID,
    description: row.description || getAutoDescription(category, dateString),
    salePrice: totalAmount,
    saleDate: saleDate.toISOString(),
    category: category,
    saleType: saleType,
    paymentMethod: getDefaultPaymentMethod(category),
    paymentStatus: totalAmount > 0 ? 'COMPLETED' : 'PENDING',
    location: 'Ngoma Business Center',
    currency: 'UGX',
    notes: row.notes || null
  };

  // Add quantity and unit price for products (CHARCOAL and some others)
  if (category === 'CHARCOAL' || quantity > 1) {
    saleRecord.quantity = quantity > 0 ? quantity : null;
    saleRecord.unitPrice = unitPrice > 0 ? unitPrice : (totalAmount / quantity);
  }

  // For daily business operations, quantity is typically 1 (daily aggregate)
  const isBusinessDaily = ['SHOP', 'SALON', 'CINEMA', 'MOBILE_MONEY'].includes(category);
  if (isBusinessDaily) {
    saleRecord.quantity = 1;
    saleRecord.unitPrice = totalAmount; // The daily total is the "unit price"
  }

  return saleRecord;
}

// Login and get session cookie
async function loginToProduction() {
  console.log('🔐 Logging into production...');

  // Try different auth endpoints
  const authEndpoints = [
    `${PRODUCTION_URL}/api/auth/signin`,
    `${PRODUCTION_URL}/api/auth/callback/credentials`
  ];

  for (const endpoint of authEndpoints) {
    try {
      const loginResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          redirect: false
        })
      });

      if (loginResponse.ok) {
        const cookies = loginResponse.headers.get('set-cookie');
        console.log('✅ Login successful');
        return cookies;
      }
    } catch (error) {
      console.log(`   ⚠️ Auth endpoint ${endpoint} failed: ${error.message}`);
    }
  }

  throw new Error('All login attempts failed');
}

// Create sale via API
async function createSale(sale, cookies) {
  console.log(`📝 Creating sale: ${sale.description} - UGX ${sale.salePrice.toLocaleString()}...`);

  const response = await fetch(`${PRODUCTION_URL}/api/sales`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies || ''
    },
    body: JSON.stringify(sale)
  });

  if (response.ok) {
    const result = await response.json();
    console.log(`   ✅ Created: ${result.description}`);
    return result;
  } else {
    const error = await response.text();
    console.log(`   ❌ Error: ${response.status} - ${error}`);
    return null;
  }
}

// Main import function
async function importSalesToProduction() {
  try {
    console.log('🚀 Starting Sales Import to Production...\n');
    console.log(`📍 Target: ${PRODUCTION_URL}`);

    // Check if CSV file exists
    if (!fs.existsSync(CSV_PATH)) {
      throw new Error(`CSV file not found: ${CSV_PATH}`);
    }

    // Read and parse CSV
    console.log('📖 Reading sales data...');
    const csvContent = fs.readFileSync(CSV_PATH, 'utf8');
    const rows = parseCSV(csvContent);
    console.log(`📊 Found ${rows.length} sales records to import\n`);

    // Login to production
    const cookies = await loginToProduction();

    // Import each sale
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const saleRecord = transformToSaleRecord(row);
        const result = await createSale(saleRecord, cookies);

        if (result) {
          successCount++;
        } else {
          errorCount++;
        }

        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.log(`   ❌ Error processing row ${i + 1}: ${error.message}`);
        errorCount++;
      }
    }

    // Summary
    console.log('\n📈 Import Summary:');
    console.log(`✅ Successfully imported: ${successCount} sales`);
    console.log(`❌ Errors: ${errorCount} sales`);

    if (successCount === rows.length) {
      console.log('\n🎉 All sales imported successfully!');
      console.log('💰 Ngoma Business Center sales data is now live in production.');
    } else if (successCount > 0) {
      console.log('\n⚠️  Partial success. Some sales failed to import.');
    } else {
      console.log('\n💥 No sales were imported. Check errors above.');
    }

  } catch (error) {
    console.error('💥 Fatal error during import:', error);
    process.exit(1);
  }
}

// Run the import
if (require.main === module) {
  importSalesToProduction()
    .then(() => {
      console.log('\n👋 Sales import finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Sales import failed:', error);
      process.exit(1);
    });
}

module.exports = { importSalesToProduction };