-- PRODUCTION DATABASE SCHEMA
-- Run this SQL in your Supabase SQL Editor
-- This replaces all previous schema files

-- ==============================================
-- 1. PROFILES TABLE (for Supabase Auth)
-- ==============================================

-- Create profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ==============================================
-- 2. URLS TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS urls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  original_url TEXT NOT NULL,
  short_code VARCHAR(20) UNIQUE NOT NULL,
  title VARCHAR(255),
  description TEXT,
  clicks INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  form_id UUID,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on urls
ALTER TABLE urls ENABLE ROW LEVEL SECURITY;

-- URLs policies
CREATE POLICY "Users can manage own URLs" ON urls
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public can read active URLs" ON urls
  FOR SELECT USING (is_active = TRUE);

-- ==============================================
-- 3. FORMS TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS forms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  fields JSONB NOT NULL DEFAULT '[]',
  template_type VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on forms
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;

-- Forms policies
CREATE POLICY "Users can manage own forms" ON forms
  FOR ALL USING (auth.uid() = user_id);

-- ==============================================
-- 4. FORM_SUBMISSIONS TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE NOT NULL,
  url_id UUID REFERENCES urls(id) ON DELETE CASCADE NOT NULL,
  submission_data JSONB NOT NULL DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on form_submissions
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Form submissions policies
CREATE POLICY "Users can view submissions for own forms" ON form_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM forms f 
      WHERE f.id = form_id AND auth.uid() = f.user_id
    )
  );

CREATE POLICY "Public can submit forms" ON form_submissions
  FOR INSERT WITH CHECK (TRUE);

-- ==============================================
-- 5. ANALYTICS TABLE (Fixed Structure)
-- ==============================================

CREATE TABLE IF NOT EXISTS analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url_id UUID REFERENCES urls(id) ON DELETE CASCADE NOT NULL,
  event_type VARCHAR(50) NOT NULL DEFAULT 'click',
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  country VARCHAR(2),
  city VARCHAR(100),
  device_type VARCHAR(50),
  browser VARCHAR(50),
  os VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on analytics
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Analytics policies
CREATE POLICY "Users can view analytics for own URLs" ON analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM urls u 
      WHERE u.id = url_id AND auth.uid() = u.user_id
    )
  );

CREATE POLICY "Public can insert analytics" ON analytics
  FOR INSERT WITH CHECK (TRUE);

-- ==============================================
-- 6. ADD FOREIGN KEY CONSTRAINTS
-- ==============================================

-- Add foreign key for forms in urls table
ALTER TABLE urls 
ADD CONSTRAINT urls_form_id_fkey 
FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE SET NULL;

-- ==============================================
-- 7. INDEXES FOR PERFORMANCE
-- ==============================================

-- Critical indexes for performance
CREATE INDEX IF NOT EXISTS idx_urls_short_code ON urls(short_code);
CREATE INDEX IF NOT EXISTS idx_urls_user_id ON urls(user_id);
CREATE INDEX IF NOT EXISTS idx_urls_is_active ON urls(is_active);
CREATE INDEX IF NOT EXISTS idx_analytics_url_id ON analytics(url_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_url_id ON form_submissions(url_id);

-- ==============================================
-- 8. TRIGGERS FOR UPDATED_AT
-- ==============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_urls_updated_at 
    BEFORE UPDATE ON urls 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forms_updated_at 
    BEFORE UPDATE ON forms 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 9. GRANT PERMISSIONS
-- ==============================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Anonymous users can only read active URLs and insert analytics/submissions
GRANT SELECT ON urls TO anon;
GRANT INSERT ON analytics TO anon;
GRANT INSERT ON form_submissions TO anon;

-- ==============================================
-- 10. STORAGE BUCKET (Optional - for avatars)
-- ==============================================

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Avatar storage policies
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ==============================================
-- COMPLETION MESSAGE
-- ==============================================

-- This schema is now production-ready with:
-- ✅ Proper UUID primary keys
-- ✅ Supabase Auth integration
-- ✅ Row Level Security enabled
-- ✅ Performance indexes
-- ✅ Proper foreign key constraints
-- ✅ Updated timestamp triggers
-- ✅ Correct table names matching code expectations