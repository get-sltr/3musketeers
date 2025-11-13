-- Add random locations to existing users (Los Angeles area)
UPDATE profiles 
SET 
  latitude = 34.0522 + (random() * 0.1 - 0.05),
  longitude = -118.2437 + (random() * 0.1 - 0.05)
WHERE latitude IS NULL OR longitude IS NULL;
