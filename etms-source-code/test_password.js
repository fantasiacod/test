const { supabaseAdmin } = require('./server/config/database');

async function test() {
    console.log("Fetching users...");
    let { data: users, error } = await supabaseAdmin.from('users').select('*');
    if (error) {
        console.error("Error fetching:", error);
        return;
    }
    console.log("Users count:", users.length);
    console.log("Users:", users.map(u => ({ username: u.username, status: u.status, role: u.role_id, pass: u.password_hash })));

    if (users.length > 0) {
        const userId = users[0].id;
        console.log("Updating password for", users[0].username);
        let updateRes = await supabaseAdmin.from('users').update({ password_hash: "new_hash_test" }).eq('id', userId);
        console.log("Update result:", updateRes);

        console.log("Fetching again...");
        let fetchRes = await supabaseAdmin.from('users').select('*');
        console.log("Users after update:", fetchRes.data.map(u => ({ username: u.username, status: u.status })));
    }
}
test();
