#!/usr/bin/env node

/**
 * Asset Export Script
 *
 * Exports current assets to JSON format for production deployment
 * Run with: node docs/import/export-assets.js
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function exportAssets() {
  try {
    console.log('🏢 Exporting Assets for Production Deployment...\n');

    // Get all assets from current database
    const assets = await prisma.asset.findMany({
      orderBy: { createdAt: 'asc' }
    });

    console.log(`📊 Found ${assets.length} assets to export\n`);

    // Transform assets for export (remove auto-generated fields)
    const exportData = assets.map(asset => ({
      id: asset.id, // Keep specific IDs for consistency
      name: asset.name,
      description: asset.description,
      category: asset.category,
      purchasePrice: asset.purchasePrice,
      currentValue: asset.currentValue,
      purchaseDate: asset.purchaseDate?.toISOString(),
      condition: asset.condition,
      location: asset.location,
      serialNumber: asset.serialNumber,
      warrantyExpiry: asset.warrantyExpiry?.toISOString(),
      maintenanceDate: asset.maintenanceDate?.toISOString(),
      status: asset.status,
      notes: asset.notes
    }));

    // Export to JSON file
    const exportPath = path.join(__dirname, 'assets-export.json');
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));

    console.log('Assets to export:');
    exportData.forEach((asset, index) => {
      console.log(`${index + 1}. ${asset.name} (${asset.category})`);
      console.log(`   Location: ${asset.location}`);
      console.log(`   Value: UGX ${asset.currentValue?.toLocaleString() || 'N/A'}`);
      console.log(`   ID: ${asset.id}`);
      console.log('');
    });

    console.log(`✅ Assets exported to: ${exportPath}`);
    console.log('🚀 Ready for production deployment!');

  } catch (error) {
    console.error('💥 Error exporting assets:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the export
if (require.main === module) {
  exportAssets()
    .then(() => {
      console.log('\n👋 Export completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Export failed:', error);
      process.exit(1);
    });
}

module.exports = { exportAssets };