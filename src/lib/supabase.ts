import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ptomokwxhpptnjlzxyxh.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0b21va3d4aHBwdG5qbHp4eXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMzMwNjIsImV4cCI6MjEwNTgwOTA2Mn0.b7jegj84937es8kHeKjkMIJGiMv2cB27GOcpXYiFULY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Required for React Native
  },
});
