const { createClient } = require('@supabase/supabase-js');
const { config } = require('dotenv');

config(); // Just call config(), don't assign it

const supabase = createClient(
    process.env.SUPABASE_URL, process.env.SUPABASE_KEY
);

async function check() {
    const { data, error } = await supabase.from('cases').select("*");
    if (error) {
        console.error("Connection failed:", error);
    } else {
        console.log("Connection successful! Data:", data);
    }
}

check().catch(console.error);