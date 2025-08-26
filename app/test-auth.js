const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAuth() {
  try {
    // Test the password
    const testPassword = 'C@rlos2025';
    console.log('Testing authentication for seller@test.com with password: C@rlos2025\n');
    
    // Get the user
    const user = await prisma.user.findUnique({ 
      where: { email: 'seller@test.com' },
      select: { email: true, password: true, role: true, firstName: true }
    });
    
    if (!user) {
      console.error('User not found!');
      return;
    }
    
    console.log('User found:', user.email, user.firstName, user.role);
    console.log('Password hash in DB:', user.password.substring(0, 30) + '...');
    
    // Test password comparison
    const isValid = await bcrypt.compare(testPassword, user.password);
    console.log('\nPassword verification:', isValid ? '✅ VALID' : '❌ INVALID');
    
    if (!isValid) {
      // Generate a new hash to compare
      const newHash = await bcrypt.hash(testPassword, 10);
      console.log('\nGenerating fresh hash for C@rlos2025...');
      console.log('New hash would be:', newHash.substring(0, 30) + '...');
      
      // Let's also test with the common password
      const commonPassValid = await bcrypt.compare('password123', user.password);
      console.log('\nTesting with password123:', commonPassValid ? '✅ VALID' : '❌ INVALID');
    }
    
    // Test authentication endpoint
    console.log('\nTesting authentication endpoint...');
    const fetch = require('node-fetch');
    
    const response = await fetch('http://localhost:3018/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'seller@test.com',
        password: 'C@rlos2025',
        redirect: false
      })
    });
    
    console.log('Auth endpoint response:', response.status, response.statusText);
    const data = await response.text();
    console.log('Response body:', data);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();