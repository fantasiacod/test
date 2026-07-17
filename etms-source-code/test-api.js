require('dotenv').config();
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('./server/config/database');

async function run() {
    // 1. Get an admin user
    const { data: users } = await supabaseAdmin.from('users').select('id, username').limit(2);
    if (!users || users.length === 0) {
        console.log("No users found"); return;
    }
    const admin = users[0];
    const target = users[1] || users[0];
    
    console.log("Admin:", admin.username);
    console.log("Target:", target.username);

    // 2. Generate token
    const token = jwt.sign({ userId: admin.id, role: 'admin' }, process.env.JWT_SECRET || 'super-secret-key-change-me', { expiresIn: '1d' });

    // 3. GET /api/users
    const res1 = await fetch('http://localhost:3000/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data1 = await res1.json();
    console.log("Users before:", data1.data?.map(u => u.username).join(', '));

    // 4. Reset password
    const res2 = await fetch(`http://localhost:3000/api/users/${target.id}/reset-password`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: 'newpassword123' })
    });
    console.log("Reset result:", await res2.json());

    // 5. GET /api/users again
    const res3 = await fetch('http://localhost:3000/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data3 = await res3.json();
    console.log("Users after:", data3.data?.map(u => u.username).join(', '));
}
run();
