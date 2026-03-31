import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Filter, Users, LogOut, Target, Briefcase, AlertTriangle, Menu, ChevronLeft, ChevronRight, Calculator, CalendarDays, Sparkles, Settings, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    const isFunilPage = location.pathname === "/admin/funil";
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        const saved = localStorage.getItem("admin_sidebar_collapsed");
        return saved === "true";
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profileData } = await (supabase
            .from("perfis" as any) as any)
            .select("*, organizacoes(nome)")
            .eq("id", user.id)
            .single();

        if (profileData) {
            setProfile(profileData);
            setOrg(profileData.organizacoes);
        }
    };

    useEffect(() => {
        localStorage.setItem("admin_sidebar_collapsed", String(sidebarCollapsed));
    }, [sidebarCollapsed]);

    const SidebarContent = ({ collapsed }: { collapsed?: boolean }) => (
        <div className={`flex flex-col h-full bg-sidebar-background text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ${collapsed ? 'w-20' : 'w-72'}`}>
            <div className={`p-4 border-b border-sidebar-border text-center overflow-hidden h-24 flex items-center justify-center`}>
                {!collapsed ? (
                    <div className="flex flex-col items-center gap-1">
                        <img 
                            src="/logo.png?v=1" 
                            alt="Contemplar CRM" 
                            className="h-16 w-auto object-contain"
                        />
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center">
                        <img 
                            src="/logo.png?v=1" 
                            alt="C" 
                            className="h-10 w-10 object-contain"
                        />
                    </div>
                )}
            </div>

            {!collapsed && org && (
                <div className="mx-4 mt-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">EMPRESA</div>
                    <div className="font-black text-slate-900 truncate mb-1">{org.nome}</div>
                    <div className="text-xs font-semibold text-slate-600 truncate mb-2">{profile?.nome_completo || "Usuário"}</div>
                    <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary uppercase">
                        {profile?.tipo_acesso === 'admin' ? 'Administrador' : profile?.tipo_acesso === 'manager' ? 'Manager' : 'Vendedor'}
                    </div>
                </div>
            )}

            <nav className="flex-1 p-4 space-y-4 overflow-y-auto no-scrollbar">
                {menuGroups.map((group) => {
                    const groupItems = group.items.filter(item => 
                        !item.adminOnly || profile?.tipo_acesso === 'admin'
                    );

                    if (groupItems.length === 0) return null;

                    return (
                        <div key={group.label} className="space-y-1">
                            {!collapsed && (
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-2">
                                    {group.label}
                                </div>
                            )}
                            {groupItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setOpen(false)}
                                    end={item.path === "/admin"}
                                    title={collapsed ? item.label : ""}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${isActive
                                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-[1.02]"
                                            : "hover:bg-sidebar-accent/50 text-muted-foreground hover:text-foreground"
                                        } ${collapsed ? 'justify-center px-0' : ''}`
                                    }
                                >
                                    <item.icon className={`h-5 w-5 shrink-0 transition-colors duration-300 ${collapsed ? 'h-6 w-6' : ''} ${location.pathname === item.path || (item.path === "/admin" && location.pathname === "/admin") ? "text-primary-foreground" : item.color}`} />
                                    {!collapsed && <span className="font-semibold tracking-tight">{item.label}</span>}
                                </NavLink>
                            ))}
                        </div>
                    );
                })}
            </nav>

            <div className={`p-4 border-t border-sidebar-border mt-auto bg-sidebar-background/50 backdrop-blur-sm ${collapsed ? 'px-2' : ''}`}>
                <Button
                    variant="ghost"
                    onClick={() => signOut()}
                    className={`w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 py-6 ${collapsed ? 'justify-center px-0' : ''}`}
                    title={collapsed ? "Sair" : ""}
                >
                    <LogOut className={`h-5 w-5 ${collapsed ? 'h-6 w-6' : ''}`} />
                    {!collapsed && <span className="font-semibold">Sair</span>}
                </Button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className={`hidden lg:block h-full transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-20' : 'w-72'}`}>
                <SidebarContent collapsed={sidebarCollapsed} />
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                <header className="lg:hidden flex items-center justify-between px-4 h-16 bg-white border-b border-border shadow-sm sticky top-0 z-30">
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                        <img 
                            src="/logo.png?v=1" 
                            alt="Contemplar CRM" 
                            className="h-10 w-auto object-contain"
                        />
                    </div>

                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 active:scale-90 transition-transform">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 border-none w-72">
                            <SheetHeader className="sr-only">
                                <SheetTitle>Menu de Navegação</SheetTitle>
                            </SheetHeader>
                            <SidebarContent />
                        </SheetContent>
                    </Sheet>
                </header>

                {/* Dynamic Page Content */}
                <main className={`flex-1 overflow-auto bg-slate-50/50 relative ${isFunilPage ? 'p-0 sm:p-0 md:p-0' : 'p-4 sm:p-6 md:p-8'}`}>
                    {/* Desktop Sidebar Toggle - Posicionado de forma fixa ou absoluta para fácil acesso */}
                    <button 
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -ml-3 z-50 items-center justify-center h-8 w-8 bg-white border border-border shadow-md rounded-full hover:scale-110 active:scale-95 transition-all text-primary"
                        title={sidebarCollapsed ? "Expandir painel" : "Recolher painel"}
                    >
                        {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </button>

                    <div className="w-full animate-in fade-in slide-in-from-bottom-3 duration-500">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
