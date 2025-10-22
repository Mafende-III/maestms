#!/usr/bin/env node

const PRODUCTION_URL = 'http://jso8o40kcgws0kck0ookg0sc.31.220.17.127.sslip.io';

async function testAuth() {
  try {
    console.log('Testing authentication...');

    // Step 1: Try to access the assets endpoint to see if it requires auth
    console.log('\n1. Testing assets endpoint without auth...');
    const testResponse = await fetch(`${PRODUCTION_URL}/api/assets`);
    console.log('Status:', testResponse.status);

    if (testResponse.status === 401) {
      console.log('✅ Endpoint properly requires authentication');
    }

    // Step 2: Check CSRF token
    console.log('\n2. Getting CSRF token...');
    const csrfResponse = await fetch(`${PRODUCTION_URL}/api/auth/csrf`);
    const csrfData = await csrfResponse.json();
    console.log('CSRF token:', csrfData.csrfToken);

    // Step 3: Try authentication with CSRF
    console.log('\n3. Attempting authentication...');
    const authResponse = await fetch(`${PRODUCTION_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'admin@mafende.com',
        password: 'Admin123!',
        csrfToken: csrfData.csrfToken,
        callbackUrl: PRODUCTION_URL,
        redirect: 'false'
      }).toString()
    });

    console.log('Auth status:', authResponse.status);
    console.log('Auth headers:', [...authResponse.headers.entries()]);

    if (authResponse.status === 200) {
      const cookies = authResponse.headers.get('set-cookie');
      console.log('Got cookies:', cookies);

      // Step 4: Test authenticated request
      console.log('\n4. Testing authenticated request...');
      const authenticatedResponse = await fetch(`${PRODUCTION_URL}/api/assets`, {
        headers: {
          'Cookie': cookies || ''
        }
      });

      console.log('Authenticated request status:', authenticatedResponse.status);
      if (authenticatedResponse.ok) {
        const data = await authenticatedResponse.json();
        console.log('✅ Authentication successful! Assets:', data.length);
      } else {
        console.log('❌ Still unauthorized');
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAuth();