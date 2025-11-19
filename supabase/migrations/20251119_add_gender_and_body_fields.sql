-- Add gender identity, looking for, and body type fields
-- Inspired by Grindr and Sniffies for inclusive options

-- ============================================
-- GENDER IDENTITY & PREFERENCES
-- ============================================

-- Gender identity (what you identify as)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS gender_identity TEXT 
DEFAULT 'cis_man'
CHECK (gender_identity IN (
  'cis_man',
  'trans_man', 
  'non_binary',
  'gender_fluid',
  'other'
));

-- Looking for (who you're interested in meeting)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS looking_for TEXT[] DEFAULT ARRAY['men'];

-- Valid options: 'men', 'trans_men', 'non_binary', 'everyone'

-- ============================================
-- BODY TYPE
-- ============================================

-- Body type with Grindr/Sniffies standard options
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS body_type TEXT
CHECK (body_type IN (
  'athletic',
  'average',
  'bear',
  'cub',
  'husky',
  'jock',
  'muscle',
  'otter',
  'slim',
  'stocky',
  'thick',
  'dad_bod'
));

-- ============================================
-- INDEXES FOR FILTERING
-- ============================================

-- Index for searching by gender identity
CREATE INDEX IF NOT EXISTS idx_profiles_gender_identity
ON profiles(gender_identity);

-- Index for searching by looking_for (GIN for array matching)
CREATE INDEX IF NOT EXISTS idx_profiles_looking_for
ON profiles USING GIN(looking_for);

-- Index for body type filtering
CREATE INDEX IF NOT EXISTS idx_profiles_body_type
ON profiles(body_type);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN profiles.gender_identity IS 'User gender identity: cis_man, trans_man, non_binary, gender_fluid, other';
COMMENT ON COLUMN profiles.looking_for IS 'Array of who user is interested in: men, trans_men, non_binary, everyone';
COMMENT ON COLUMN profiles.body_type IS 'User body type: athletic, average, bear, cub, husky, jock, muscle, otter, slim, stocky, thick, dad_bod';

-- Done!
SELECT '✅ Gender identity, looking for, and body type fields added' as status;
