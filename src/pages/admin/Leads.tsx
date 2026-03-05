import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, MessageCircle, ArrowUpDown } from "lucide-react";

interface Lead {
  id: string;
  nome: string;
  email: string;
  celular: string;
  cidade: string;
  tipo_consorcio: string;
  valor_credito: number;
  prazo_meses: number;
  status: string | null;
  created_at: string | null;
}

const STATUS_OPTIONS = [
  { value: "all", label: "Todos os status" },
  { value: "novo", label: "Novo" },
  { value: "contatado", label: "Contatado" },
  { value: "proposta_enviada", label: "Proposta Enviada" },
  { value: "em_negociacao", label: "Em Negociação" },
  { value: "fechado", label: "Fechado" },
];

const TIPO_OPTIONS = [
  { value: "all", label: "Todos os tipos" },
  { value: "imovel", label: "Imóvel" },
  { value: "veiculo", label: "Veículo" },
  { value: "moto", label: "Moto" },
  { value: "pesados", label: "Pesados" },
  { value: "agricolas", label: "Agrícolas" },
  { value: "investimento", label: "Investimento" },
];

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

const openWhatsApp = (lead: Lead) => {
  const msg = encodeURIComponent(
    `Olá ${lead.nome}! Sobre sua simulação de ${lead.tipo_consorcio} no valor de ${formatCurrency(Number(lead.valor_credito))}, gostaria de conversar com você.`
  );
  const phone = lead.celular.replace(/\D/g, "");
  window.open(`https://wa.me/55${phone}?text=${msg}`, "_blank");
};

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tipoFilter, setTipoFilter] = useState("all");
  const [cidadeFilter, setCidadeFilter] = useState("");
  const [sortKey, setSortKey] = useState<keyof Lead>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    supabase.from("leads").select("*").then(({ data }) => {
      setLeads(data ?? []);
      setLoading(false);
    });
  }, []);

  const toggleSort = (key: keyof Lead) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    let result = [...leads];

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.nome.toLowerCase().includes(s) ||
          l.email.toLowerCase().includes(s) ||
          l.celular.includes(s)
      );
    }
    if (statusFilter !== "all") result = result.filter((l) => (l.status ?? "novo") === statusFilter);
    if (tipoFilter !== "all") result = result.filter((l) => l.tipo_consorcio === tipoFilter);
    if (cidadeFilter) result = result.filter((l) => l.cidade.toLowerCase().includes(cidadeFilter.toLowerCase()));

    result.sort((a, b) => {
      const aVal = a[sortKey] ?? "";
      const bVal = b[sortKey] ?? "";
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [leads, search, statusFilter, tipoFilter, cidadeFilter, sortKey, sortDir]);

  const exportCSV = () => {
    const headers = ["Nome", "Email", "Celular", "Cidade", "Tipo", "Valor Crédito", "Prazo", "Status", "Data"];
    const rows = filtered.map((l) => [
      l.nome, l.email, l.celular, l.cidade, l.tipo_consorcio,
      l.valor_credito, l.prazo_meses, l.status ?? "novo",
      l.created_at?.slice(0, 10) ?? "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads.csv";
    a.click();
  };

  const SortHeader = ({ label, field }: { label: string; field: keyof Lead }) => (
    <th
      className="px-3 py-2 text-left text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground whitespace-nowrap"
      onClick={() => toggleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </span>
    </th>
  );

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Leads</h1>
        <Button onClick={exportCSV} variant="outline" size="sm" className="shrink-0">
          <Download className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Exportar CSV</span>
        </Button>
      </div>

      {/* Filters — full width, wrapping grid on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <Input
          placeholder="Buscar nome, email, telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:col-span-2 lg:col-span-1"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TIPO_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Filtrar cidade..."
          value={cidadeFilter}
          onChange={(e) => setCidadeFilter(e.target.value)}
        />
      </div>

      {/* Responsive Lead List */}
      <div className="rounded-lg border border-border bg-card">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <SortHeader label="Nome" field="nome" />
                <SortHeader label="Email" field="email" />
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Celular</th>
                <SortHeader label="Cidade" field="cidade" />
                <SortHeader label="Tipo" field="tipo_consorcio" />
                <SortHeader label="Valor" field="valor_credito" />
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Prazo</th>
                <SortHeader label="Status" field="status" />
                <SortHeader label="Data" field="created_at" />
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-muted/50">
                  <td className="px-3 py-2 font-medium whitespace-nowrap">{l.nome}</td>
                  <td className="px-3 py-2 text-muted-foreground">{l.email}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{l.celular}</td>
                  <td className="px-3 py-2">{l.cidade}</td>
                  <td className="px-3 py-2 capitalize">{l.tipo_consorcio}</td>
                  <td className="px-3 py-2 font-medium whitespace-nowrap">{formatCurrency(Number(l.valor_credito))}</td>
                  <td className="px-3 py-2">{l.prazo_meses}m</td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                      {(l.status ?? "novo").replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{l.created_at?.slice(0, 10)}</td>
                  <td className="px-3 py-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => openWhatsApp(l)}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden flex flex-col divide-y divide-border">
          {filtered.map((l) => (
            <div key={l.id} className="p-4 space-y-3 active:bg-muted/50">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <h3 className="font-medium truncate">{l.nome}</h3>
                  <p className="text-xs text-muted-foreground">{l.cidade}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize shrink-0">
                  {(l.status ?? "novo").replace("_", " ")}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Valor</p>
                  <p className="font-medium text-primary">{formatCurrency(Number(l.valor_credito))}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tipo / Prazo</p>
                  <p className="capitalize">{l.tipo_consorcio} · {l.prazo_meses}m</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Celular</p>
                  <p>{l.celular}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Data</p>
                  <p>{l.created_at?.slice(0, 10)}</p>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="w-full text-green-600 border-green-200 hover:bg-green-50 gap-2"
                onClick={() => openWhatsApp(l)}
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </Button>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-10 text-center text-muted-foreground">Nenhum lead encontrado.</div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} leads encontrados</p>
    </div>
  );
}
