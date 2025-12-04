-- Create generations table
CREATE TABLE IF NOT EXISTS generations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    image_url TEXT NOT NULL,
    prompt TEXT,
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own generations" 
    ON generations FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own generations" 
    ON generations FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generations" 
    ON generations FOR DELETE 
    USING (auth.uid() = user_id);
