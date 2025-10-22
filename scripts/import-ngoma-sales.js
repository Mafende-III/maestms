#!/usr/bin/env node

/**
 * Ngoma Business Center Sales Import Script
 *
 * This script imports sales data from CSV file into the database
 * Run with: node scripts/import-ngoma-sales.js
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Business Center Asset IDs (from seed data)
const NGOMA_BUSINESS_CENTER_ID = 'cmh2iqi9y0000ttaxuvz4ynaj';

// Category mapping to our system categories
const CATEGORY_MAPPING = {
  'SHOP': 'SHOP',
  'SALON': 'SALON',
  'CINEMA': 'CINEMA',
  'MOBILE_MONEY': 'MOBILE_MONEY',
  'CHARCOAL': 'CHARCOAL',
  'PROPERTY': 'PROPERTY',
  'LIVESTOCK': 'LIVESTOCK'
};

// Sale type mapping based on category-specific logic from sales form
const getSaleType = (category) => {
  if (['SHOP', 'SALON', 'CINEMA', 'MOBILE_MONEY'].includes(category)) {
    return 'SHOP_SALE'; // Daily business sales
  }
  if (category === 'CHARCOAL') {
    return 'BULK_SALE'; // Default for charcoal sales (can be CASH_SALE too)
  }
  if (['PROPERTY', 'LIVESTOCK'].includes(category)) {
    return 'PROPERTY_SALE'; // Property and livestock sales
  }
  return 'CASH_SALE'; // Default fallback
};

// Auto-description based on category (matching the sales form logic)
const getAutoDescription = (category, date) => {
  const autoDescriptions = {
    'SHOP': 'Daily Shop Sales',
    'SALON': 'Daily Salon Services',
    'CINEMA': 'Daily Cinema Tickets',
    'MOBILE_MONEY': 'Daily Mobile Money Transactions',
    'CHARCOAL': 'Charcoal Bags',
    'LIVESTOCK': 'Livestock Sale',
    'PROPERTY': 'Property Sale'
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
    return 'CASH'; // Charcoal sales typically cash, but can be credit
  }
  if (['PROPERTY', 'LIVESTOCK'].includes(category)) {
    return 'BANK_TRANSFER'; // High-value sales usually bank transfer
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

// Transform CSV row to sales record with category-specific logic
function transformToSaleRecord(row, adminUserId) {
  const category = CATEGORY_MAPPING[row.category] || 'OTHER';
  const saleType = getSaleType(category);

  // Parse date (format: YYYY-MM-DD)
  const saleDate = new Date(row.date);
  const dateString = saleDate.toLocaleDateString();

  // Parse amounts (remove any non-numeric characters except decimal)
  const totalAmount = parseFloat(row.totalAmount.replace(/[^0-9.]/g, '')) || 0;
  const unitPrice = parseFloat(row.unitPrice.replace(/[^0-9.]/g, '')) || 0;
  const quantity = parseFloat(row.quantity) || 1;

  // Category-specific field handling
  const isBusinessDaily = ['SHOP', 'SALON', 'CINEMA', 'MOBILE_MONEY'].includes(category);
  const isIndividualSale = ['CHARCOAL', 'PROPERTY', 'LIVESTOCK'].includes(category);

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
    notes: row.notes || null,
    recordedBy: adminUserId
  };

  // Add quantity and unit price for products (CHARCOAL and some others)
  if (category === 'CHARCOAL' || quantity > 1) {
    saleRecord.quantity = quantity > 0 ? quantity : null;
    saleRecord.unitPrice = unitPrice > 0 ? unitPrice : (totalAmount / quantity);
  }

  // For daily business operations, quantity is typically 1 (daily aggregate)
  if (isBusinessDaily) {
    saleRecord.quantity = 1;
    saleRecord.unitPrice = totalAmount; // The daily total is the "unit price"
  }

  // For individual sales (CHARCOAL, PROPERTY, LIVESTOCK), we might need buyer info
  // For now, we don't have buyer data in the CSV, so we'll leave these fields null
  // In a real scenario, you'd want to add buyer information for these categories

  return saleRecord;
}

// Main import function
async function importSales() {
  try {
    console.log('🚀 Starting Ngoma Business Center Sales Import...\n');

    // Read CSV file (now in docs/import directory)
    const csvPath = path.join(__dirname, 'ngoma-sales-import.csv');

    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found: ${csvPath}`);
    }

    console.log('📖 Reading CSV file...');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const rows = parseCSV(csvContent);

    console.log(`📊 Found ${rows.length} sales records to import\n`);

    // Verify Ngoma Business Center asset exists
    console.log('🏢 Verifying Ngoma Business Center asset...');
    const ngomaAsset = await prisma.asset.findUnique({
      where: { id: NGOMA_BUSINESS_CENTER_ID }
    });

    if (!ngomaAsset) {
      throw new Error(`❌ Ngoma Business Center asset not found (ID: ${NGOMA_BUSINESS_CENTER_ID}). Please run the seed script first: npm run db:seed`);
    }

    console.log(`✅ Found asset: ${ngomaAsset.name} at ${ngomaAsset.location}\n`);

    // Get admin user for recordedBy
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      throw new Error('❌ Admin user not found. Please run the seed script first: npm run db:seed');
    }

    console.log(`👤 Using admin user: ${adminUser.email}\n`);

    // Update recordedBy with actual admin user ID
    const adminUserId = adminUser.id;

    // Process and import each record
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        console.log(`📝 Processing record ${i + 1}/${rows.length}: ${row.date} - ${row.category} - UGX ${row.totalAmount}`);

        const saleRecord = transformToSaleRecord(row, adminUserId);

        // Check if record already exists (avoid duplicates)
        const existingSale = await prisma.sale.findFirst({
          where: {
            assetId: saleRecord.assetId,
            saleDate: new Date(saleRecord.saleDate),
            category: saleRecord.category,
            salePrice: saleRecord.salePrice
          }
        });

        if (existingSale) {
          console.log(`   ⚠️  Skipping duplicate record`);
          continue;
        }

        // Create the sale record
        await prisma.sale.create({
          data: saleRecord
        });

        successCount++;
        console.log(`   ✅ Successfully imported`);

      } catch (error) {
        errorCount++;
        const errorMsg = `Row ${i + 1}: ${error.message}`;
        errors.push(errorMsg);
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    // Summary
    console.log('\n📈 Import Summary:');
    console.log(`✅ Successfully imported: ${successCount} records`);
    console.log(`❌ Errors: ${errorCount} records`);

    if (errors.length > 0) {
      console.log('\n🚨 Error Details:');
      errors.forEach(error => console.log(`   - ${error}`));
    }

    console.log('\n🎉 Import completed!');

  } catch (error) {
    console.error('💥 Fatal error during import:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
if (require.main === module) {
  importSales()
    .then(() => {
      console.log('\n👋 Import script finished successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Import script failed:', error);
      process.exit(1);
    });
}

module.exports = { importSales };