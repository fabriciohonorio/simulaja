-- Deleta a entrada duplicada do Onizon na tabela carteira que possui valor zerado
DELETE FROM carteira
WHERE nome ILIKE '%ONIZON%' AND (valor_credito = 0 OR valor_credito IS NULL);
