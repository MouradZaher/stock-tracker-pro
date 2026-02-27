import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdmin() {
    console.log('Checking for admin user...');
    const { data, error } = await supabase
        .from('profiles')
        .select('id, username, role')
        .eq('username', 'admin')
        .single();

    if (error) {
        console.error('Error fetching admin profile:', error);
        return;
    }

    console.log('Admin user found:', data);
    const adminId = data.id;

    console.log('Fetching positions for admin ID:', adminId);
    const { data: positions, error: posError } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', adminId);

    if (posError) {
        console.error('Error fetching positions:', posError);
        return;
    }

    console.log('Positions found:', JSON.stringify(positions, null, 2));
}

checkAdmin();
