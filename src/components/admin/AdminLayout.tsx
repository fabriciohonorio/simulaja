import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Filter, Users, LogOut, Target, Briefcase, AlertTriangle, Menu, ChevronLeft, ChevronRight, Calculator, CalendarDays, Sparkles, Settings, MessageSquare, Loader2 } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/button";
import StreakBadge from "@/components/admin/StreakBadge";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface MenuGroup {
    label: string;
    items: {
        icon: any;
        label: string;
        path: string;
        color: string;
        adminOnly?: boolean;
    }[];
}

const menuGroups: MenuGroup[] = [
    {
        label: "OPERAÇÃO",
        items: [
            { icon: LayoutDashboard, label: "Dashboard", path: "/admin", color: "text-blue-500" },
            { icon: Briefcase, label: "Funil de Vendas", path: "/admin/funil", color: "text-emerald-500" },
            { icon: Filter, label: "Leads", path: "/admin/leads", color: "text-orange-500" },
            { icon: CalendarDays, label: "Agendamentos", path: "/admin/agendamentos", color: "text-indigo-500" },
        ]
    },
    {
        label: "FERRAMENTAS DE CONVERSÃO",
        items: [
            { icon: Calculator, label: "Simulador", path: "/admin/simulador", color: "text-cyan-500" },
        ]
    },
    {
        label: "RELACIONAMENTO",
        items: [
            { icon: Users, label: "Carteira Clientes", path: "/admin/carteira", color: "text-blue-600" },
        ]
    },
    {
        label: "RECUPERAÇÃO",
        items: [
            { icon: AlertTriangle, label: "Inadimplentes", path: "/admin/inadimplentes", color: "text-red-500", adminOnly: true },
        ]
    },
    {
        label: "GESTÃO",
        items: [
            { icon: Target, label: "Metas", path: "/admin/metas", color: "text-amber-500" }, // Todos acessam, limitaremos dentro do componente
        ]
    },
    {
        label: "SISTEMA",
        items: [
            { icon: Settings, label: "Configurações", path: "/admin/configuracoes", color: "text-slate-600", adminOnly: true },
        ]
    },
    {
        label: "SUPORTE / IA",
        items: [
            { icon: Sparkles, label: "Pergunte ao Jarvis", path: "/admin/jarvis", color: "text-purple-500" },
        ]
    }
];

export default function AdminLayout() {
    const { signOut } = useAuth();
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [org, setOrg] = useState<any>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        const saved = localStorage.getItem("admin_sidebar_collapsed");
        return saved === "true";
    });

    const currentHour = new Date().getHours();
    const isDayTime = currentHour >= 6 && currentHour < 18;

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profileData } = await (supabase.from("perfis" as any) as any)
                .select("*")
                .eq("id", user.id)
                .single();

            if (profileData) {
                setProfile(profileData);
                if (profileData.organizacao_id) {
                    const { data: orgData } = await (supabase.from("organizacoes" as any) as any)
                        .select("*")
                        .eq("id", profileData.organizacao_id)
                        .single();
                    setOrg(orgData);
                }
            }
        } catch (e) {
            console.error("Layout fetch error:", e);
        }
    };

    useEffect(() => {
        localStorage.setItem("admin_sidebar_collapsed", String(sidebarCollapsed));
    }, [sidebarCollapsed]);

    const renderSidebar = (collapsed: boolean) => (
        <div className={`flex flex-col h-full bg-slate-900 text-slate-100 border-r border-slate-800 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
            <div className="p-4 border-b border-slate-800 h-20 flex items-center justify-center">
                {!collapsed ? (
                    <div className="flex flex-col items-center">
                        <img src="/icon-512.png" alt="Logo" className="h-8 w-auto mb-1" />
                        <span className="text-[10px] font-black tracking-widest text-[#84CC16]">CONTEMPLAR CRM</span>
                    </div>
                ) : (
                    <img src="/icon-512.png" alt="Logo" className="h-8 w-auto" />
                )}
            </div>

            {!collapsed && org && (
                <div className="mx-2 mt-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Empresa</div>
                    <div className="font-bold text-xs text-slate-200 truncate">{org.nome}</div>
                    <div className="text-[10px] text-slate-400 truncate">{profile?.nome_completo}</div>
                </div>
            )}

            <nav className="flex-1 p-2 space-y-1 overflow-y-auto mt-4">
                {menuGroups.map((group) => {
                    const groupItems = group.items.filter(item => 
                        !item.adminOnly || profile?.tipo_acesso === 'admin'
                    );
                    if (groupItems.length === 0) return null;

                    return (
                        <div key={group.label} className="pt-2">
                            {!collapsed && (
                                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-4 mb-1">
                                    {group.label}
                                </div>
                            )}
                            {groupItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    end={item.path === "/admin"}
                                    onClick={() => setOpen(false)}
                                    className={({ isActive }) => {
                                        let activeClass = "";
                                        if (isActive) {
                                            activeClass = isDayTime ? "bg-white text-slate-900 shadow-sm font-black" : "bg-primary text-white font-black";
                                        } else {
                                            activeClass = "text-slate-400 hover:bg-slate-800 hover:text-white font-bold";
                                        }
                                        return `flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${activeClass} ${collapsed ? 'justify-center px-0' : ''}`;
                                    }}
                                >
                                    <item.icon className="h-4 w-4 shrink-0" />
                                    {!collapsed && <span className="text-xs font-bold">{item.label}</span>}
                                </NavLink>
                            ))}
                        </div>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <Button
                    variant="ghost"
                    onClick={() => signOut()}
                    className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                >
                    <LogOut className="h-4 w-4" />
                    {!collapsed && <span className="text-xs font-bold">Sair</span>}
                </Button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            <aside className="hidden lg:block h-full">
                {renderSidebar(sidebarCollapsed)}
            </aside>

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="lg:hidden flex items-center justify-between px-4 h-16 bg-slate-900 text-white shadow-sm z-30">
                    <img src="/icon-512.png" alt="Logo" className="h-8 w-auto" />
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-white">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 border-none w-64 bg-slate-900">
                            {renderSidebar(false)}
                        </SheetContent>
                    </Sheet>
                </header>

                <main className="flex-1 overflow-auto p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-4rem)] lg:min-h-screen">
                    <div className="max-w-[1600px] mx-auto h-full">
                        <ErrorBoundary>
                            <Suspense fallback={
                                <div className="flex h-full w-full items-center justify-center py-20">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            }>
                                <Outlet />
                            </Suspense>
                        </ErrorBoundary>
                    </div>
                </main>
            </div>
        </div>
    );
}
