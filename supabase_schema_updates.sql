-- Add order_index to products (Saved Profiles)
ALTER TABLE products ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Create template_folders table
CREATE TABLE IF NOT EXISTS template_folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies for template_folders
ALTER TABLE template_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own folders" 
    ON template_folders FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own folders" 
    ON template_folders FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders" 
    ON template_folders FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders" 
    ON template_folders FOR DELETE 
    USING (auth.uid() = user_id);

-- Add folder_id and order_index to templates
ALTER TABLE templates ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES template_folders(id) ON DELETE SET NULL;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
