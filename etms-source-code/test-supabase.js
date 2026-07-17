const https = require('https');

const url = 'uymeeaxtstedfcqlgynw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5bWVlYXh0c3RlZGZjcWxneW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MzkwNzEsImV4cCI6MjA5NTQxNTA3MX0.n3Uwh6TdBb3L0I1VzXbwJVHAb6ctdAhvx8FigPxWG0E';

function request(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: url,
            path: path,
            method: method,
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: data }));
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function test() {
    try {
        console.log('Fetching users...');
        const res = await request('GET', '/rest/v1/users?select=id,username,avatar_url');
        console.log('GET users status:', res.status);
        console.log('GET users response:', res.body);
        
        if (res.status === 200) {
            const users = JSON.parse(res.body);
            if (users.length > 0) {
                const userId = users[0].id;
                console.log(`\nUpdating avatar for user ${users[0].username} (${userId})...`);
                const updateRes = await request('PATCH', `/rest/v1/users?id=eq.${userId}`, {
                    avatar_url: 'data:image/png;base64,TEST'
                });
                console.log('PATCH users status:', updateRes.status);
                console.log('PATCH users response:', updateRes.body);
            }
        }
    } catch (e) {
        console.error('Error:', e);
    }
}
test();
