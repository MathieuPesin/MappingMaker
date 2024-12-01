-- Récupérer l'ID de l'utilisateur actuel
DO $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Récupérer l'ID de l'utilisateur actuel
    current_user_id := auth.uid();
    
    -- Mettre à jour les entreprises qui n'ont pas de user_id
    UPDATE entreprises
    SET user_id = current_user_id
    WHERE user_id IS NULL;

    -- Mettre à jour les catégories qui n'ont pas de user_id
    UPDATE categories
    SET user_id = current_user_id
    WHERE user_id IS NULL;

    -- Supprimer les entreprises qui n'ont toujours pas de user_id
    DELETE FROM entreprises
    WHERE user_id IS NULL;

    -- Supprimer les catégories qui n'ont toujours pas de user_id
    DELETE FROM categories
    WHERE user_id IS NULL;
END $$;
