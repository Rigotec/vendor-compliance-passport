import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dqjhrxkmfutnmqjhidae.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxamhyeGttZnV0bm1xamhpZGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MjMzMjcsImV4cCI6MjA5ODk5OTMyN30.o9MYuLuLogngeA13Nj0VG6ryhCvVuB6olqvCDQ35J6c'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)