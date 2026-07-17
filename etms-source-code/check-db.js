const { supabaseAdmin } = require('./server/config/database');
async function checkSettings() {
    const { data, error } = await supabaseAdmin.from('app_settings').select('*');
    console.log("Settings in DB:", data);
}
checkSettings();
