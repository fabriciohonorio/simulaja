-- ATENÇÃO: Verifique qual é a cota incorreta antes de rodar.
-- Este script vai apagar a via do William que está com a cota 0228.
-- Se a cota incorreta for a 0896, altere o número 0228 para 0896 antes de rodar.

DELETE FROM carteira
WHERE nome ILIKE '%WILLIAM DE FREITAS%' AND cota LIKE '%0228%';
