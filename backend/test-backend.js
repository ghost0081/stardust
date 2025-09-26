const { testConnection } = require('./config/database');

async function testBackend() {
  console.log('🧪 Testing Space Explorer Backend...');
  console.log('=====================================');

  try {
    // Test database connection
    console.log('1. Testing database connection...');
    const dbConnected = await testConnection();
    
    if (dbConnected) {
      console.log('✅ Database connection successful');
    } else {
      console.log('❌ Database connection failed');
      console.log('Please run the SQL schema in your Supabase dashboard first.');
      return;
    }

    // Test environment variables
    console.log('\n2. Testing environment variables...');
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY', 
      'SUPABASE_SERVICE_ROLE_KEY',
      'JWT_SECRET'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length === 0) {
      console.log('✅ All required environment variables are set');
    } else {
      console.log('❌ Missing environment variables:', missingVars.join(', '));
      return;
    }

    // Test Supabase URL format
    console.log('\n3. Testing Supabase configuration...');
    const supabaseUrl = process.env.SUPABASE_URL;
    if (supabaseUrl && supabaseUrl.includes('supabase.co')) {
      console.log('✅ Supabase URL format is correct');
    } else {
      console.log('❌ Invalid Supabase URL format');
      return;
    }

    console.log('\n🎉 Backend is ready!');
    console.log('\nNext steps:');
    console.log('1. Start the server: npm run dev');
    console.log('2. Test API: curl http://localhost:5000/health');
    console.log('3. Register a user: curl -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d \'{"name":"Test User","email":"test@example.com","password":"TestPass123!"}\'');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBackend();
