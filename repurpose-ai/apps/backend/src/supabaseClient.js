"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl) {
    throw new Error('SUPABASE_URL is missing.\nCheck that your .env file exists in apps/backend and contains SUPABASE_URL=...');
}
if (!supabaseAnonKey) {
    throw new Error('SUPABASE_ANON_KEY is missing.\nCheck that your .env file exists in apps/backend and contains SUPABASE_ANON_KEY=...');
}
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey);
