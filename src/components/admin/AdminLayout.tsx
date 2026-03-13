import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Filter, Users, LogOut, Target, Briefcase, AlertTriangle, Menu, X, ChevronLeft, ChevronRight, Calculator, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
    { icon: Filter, label: "Leads", path: "/admin/leads" },
    { icon: Briefcase, label: "Funil de Vendas", path: "/admin/funil" },
    { icon: Calculator, label: "Simulador", path: "/admin/simulador" },
    { icon: CalendarDays, label: "Agendamentos", path: "/admin/agendamentos" },
    { icon: Users, label: "Carteira Clientes", path: "/admin/carteira" },
    { icon: AlertTriangle, label: "Inadimplentes", path: "/admin/inadimplentes" },
    { icon: Target, label: "Metas", path: "/admin/metas" },
];

export default function AdminLayout() {
    const { signOut } = useAuth();
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

    const SidebarContent = ({ collapsed }: { collapsed?: boolean }) => (
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
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setOpen(false)}
                        end={item.path === "/admin"}
                        title={collapsed ? item.label : ""}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                                : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-muted-foreground"
                            } ${collapsed ? 'justify-center px-0' : ''}`
                        }
                    >
                        <item.icon className={`h-5 w-5 shrink-0 ${collapsed ? 'h-6 w-6' : ''}`} />
                        {!collapsed && <span className="font-medium">{item.label}</span>}
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
