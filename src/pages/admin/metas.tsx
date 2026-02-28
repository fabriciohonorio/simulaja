
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Metas() {
  const [meta, setMeta] = useState<number>(0);
  const [input, setInput] = useState<string>("0");

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const { data } = await supabase
      .from("meta")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (data) {
      setMeta(data.meta_anual ?? 0);
      setInput(String(data.meta_anual ?? 0));
    }
  }

  async function salvar() {
    const valor = parseFloat(input);
    if (isNaN(valor)) return;

    await supabase
      .from("meta")
      .upsert(
        { id: 1, meta_anual: valor },
        { onConflict: "id" }
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
