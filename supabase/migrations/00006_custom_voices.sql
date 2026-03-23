-- Migration: Custom Voices for Voice Design & Voice Cloning
-- Supports Qwen3-TTS voice design (natural language) and voice cloning (reference audio)

-- custom_voices table
CREATE TABLE custom_voices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('designed', 'cloned')),
  voice_provider TEXT NOT NULL DEFAULT 'qwen3',
  -- For designed voices:
  instructions TEXT,
  -- For cloned voices:
  ref_audio_url TEXT,
  ref_text TEXT,
  -- For cloning consent:
  consent_confirmed BOOLEAN DEFAULT false,
  -- Metadata:
  language TEXT DEFAULT 'ko',
  preview_audio_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add custom_voice_id to audiobooks
ALTER TABLE audiobooks ADD COLUMN custom_voice_id UUID REFERENCES custom_voices(id);

-- Indexes
CREATE INDEX idx_custom_voices_user ON custom_voices(user_id);
CREATE INDEX idx_custom_voices_type ON custom_voices(type);

-- RLS
ALTER TABLE custom_voices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own custom voices" ON custom_voices FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own custom voices" ON custom_voices FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own custom voices" ON custom_voices FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own custom voices" ON custom_voices FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger (reuses existing function from earlier migrations)
CREATE TRIGGER update_custom_voices_updated_at BEFORE UPDATE ON custom_voices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
