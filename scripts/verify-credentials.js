#!/usr/bin/env node

const PRODUCTION_URL = 'http://jso8o40kcgws0kck0ookg0sc.31.220.17.127.sslip.io';

async function verifyCredentials() {
  try {
    console.log('🔍 Verifying admin credentials on production...\n');

    // Check if admin user exists
    console.log('1. Checking if admin user creation endpoint exists...');

    // Try the seed endpoint to create admin if it doesn't exist
    const seedResponse = await fetch(`${PRODUCTION_URL}/api/seed-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('Seed response status:', seedResponse.status);

    if (seedResponse.ok) {
      const seedData = await seedResponse.json();
      console.log('Seed response:', seedData);
    } else {
      const errorText = await seedResponse.text();
      console.log('Seed error:', errorText);
    }

    // Now let's try a manual signin attempt using form data like a browser would
    console.log('\n2. Testing browser-like signin...');

    // First get CSRF token
    const csrfResponse = await fetch(`${PRODUCTION_URL}/api/auth/csrf`);
    const csrfData = await csrfResponse.json();
    console.log('CSRF token obtained:', csrfData.csrfToken.substring(0, 10) + '...');

    // Try signin with form data exactly like browser
    const signinResponse = await fetch(`${PRODUCTION_URL}/api/auth/signin/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': `${PRODUCTION_URL}/login`,
        'Origin': PRODUCTION_URL
      },
      body: new URLSearchParams({
        email: 'admin@mafende.com',
        password: 'Admin123!',
        csrfToken: csrfData.csrfToken,
        callbackUrl: `${PRODUCTION_URL}/dashboard`,
        redirect: 'false'
      }).toString(),
      redirect: 'manual'
    });

    console.log('Signin status:', signinResponse.status);
    console.log('Signin headers:', Object.fromEntries(signinResponse.headers.entries()));

    // Check the response
    if (signinResponse.status === 302) {
      console.log('✅ Got redirect - likely successful authentication');
      const location = signinResponse.headers.get('location');
      const cookies = signinResponse.headers.get('set-cookie');
      console.log('Redirect location:', location);
      console.log('Set cookies:', cookies ? 'Yes' : 'No');

      if (cookies) {
        console.log('Cookie details:', cookies);
        return cookies;
      }
    } else {
      const responseText = await signinResponse.text();
      console.log('Response body:', responseText.substring(0, 200) + '...');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }

  return null;
}

verifyCredentials().then(cookies => {
  if (cookies) {
    console.log('\n🎉 Authentication successful! Ready for import.');
  } else {
    console.log('\n❌ Authentication failed. Check credentials or server status.');
  }
});