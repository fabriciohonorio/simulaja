-- Atualiza o valor do crédito do Onizon para R$ 110.000
UPDATE carteira
SET valor_credito = 110000
WHERE nome ILIKE '%ONIZON%';

UPDATE leads
SET valor_credito = 110000
WHERE nome ILIKE '%ONIZON%';
