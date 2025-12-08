-- Migration: create channels table for groups
-- Channels can be text, voice, or video channels within a group

-- Create channels table
CREATE TABLE IF NOT EXISTS public.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'voice', 'video')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_channels_group ON public.channels(group_id);
CREATE INDEX IF NOT EXISTS idx_channels_type ON public.channels(type);

-- Enable RLS
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- Channels RLS Policies
-- Anyone can view channels in groups they can see
DROP POLICY IF EXISTS "channels_select_all" ON public.channels;
CREATE POLICY "channels_select_view_own_groups" ON public.channels
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = channels.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- Authenticated users can create channels if they are the group owner
DROP POLICY IF EXISTS "channels_insert_owner" ON public.channels;
CREATE POLICY "channels_insert_owner" ON public.channels
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = group_id AND owner_id = auth.uid()
    )
  );

-- Group owners can update channels
DROP POLICY IF EXISTS "channels_update_owner" ON public.channels;
CREATE POLICY "channels_update_owner" ON public.channels
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = group_id AND owner_id = auth.uid()
    )
  );

-- Group owners can delete channels
DROP POLICY IF EXISTS "channels_delete_owner" ON public.channels;
CREATE POLICY "channels_delete_owner" ON public.channels
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = group_id AND owner_id = auth.uid()
    )
  );

-- Create channel_messages table for text channel messages
CREATE TABLE IF NOT EXISTS public.channel_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for channel messages
CREATE INDEX IF NOT EXISTS idx_channel_messages_channel ON public.channel_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_messages_created ON public.channel_messages(created_at DESC);

-- Enable RLS for channel messages
ALTER TABLE public.channel_messages ENABLE ROW LEVEL SECURITY;

-- Channel messages RLS policies
DROP POLICY IF EXISTS "channel_messages_select_all" ON public.channel_messages;
CREATE POLICY "channel_messages_select_group_member" ON public.channel_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.channels c
      JOIN public.group_members gm ON c.group_id = gm.group_id
      WHERE c.id = channel_id AND gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "channel_messages_insert_auth" ON public.channel_messages;
CREATE POLICY "channel_messages_insert_group_member" ON public.channel_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1
      FROM public.channels c
      JOIN public.group_members gm ON c.group_id = gm.group_id
      WHERE c.id = channel_id AND gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "channel_messages_delete_sender" ON public.channel_messages;
CREATE POLICY "channel_messages_delete_group_member" ON public.channel_messages
  FOR DELETE USING (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1
      FROM public.channels c
      JOIN public.group_members gm ON c.group_id = gm.group_id
      WHERE c.id = channel_id AND gm.user_id = auth.uid()
    )
  );

-- Function to update channels updated_at
CREATE OR REPLACE FUNCTION public.update_channels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS on_channel_updated ON public.channels;
CREATE TRIGGER on_channel_updated
  BEFORE UPDATE ON public.channels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_channels_updated_at();
