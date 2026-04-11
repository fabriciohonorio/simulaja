import React from "react";
import { useFunil } from "@/hooks/useFunil";
import { FunilHeader } from "@/components/admin/funil/FunilHeader";
import { FunilBoard } from "@/components/admin/funil/FunilBoard";
import { FunilLegend } from "@/components/admin/funil/FunilLegend";
import { FunilModals } from "@/components/admin/funil/FunilModals";

export default function Funil() {
  const funilState = useFunil();

  if (funilState.loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 select-none no-scrollbar w-full">
      <FunilHeader state={funilState} />
      <FunilBoard state={funilState} />
      <FunilLegend />
      <FunilModals state={funilState} />
      <style>{`
        /* Ultra aggressive scrollbar removal - Global and Class based */
        *::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
        * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
        
        .no-scrollbar { 
          scrollbar-width: none !important; 
          -ms-overflow-style: none !important; 
          overflow: -moz-scrollbars-none !important;
        }
        .no-scrollbar::-webkit-scrollbar { 
          display: none !important; 
          width: 0 !important; 
          height: 0 !important; 
          background: transparent !important;
          -webkit-appearance: none !important;
        }
      `}</style>
    </div>
  );
}
