import React, { useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Database,
  LayoutGrid,
  FileSpreadsheet,
  Save,
  Trash2,
  Plus,
  Info,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ConsortiumSimulator from "@/components/ConsortiumSimulator";

// Types matching ConsortiumSimulator
type GrupoItem = { grupo: string; credito: number; r50: number; prazo: number };
type Category = { id: string; label: string; icon: string };

export default function SimuladorAdmin() {
  const { profile } = useProfile();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // States for the configuration
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [grupos, setGrupos] = useState<Record<string, GrupoItem[]>>({});

  // Helper state for bulk update
  const [selectedCatForBulk, setSelectedCatForBulk] = useState("");
  const [bulkText, setBulkText] = useState("");

  useEffect(() => {
    if (profile?.organizacao_id) {
      fetchConfig();
    }
  }, [profile?.organizacao_id]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("simulador_config")
        .select("*")
        .eq("organizacao_id", profile?.organizacao_id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setCategorias(data.categorias || []);
        setGrupos(data.grupos || {});
        if (data.categorias?.length > 0) {
          setSelectedCatForBulk(data.categorias[0].id);
        }
      } else {
        // Default initial state if none exists
        const defaultCats = [
          { id: "imovel", label: "Imóvel / Investimento", icon: "🏠" },
          { id: "veiculo", label: "Moto / Veículos / Náutico", icon: "🚗" },
          { id: "pesados", label: "Pesados / Agrícola", icon: "🚛" },
        ];
        setCategorias(defaultCats);
        setGrupos({ imovel: [], veiculo: [], pesados: [] });
        setSelectedCatForBulk("imovel");
      }
    } catch (err) {
      console.error("Erro ao buscar config:", err);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar a configuração do simulador.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!profile?.organizacao_id) return;
    try {
      setSaving(true);
      const { error } = await (supabase as any).from("simulador_config").upsert({
        organizacao_id: profile.organizacao_id,
        categorias,
        grupos,
        updated_at: new Date().toISOString(),
      }, { onConflict: "organizacao_id" });

      if (error) throw error;

      toast({
        title: "Configuração salva!",
        description: "As alterações já estão disponíveis no simulador público.",
      });
    } catch (err) {
      console.error("Erro ao salvar:", err);
      toast({
        title: "Erro ao salvar",
        description: "Verifique se a tabela 'simulador_config' existe no Supabase.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const parseBulk = () => {
    if (!selectedCatForBulk || !bulkText.trim()) return;

    try {
      const lines = bulkText.trim().split("\n");
      const newItems: GrupoItem[] = lines.map((line) => {
        // Excel paste is usually tab-separated
        const cols = line.split("\t");
        if (cols.length < 4) {
          // Try with semicolon or common space if tabs are missing
          const fallbackCols = line.split(/[;|,]/);
          if (fallbackCols.length >= 4) return mapCols(fallbackCols);
          throw new Error("Formato inválido. Esperado (Grupo, Crédito, Parcela, Prazo)");
        }
        return mapCols(cols);
      });

      function mapCols(cols: string[]): GrupoItem {
        const cleanVal = (s: string) =>
          parseFloat(s.replace("R$", "").replace(/\./g, "").replace(",", ".").trim());

        return {
          grupo: cols[0].trim(),
          credito: cleanVal(cols[1]),
          r50: cleanVal(cols[2]),
          prazo: parseInt(cols[3].replace(/\D/g, "")),
        };
      }

      setGrupos((prev) => ({
        ...prev,
        [selectedCatForBulk]: newItems,
      }));

      toast({
        title: "Dados processados!",
        description: `${newItems.length} grupos importados para ${selectedCatForBulk}.`,
      });
      setBulkText("");
    } catch (err: any) {
      toast({
        title: "Erro no processamento",
        description: err.message || "Verifique o formato das colunas no Excel.",
        variant: "destructive",
      });
    }
  };

  const addCategory = () => {
    const id = "cat_" + Date.now();
    setCategorias((prev) => [...prev, { id, label: "Nova Categoria", icon: "⭐" }]);
    setGrupos((prev) => ({ ...prev, [id]: [] }));
  };

  const removeCategory = (id: string) => {
    if (!confirm("Excluir esta categoria e todos os seus grupos?")) return;
    setCategorias((prev) => prev.filter((c) => c.id !== id));
    setGrupos((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutGrid className="text-primary h-6 w-6" />
            Configurador do Simulador
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie categorias e valores do simulador público
          </p>
        </div>
        <Button onClick={saveConfig} disabled={saving} className="gap-2">
          {saving ? <RotateCcw className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
          Salvar Configuração
        </Button>
      </div>

      <Tabs defaultValue="bulk" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
          <TabsTrigger value="categories" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            Categorias
          </TabsTrigger>
          <TabsTrigger value="bulk" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Bulk Update
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2">
            <Database className="h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        {/* Tab: Categories */}
        <TabsContent value="categories" className="space-y-4 pt-4">
          <div className="grid gap-4">
            {categorias.map((cat, i) => (
              <Card key={cat.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 flex items-center justify-center bg-secondary rounded-lg text-2xl">
                    <Input
                      className="w-10 h-10 p-0 text-center border-none shadow-none focus-visible:ring-0"
                      value={cat.icon}
                      onChange={(e) => {
                        const next = [...categorias];
                        next[i].icon = e.target.value;
                        setCategorias(next);
                      }}
                    />
                  </div>
                  <div className="flex-1 grid gap-1.5">
                    <Label className="text-xs text-muted-foreground uppercase">Rótulo</Label>
                    <Input
                      value={cat.label}
                      onChange={(e) => {
                        const next = [...categorias];
                        next[i].label = e.target.value;
                        setCategorias(next);
                      }}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive mt-6"
                    onClick={() => removeCategory(cat.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" className="border-dashed" onClick={addCategory}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Nova Categoria
            </Button>
          </div>
        </TabsContent>

        {/* Tab: Bulk Update */}
        <TabsContent value="bulk" className="space-y-4 pt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                Importar do Excel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Selecionar Categoria para os dados abaixo</Label>
                <div className="flex gap-2 h-10 overflow-x-auto no-scrollbar">
                  {categorias.map((cat) => (
                    <Button
                      key={cat.id}
                      variant={selectedCatForBulk === cat.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCatForBulk(cat.id)}
                      className="whitespace-nowrap"
                    >
                      {cat.icon} {cat.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Cole aqui as linhas do Excel</Label>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Grupo | Crédito | Parcela | Prazo
                  </span>
                </div>
                <Textarea
                  placeholder="Exemplo:&#10;6041	110000	405,9	216"
                  className="min-h-[200px] font-mono text-sm"
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={parseBulk} variant="secondary" className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Processar e Atualizar Localmente
                </Button>
              </div>

              <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="text-xs text-blue-700 space-y-1">
                  <p className="font-bold">Dica de Importação:</p>
                  <p>
                    Copie as colunas do seu Excel na ordem correta e cole aqui. O sistema limpará
                    símbolos como "R$", "." e "," automaticamente.
                  </p>
                  <p className="mt-2">
                    <strong>Total de grupos em {selectedCatForBulk}:</strong>{" "}
                    {grupos[selectedCatForBulk]?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Preview */}
        <TabsContent value="preview" className="pt-4">
          <div className="bg-slate-100 p-4 sm:p-8 rounded-xl border-2 border-dashed border-slate-300">
            <p className="text-center text-xs text-muted-foreground font-bold mb-4 uppercase tracking-widest">
              Live Preview do Simulador
            </p>
            {/* Inject our local state into the simulator for preview */}
            <div className="max-w-7xl mx-auto">
               <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 pointer-events-none opacity-80">
                  <div className="p-4 bg-primary text-white text-center text-xs font-bold uppercase">
                    Modo Visualização (Simule para testar as regras)
                  </div>
                  <ConsortiumSimulator overrideConfig={{ categorias, grupos }} />
               </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
