-- Créer la table zones si elle n'existe pas
CREATE TABLE IF NOT EXISTS zones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT,
    position_x FLOAT,
    position_y FLOAT,
    width FLOAT,
    height FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL
);
