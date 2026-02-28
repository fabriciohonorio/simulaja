
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Metas() {
  const [meta, setMeta] = useState<number>(0);
  const [input, setInput] = useState<string>("0");

  useEffect(() => {
    carregar();
  }, []);

  async function salvar() {
  const valor = parseFloat(input);
  if (isNaN(valor)) return;

  const anoAtual = new Date().getFullYear();

  await supabase
    .from("meta")
    .upsert(
      {
        ano: anoAtual,
        meta_anual: valor,
      },
      { onConflict: "ano" }
    );

  setMeta(valor);
}
  return (
    <div style={{ padding: 40 }}>
      <h1>Meta Anual</h1>

      <input
        type="number"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button onClick={salvar}>Salvar</button>

      <h2>Valor atual: {meta}</h2>
    </div>
  );
}
