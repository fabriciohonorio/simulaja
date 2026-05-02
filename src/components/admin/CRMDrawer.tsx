import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  Search, 
  X, 
  Phone, 
  MapPin, 
  Package, 
  Save, 
  ArrowRight
} from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface Lead {
  id: string;
  nome: string;
  celular: string;
  cidade: string;
  tipo_consorcio: string;
  valor_credito: number | null;
  status: string | null;
  updated_at: string | null;
}

interface CRMDrawerProps {
  onLoadLead: (lead: any) => void;
  onSaveSim: (leadId: string) => Promise<void>;
}

export function CRMDrawer({ onLoadLead, onSaveSim }: CRMDrawerProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchLeads();
    }
  }, [isOpen]);

  async function fetchLeads() {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("id, nome, celular, cidade, tipo_consorcio, valor_credito, status, updated_at")
      .order("updated_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar leads");
    } else {
      setLeads(data || []);
    }
    setLoading(false);
  }

  const filteredLeads = leads.filter(l => 
    (l.nome?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (l.celular || "").includes(search)
  );

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl z-50 bg-[#0f2044] hover:bg-[#1a2f5a] border-2 border-[#f47920] group flex items-center justify-center transition-all active:scale-95"
      >
        <Users className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 bg-[#f47920] text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-[#0f2044]">
          {leads.length}
        </span>
      </button>

      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent className="h-[90vh] bg-white border-t-4 border-[#f47920]">
          <div className="mx-auto w-full max-w-lg flex flex-col h-full overflow-hidden">
            <DrawerHeader className="border-b border-gray-100 pb-4 shrink-0">
              <div className="flex items-center justify-between">
                <DrawerTitle className="text-xl font-black text-[#0f2044] tracking-tighter uppercase">
                  O ESPECIALISTA CONSÓRCIO
                </DrawerTitle>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="w-6 h-6" />
                </Button>
              </div>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Pesquisar por nome ou celular..."
                  className="pl-10 rounded-full bg-gray-50 border-gray-200"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </DrawerHeader>

            <ScrollArea className="flex-1 px-4 py-2">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f47920]" />
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="text-center py-10 text-gray-400 font-medium">
                  Nenhum lead encontrado.
                </div>
              ) : (
                <div className="grid gap-3 py-2">
                  {filteredLeads.map((lead) => (
                    <div 
                      key={lead.id}
                      className="group bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-gray-200 transition-all cursor-pointer"
                      onClick={() => {
                        onLoadLead(lead);
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-[#0f2044] flex items-center justify-center text-white font-bold text-sm">
                            {(lead.nome || "U").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-[#0f2044] truncate">{lead.nome || "Sem nome"}</h4>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {lead.celular}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-wider shrink-0 ${
                          lead.status === 'fechado' ? 'bg-green-50 text-green-700 border-green-200' :
                          lead.status === 'novo_lead' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-gray-50 text-gray-600'
                        }`}>
                          {lead.status?.replace('_', ' ') || 'Novo'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-500 mb-3 bg-gray-50 p-2 rounded-lg">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#f47920]" /> {lead.cidade || 'Não inf.'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Package className="w-3 h-3 text-[#f47920]" /> {lead.tipo_consorcio || 'Não inf.'}
                        </div>
                        {lead.valor_credito && (
                          <div className="col-span-2 font-bold text-[#16a34a] mt-1">
                            💰 R$ {lead.valor_credito.toLocaleString('pt-BR')}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="flex-1 text-[10px] h-8 bg-gray-50 hover:bg-gray-100 text-[#0f2044] font-bold"
                          onClick={(e) => {
                            e.stopPropagation();
                            onLoadLead(lead);
                            setIsOpen(false);
                          }}
                        >
                          <ArrowRight className="w-3 h-3 mr-1" /> CARREGAR
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 text-[10px] h-8 bg-[#0f2044] hover:bg-[#1a2f5a] text-white font-bold"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSaveSim(lead.id);
                          }}
                        >
                          <Save className="w-3 h-3 mr-1" /> SALVAR SIM
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
