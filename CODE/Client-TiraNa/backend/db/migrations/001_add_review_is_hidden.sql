-- Migration: Add is_hidden column to reviews table for admin moderation
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_hidden BOOL DEFAULT false;
