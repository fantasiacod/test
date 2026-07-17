const http = require('http');

function request(path, method, body, token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        if (token) options.headers['Authorization'] = `Bearer ${token}`;

        const req = http.request(options, (res) => {
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
        console.log('Logging in...');
        let res = await request('/auth/login', 'POST', { username: 'ber500', password: 'password' });
        console.log('Login status:', res.status);
        if (res.status !== 200) return;
        
        const token = JSON.parse(res.body).token;
        console.log('Got token');

        console.log('Fetching /auth/me...');
        res = await request('/auth/me', 'GET', null, token);
        let me = JSON.parse(res.body);
        console.log('GET /auth/me avatarUrl:', me.data.avatarUrl ? 'EXISTS (' + me.data.avatarUrl.substring(0, 30) + ')' : 'MISSING');

        console.log('Updating profile with avatar...');
        res = await request('/auth/profile', 'PUT', {
            full_name: 'Abdulmajeed saeed',
            email: 'sara@enterprise.com',
            phone: '0546758750',
            avatar_url: 'data:image/jpeg;base64,TESTING123'
        }, token);
        console.log('PUT /auth/profile status:', res.status);

        console.log('Fetching /auth/me again...');
        res = await request('/auth/me', 'GET', null, token);
        me = JSON.parse(res.body);
        console.log('GET /auth/me avatarUrl:', me.data.avatarUrl ? 'EXISTS (' + me.data.avatarUrl.substring(0, 30) + ')' : 'MISSING');

    } catch (e) {
        console.error('Error:', e);
    }
}
test();
