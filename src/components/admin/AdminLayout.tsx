import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Filter, Users, LogOut, Target, Briefcase, AlertTriangle, Menu, X, ChevronLeft, ChevronRight, Calculator, CalendarDays, Sparkles, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin", color: "text-blue-500" },
    { icon: Sparkles, label: "Pergunte ao Jarvis", path: "/admin/jarvis", color: "text-purple-500" },
    { icon: Filter, label: "Leads", path: "/admin/leads", color: "text-orange-500" },
    { icon: Briefcase, label: "Funil de Vendas", path: "/admin/funil", color: "text-emerald-500" },
    { icon: Calculator, label: "Simulador", path: "/admin/simulador", color: "text-cyan-500" },
    { icon: CalendarDays, label: "Agendamentos", path: "/admin/agendamentos", color: "text-indigo-500" },
    { icon: Users, label: "Carteira Clientes", path: "/admin/carteira", color: "text-blue-600" },
    { icon: AlertTriangle, label: "Inadimplentes", path: "/admin/inadimplentes", color: "text-red-500" },
    { icon: Target, label: "Metas", path: "/admin/metas", color: "text-amber-500" },
    { icon: Shield, label: "Acessos", path: "/admin/auth", color: "text-slate-700" },
];

export default function AdminLayout() {
    const { signOut, authError, profile } = useAuth();
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const isFunilPage = location.pathname === "/admin/funil";
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        const saved = localStorage.getItem("admin_sidebar_collapsed");
        return saved === "true";
    });

    useEffect(() => {
        localStorage.setItem("admin_sidebar_collapsed", String(sidebarCollapsed));
    }, [sidebarCollapsed]);

    const SidebarContent = ({ collapsed }: { collapsed?: boolean }) => {
        const { profile, permissions } = useAuth();
        
        const filteredMenuItems = menuItems.filter(item => {
            // Dashboard is always visible
            if (item.path === "/admin") return true;
            
            // Total/Admin access can see everything
            if (profile?.tipo_acesso === 'total') return true;
            
            // Partial access relies on granular permissions
            return permissions.some(up => 
                up.concedida && up.permissao?.modulo?.slug === item.path.split('/').pop()
            );
        });

        return (
            <div className={`flex flex-col h-full bg-sidebar-background text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ${collapsed ? 'w-20' : 'w-72'}`}>
                <div className={`p-6 border-b border-sidebar-border text-center overflow-hidden h-24 flex items-center justify-center`}>
                    {!collapsed ? (
                        <a href="https://www.oespecialistaconsorcio.com.br" target="_blank" rel="noopener noreferrer" className="text-sm md:text-base font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent break-words leading-tight hover:opacity-80 transition-opacity">
                            www.oespecialistaconsorcio.com.br
                        </a>
                    ) : (
                        <span className="font-bold text-primary text-xl">OE</span>
                    )}
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto no-scrollbar">
                    {filteredMenuItems.map((item) => (
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
    };

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
                        <span className="font-bold text-sm text-primary truncate max-w-[200px]">www.oespecialistaconsorcio.com.br</span>
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
                    {authError && (
                        <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                            <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="font-bold text-amber-900">Atenção: Configuração Pendente</p>
                                <p className="text-sm text-amber-800 leading-relaxed">
                                    {authError} 
                                    <br />
                                    Para resolver, você deve executar o script <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">promote_admin.sql</code> no seu editor de SQL do Supabase, substituindo pelo seu e-mail.
                                </p>
                            </div>
                        </div>
                    )}
                    
                    {!authError && !profile?.organizacao_id && (
                        <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                            <Shield className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="font-bold text-blue-900">Perfil sem Organização</p>
                                <p className="text-sm text-blue-800 leading-relaxed">
                                    Sua conta foi encontrada, mas não está vinculada a nenhuma organização. 
                                    Seus dados estão protegidos pelo sistema de isolamento (RLS).
                                </p>
                            </div>
                        </div>
                    )}

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
