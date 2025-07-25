// Simple Node.js test for Supabase connection
// Run with: node test-supabase.js

// Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://pllewdnptglldpkuexxt.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsbGV3ZG5wdGdsbGRwa3VleHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyODE2NjksImV4cCI6MjA2ODg1NzY2OX0.5L6wuNlK0qTYNXClxqGfaSWfl87sHmgNKpDOe-DkY9g'

// Test using fetch (built into Node.js 18+)
async function testSupabaseConnection() {
    console.log('🕌 Testing HalalCheck AI Supabase Connection...\n')
    
    try {
        // Test 1: Basic API connectivity
        console.log('1️⃣ Testing API connectivity...')
        const response = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?select=count`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'count=exact'
            }
        })
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        console.log('✅ API connectivity: SUCCESS')
        console.log(`   Status: ${response.status}`)
        console.log(`   Headers: ${response.headers.get('content-range') || 'No count header'}`)
        
        // Test 2: Check all tables exist
        console.log('\n2️⃣ Testing table access...')
        const tables = [
            'user_profiles',
            'analyses', 
            'uploaded_files',
            'usage_logs',
            'notifications',
            'api_keys'
        ]
        
        for (const table of tables) {
            try {
                const tableResponse = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=count&limit=0`, {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Prefer': 'count=exact'
                    }
                })
                
                if (tableResponse.ok) {
                    console.log(`   ✅ ${table}: OK`)
                } else {
                    console.log(`   ❌ ${table}: Error ${tableResponse.status}`)
                }
            } catch (err) {
                console.log(`   ❌ ${table}: ${err.message}`)
            }
        }
        
        // Test 3: Test storage
        console.log('\n3️⃣ Testing storage access...')
        const storageResponse = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        })
        
        if (storageResponse.ok) {
            const buckets = await storageResponse.json()
            console.log(`   ✅ Storage accessible: ${buckets.length} buckets`)
            buckets.forEach(bucket => {
                console.log(`      - ${bucket.name} (${bucket.public ? 'public' : 'private'})`)
            })
        } else {
            console.log(`   ❌ Storage: Error ${storageResponse.status}`)
        }
        
        console.log('\n🎉 Overall: Supabase setup is working!')
        console.log('\n📋 Next steps:')
        console.log('   1. Run storage setup SQL if you see 0 buckets')
        console.log('   2. Set up Google OAuth if needed')
        console.log('   3. Ready for Next.js integration!')
        
    } catch (error) {
        console.error('❌ Connection failed:', error.message)
        console.log('\n🔧 Troubleshooting:')
        console.log('   1. Check your SUPABASE_URL and SUPABASE_ANON_KEY')
        console.log('   2. Make sure your project is active in Supabase')
        console.log('   3. Verify RLS policies are not blocking access')
    }
}

// Run the test
testSupabaseConnection()