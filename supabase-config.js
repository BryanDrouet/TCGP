// Supabase Configuration
// Replace these values with your actual Supabase project credentials from:
// https://supabase.com/dashboard/project/ilcgojhgforbqiyvlwvb/settings/api

export const SUPABASE_CONFIG = {
    url: 'https://ilcgojhgforbqiyvlwvb.supabase.co',
    anonKey: 'YOUR_SUPABASE_ANON_KEY_HERE' // Get this from Supabase Dashboard > Settings > API
};

// IMPORTANT SECURITY NOTE:
// 1. Never commit your real anon key to version control
// 2. Consider adding supabase-config.js to .gitignore after initial setup
// 3. For production, use environment variables or a secure config management solution
// 
// To protect your API key:
// - Add supabase-config.js to .gitignore: echo "supabase-config.js" >> .gitignore
// - Create a template: cp supabase-config.js supabase-config.js.template
// - Commit only the template with placeholder values
