-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(name, user_id)
);

-- Create index on user_id for better performance
CREATE INDEX IF NOT EXISTS categories_user_id_idx ON categories(user_id);

-- Enable RLS on categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
