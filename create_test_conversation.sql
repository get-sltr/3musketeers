-- First, let's see what users exist
SELECT id, display_name, email FROM profiles LIMIT 5;

-- To create a test conversation, run this after getting user IDs:
-- INSERT INTO conversations (user1_id, user2_id) 
-- VALUES ('user-id-1', 'user-id-2');
