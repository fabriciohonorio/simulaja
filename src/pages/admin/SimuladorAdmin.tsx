import React from "react";
import ConsortiumSimulator from "@/components/ConsortiumSimulator";

export default function SimuladorAdmin() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Simulador Interno</h1>
        <p className="text-muted-foreground">
          Realize simulações exclusivas da operação e gere propostas completas.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        <div className="p-4 bg-primary text-white text-center text-sm font-bold uppercase tracking-wider">
          Modo CRM - Simulador Oficial
        </div>
        <div className="p-4 md:p-8 bg-slate-50">
          <ConsortiumSimulator isInternal={true} />
        </div>
      </div>
    </div>
  );
}
