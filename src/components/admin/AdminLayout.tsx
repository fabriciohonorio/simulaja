import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Filter, Users, LogOut, Target, Briefcase, AlertTriangle, Menu, X, Clock, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
    { icon: Filter, label: "Leads", path: "/admin/leads" },
    { icon: Bot, label: "Agente SDR IA", path: "/admin/sdr" },
    { icon: Clock, label: "Fila Inteligente", path: "/admin/fila" },
    { icon: Briefcase, label: "Funil de Vendas", path: "/admin/funil" },
    { icon: Users, label: "Carteira Clientes", path: "/admin/carteira" },
    { icon: AlertTriangle, label: "Inadimplentes", path: "/admin/inadimplentes" },
    { icon: Target, label: "Metas e KPIs", path: "/admin/metas" },
];

export default function AdminLayout() {
    const { signOut } = useAuth();
    const [open, setOpen] = useState(false);

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-sidebar-background text-sidebar-foreground border-r border-sidebar-border">
            <div className="p-6 border-b border-sidebar-border">
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">SimulaJá Admin</h1>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setOpen(false)}
                        end={item.path === "/admin"}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                                : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-muted-foreground"
                            }`
                        }
                    >
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-sidebar-border mt-auto bg-sidebar-background/50 backdrop-blur-sm">
                <Button
                    variant="ghost"
                    onClick={() => signOut()}
                    className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 py-6"
                >
                    <LogOut className="h-5 w-5" />
                    <span className="font-semibold">Sair</span>
                </Button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-72 h-full opacity-100 transition-all duration-300 ease-in-out">
                <SidebarContent />
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                <header className="lg:hidden flex items-center justify-between px-4 h-16 bg-white border-b border-border shadow-sm sticky top-0 z-30">
                    <div className="flex items-center gap-2">
                        <h1 className="font-bold text-lg text-primary">SimulaJá</h1>
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
                <main className="flex-1 overflow-auto bg-slate-50/50 p-4 sm:p-6 md:p-8">
                    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-3 duration-500">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
