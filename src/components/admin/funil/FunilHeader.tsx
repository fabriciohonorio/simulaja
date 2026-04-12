import React from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ADMINISTRADORAS } from "@/hooks/useFunil";

export function FunilHeader({ state }: { state: any }) {
  const {
    administradoraFilter,
    setAdministradoraFilter,
    isWideView,
    setIsWideView,
    handleGenerateReport,
  } = state;

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div className="flex items-center justify-between w-full md:w-auto">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Funil de Vendas</h1>
        <div className="flex md:hidden items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGenerateReport}
            className="h-9 px-3 border-blue-200 text-blue-600 hover:bg-blue-50 shadow-sm"
          >
            <FileText className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
        <Tabs value={administradoraFilter} onValueChange={setAdministradoraFilter} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-2 sm:flex sm:w-auto h-auto">
            <TabsTrigger value="todos" className="text-[10px] sm:text-xs py-2 px-4">Todos</TabsTrigger>
            {ADMINISTRADORAS.map(admin => (
              <TabsTrigger key={admin} value={admin} className="text-[10px] sm:text-xs py-2 px-4">{admin}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="hidden md:flex items-center bg-muted/30 p-1 rounded-lg border border-border shrink-0">
          <button
            onClick={() => setIsWideView(false)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${!isWideView ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Padrão
          </button>
          <button
            onClick={() => setIsWideView(true)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${isWideView ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Wide
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 shrink-0">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGenerateReport}
            className="border-blue-200 text-blue-600 hover:bg-blue-50 shadow-sm"
          >
            <FileText className="h-4 w-4 mr-2" />
            Relatório PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
