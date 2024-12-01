-- Fonction pour nettoyer une chaîne de catégories
CREATE OR REPLACE FUNCTION clean_category(category TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN regexp_replace(
        regexp_replace(
            regexp_replace(
                regexp_replace(
                    regexp_replace(
                        regexp_replace(
                            regexp_replace(category,
                                '[\{\}\[\]"\\]', '', 'g'), -- Enlever les accolades, crochets, guillemets et backslashes
                            '\s+', ' ', 'g'), -- Normaliser les espaces
                        '^\s+|\s+$', '', 'g'), -- Enlever les espaces au début et à la fin
                    '^RSE,?\s*', 'RSE', 'i'), -- Normaliser "RSE"
                'Impact,?\s*', 'Impact', 'i'), -- Normaliser "Impact"
            'Carbone,?\s*', 'Carbone', 'i'), -- Normaliser "Carbone"
        'Design,?\s*', 'Design', 'i'); -- Normaliser "Design"
END;
$$ LANGUAGE plpgsql;

-- Mettre à jour les catégories dans la table entreprises
UPDATE entreprises
SET categorie = clean_category(categorie)
WHERE categorie IS NOT NULL;

-- Mettre à jour les catégories dans la table categories
UPDATE categories
SET name = clean_category(name)
WHERE name IS NOT NULL;
