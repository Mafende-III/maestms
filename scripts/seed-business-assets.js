const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createBusinessAssets() {
  console.log('🏢 Creating business center assets...');

  try {
    // Check if assets already exist
    const existingNgoma = await prisma.asset.findFirst({
      where: { name: 'Ngoma Business Center' }
    });

    const existingNakasongola = await prisma.asset.findFirst({
      where: { name: 'Nakasongola Ranch' }
    });

    if (existingNgoma && existingNakasongola) {
      console.log('✅ Business assets already exist');
      console.log(`   Ngoma Business Center: ${existingNgoma.id}`);
      console.log(`   Nakasongola Ranch: ${existingNakasongola.id}`);
      return;
    }

    // Create Ngoma Business Center
    if (!existingNgoma) {
      const ngomaAsset = await prisma.asset.create({
        data: {
          name: 'Ngoma Business Center',
          description: 'Multi-business facility with shop, salon, cinema, mobile money, and charcoal operations',
          category: 'PROPERTY',
          location: 'Ngoma, Uganda',
          condition: 'EXCELLENT',
          status: 'ACTIVE',
          notes: 'Primary revenue-generating asset with multiple business units: Shop, Salon, Cinema, Mobile Money, Charcoal',
          recordedBy: 'system'
        }
      });
      console.log(`✅ Created Ngoma Business Center: ${ngomaAsset.id}`);
    }

    // Create Nakasongola Ranch
    if (!existingNakasongola) {
      const nakasongollaAsset = await prisma.asset.create({
        data: {
          name: 'Nakasongola Ranch',
          description: 'Ranch property with cattle grazing, land sales, and livestock operations',
          category: 'PROPERTY',
          location: 'Nakasongola, Uganda',
          condition: 'GOOD',
          status: 'ACTIVE',
          notes: 'Ranch operations including cattle grazing leases, land sales, livestock, and charcoal production',
          recordedBy: 'system'
        }
      });
      console.log(`✅ Created Nakasongola Ranch: ${nakasongollaAsset.id}`);
    }

    // Get final asset list
    const allAssets = await prisma.asset.findMany({
      where: {
        name: {
          in: ['Ngoma Business Center', 'Nakasongola Ranch']
        }
      },
      select: {
        id: true,
        name: true,
        location: true,
        status: true
      }
    });

    console.log('\n📊 Business Assets Summary:');
    allAssets.forEach(asset => {
      console.log(`   ${asset.name}: ${asset.id} (${asset.location}) - ${asset.status}`);
    });

    console.log('\n🎯 Ready for sales linking!');
    console.log('   Sales can now be linked to these business centers via assetId field');

  } catch (error) {
    console.error('❌ Error creating business assets:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createBusinessAssets();