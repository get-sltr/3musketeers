-- Add message_type and metadata columns to messages table if they don't exist
-- Then add CHECK constraint for message types
-- Supports: shared_profile, shared_location, shared_album, video

-- Add message_type column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'messages' 
    AND column_name = 'message_type'
  ) THEN
    ALTER TABLE public.messages 
    ADD COLUMN message_type TEXT DEFAULT 'text';
  END IF;
END $$;

-- Add metadata column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'messages' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.messages 
    ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Drop existing constraint if it exists
ALTER TABLE public.messages 
DROP CONSTRAINT IF EXISTS messages_message_type_check;

-- Add new constraint with all supported message types
ALTER TABLE public.messages 
ADD CONSTRAINT messages_message_type_check 
CHECK (message_type IN (
  'text',
  'image',
  'file',
  'video',
  'shared_profile',
  'shared_location',
  'shared_album'
));

