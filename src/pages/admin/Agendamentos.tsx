import { CalendarDays } from "lucide-react";

export default function Agendamentos() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
      <div className="p-4 bg-primary/10 rounded-full">
        <CalendarDays className="h-12 w-12 text-primary" />
      </div>
      <h1 className="text-2xl font-bold">Agendamentos</h1>
      <p className="text-muted-foreground">Esta funcionalidade está sendo implementada.</p>
    </div>
  );
}
