// Supabase Configuration
// Replace these values with your actual Supabase project credentials from:
// https://supabase.com/dashboard/project/ilcgojhgforbqiyvlwvb/settings/api

export const SUPABASE_CONFIG = {
    url: 'https://egmacofctncimeovofel.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnbWFjb2ZjdG5jaW1lb3ZvZmVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NTUyNTksImV4cCI6MjA4MTUzMTI1OX0.YxUb3wLDs_1p5kkjU8V_Zk_FaktMKBIWBRdcsdC0Gb0 ' // Get this from Supabase Dashboard > Settings > API
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
