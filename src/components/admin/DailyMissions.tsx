import React from 'react';
import { Target, CheckCircle2, Circle, Zap, Awards, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface Mission {
    id: string;
    title: string;
    description: string;
    reward: string;
    progress: number;
    goal: number;
    icon: any;
    color: string;
    status: 'active' | 'completed';
}

const DailyMissions = () => {
    const missions: Mission[] = [
        {
            id: '1',
            title: 'Prospecção Ativa',
            description: 'Registre 10 novas tentativas de contato',
            reward: '+50 XP',
            progress: 7,
            goal: 10,
            icon: Zap,
            color: 'text-amber-500',
            status: 'active'
        },
        {
            id: '2',
            title: 'Mestre do Follow-up',
            description: 'Atualize o histórico de 5 leads antigos',
            reward: '+30 XP',
            progress: 5,
            goal: 5,
            icon: CheckCircle2,
            color: 'text-emerald-500',
            status: 'completed'
        },
        {
            id: '3',
            title: 'Bora Fechar!',
            description: 'Envie 3 propostas formais hoje',
            reward: '+100 XP',
            progress: 1,
            goal: 3,
            icon: Target,
            color: 'text-blue-500',
            status: 'active'
        }
    ];

    const completedCount = missions.filter(m => m.status === 'completed').length;
    const globalProgress = (completedCount / missions.length) * 100;

    return (
        <Card className="border-none shadow-xl bg-white overflow-hidden group">
            <CardHeader className="pb-2 bg-slate-50/50 border-b">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <Awards className="h-5 w-5 text-amber-500" />
                        <CardTitle className="text-lg font-black tracking-tight">Missões Diárias</CardTitle>
                    </div>
                    <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] font-black uppercase">
                        Nível 12
                    </Badge>
                </div>
                <CardDescription className="text-xs">Complete as missões para ganhar XP e subir no ranking.</CardDescription>
                
                <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span>Progresso Diário</span>
                        <span>{Math.round(globalProgress)}%</span>
                    </div>
                    <Progress value={globalProgress} className="h-1.5 bg-slate-100" />
                </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
                {missions.map((mission) => (
                    <div 
                        key={mission.id} 
                        className={`group/item p-3 rounded-2xl border transition-all duration-300 ${
                            mission.status === 'completed' 
                            ? 'bg-slate-50 border-slate-100 opacity-70' 
                            : 'bg-white border-slate-100 hover:border-primary/30 hover:shadow-md'
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`mt-0.5 p-2 rounded-xl transition-colors ${
                                mission.status === 'completed' 
                                ? 'bg-emerald-100/50 text-emerald-600' 
                                : 'bg-slate-100 text-slate-500 group-hover/item:bg-primary/10 group-hover/item:text-primary'
                            }`}>
                                <mission.icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <h4 className={`text-xs font-black truncate ${mission.status === 'completed' ? 'text-slate-500' : 'text-slate-900'}`}>
                                        {mission.title}
                                    </h4>
                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${mission.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                        {mission.reward}
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-500 line-clamp-1 mb-2">{mission.description}</p>
                                
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-500 ${mission.status === 'completed' ? 'bg-emerald-500' : 'bg-primary'}`}
                                            style={{ width: `${(mission.progress / mission.goal) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-400 tabular-nums">
                                        {mission.progress}/{mission.goal}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                <button className="w-full mt-2 py-2.5 rounded-xl border-2 border-dashed border-slate-100 text-slate-400 hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                    <TrendingUp className="h-3 w-3" />
                    Bater recorde pessoal
                </button>
            </CardContent>
        </Card>
    );
};

export default DailyMissions;
