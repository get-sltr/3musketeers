-- Create groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  photo TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_private BOOLEAN DEFAULT false,
  max_members INTEGER DEFAULT 50,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Create group_messages table
CREATE TABLE IF NOT EXISTS public.group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- Groups RLS Policies
-- Anyone can view public groups
DROP POLICY IF EXISTS "Public groups are viewable by everyone" ON public.groups;
CREATE POLICY "Public groups are viewable by everyone"
  ON public.groups FOR SELECT
  USING (is_private = false OR auth.uid() IN (
    SELECT user_id FROM public.group_members WHERE group_id = groups.id
  ));

-- Members can view private groups they belong to
CREATE POLICY "Private groups viewable by members"
  ON public.groups FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM public.group_members WHERE group_id = groups.id
  ));

-- Authenticated users can create groups
CREATE POLICY "Authenticated users can create groups"
  ON public.groups FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Owners can update their groups
CREATE POLICY "Owners can update groups"
  ON public.groups FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Owners can delete their groups
CREATE POLICY "Owners can delete groups"
  ON public.groups FOR DELETE
  USING (auth.uid() = owner_id);

-- Group Members RLS Policies
-- Members can view other members in their groups
CREATE POLICY "Members can view group members"
  ON public.group_members FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM public.group_members gm WHERE gm.group_id = group_members.group_id
  ));

-- Users can join public groups
CREATE POLICY "Users can join public groups"
  ON public.group_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND (
      EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND is_private = false)
      OR auth.uid() IN (SELECT user_id FROM public.group_members WHERE group_id = group_members.group_id AND role IN ('owner', 'admin'))
    )
  );

-- Members can leave groups
CREATE POLICY "Members can leave groups"
  ON public.group_members FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can remove members
CREATE POLICY "Admins can remove members"
  ON public.group_members FOR DELETE
  USING (auth.uid() IN (
    SELECT user_id FROM public.group_members 
    WHERE group_id = group_members.group_id 
    AND role IN ('owner', 'admin')
  ));

-- Group Messages RLS Policies
-- Members can view messages in their groups
CREATE POLICY "Members can view group messages"
  ON public.group_messages FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM public.group_members WHERE group_id = group_messages.group_id
  ));

-- Members can send messages in their groups
CREATE POLICY "Members can send messages"
  ON public.group_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id 
    AND auth.uid() IN (
      SELECT user_id FROM public.group_members WHERE group_id = group_messages.group_id
    )
  );

-- Message senders can delete their own messages
CREATE POLICY "Users can delete their own messages"
  ON public.group_messages FOR DELETE
  USING (auth.uid() = sender_id);

-- Admins can delete any messages in their groups
CREATE POLICY "Admins can delete group messages"
  ON public.group_messages FOR DELETE
  USING (auth.uid() IN (
    SELECT user_id FROM public.group_members 
    WHERE group_id = group_messages.group_id 
    AND role IN ('owner', 'admin')
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_groups_owner ON public.groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_groups_location ON public.groups(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_group ON public.group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_created ON public.group_messages(created_at DESC);

-- Create function to auto-add creator as owner
CREATE OR REPLACE FUNCTION public.add_group_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to add owner as member
CREATE TRIGGER on_group_created
  AFTER INSERT ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.add_group_owner();

-- Create function to update group updated_at
CREATE OR REPLACE FUNCTION public.update_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at
CREATE TRIGGER on_group_updated
  BEFORE UPDATE ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_groups_updated_at();
