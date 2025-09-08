-- Migration: create notifications table
-- Run this in your Supabase SQL editor or via migration tooling

CREATE TABLE IF NOT EXISTS public.notifications (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  is_read boolean DEFAULT false,
  created_by text,
  created_at timestamptz DEFAULT now()
);

-- Optional index to speed up unread count queries per user
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id) WHERE (is_read = false);
