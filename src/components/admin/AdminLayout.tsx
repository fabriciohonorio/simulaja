import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Filter, Users, LogOut, Target, Briefcase, AlertTriangle, Menu, X } from "lucide-react";
import logo from "@/assets/logo-consorcio-magalu.png";
import { cn } from "@/lib/utils";

const navItems = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/admin/funil", label: "Funil", icon: Filter },
    { to: "/admin/leads", label: "Leads", icon: Users },
    { to: "/admin/metas", label: "Metas", icon: Target },
    { to: "/admin/carteira", label: "Carteira", icon: Briefcase },
    { to: "/admin/inadimplentes", label: "Inadimplentes", icon: AlertTriangle },
];

export default function AdminLayout() {
    const { signOut } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-muted">
            {/* Mobile Top Navbar */}
            <div className="md:hidden flex items-center justify-between bg-card px-4 py-3 border-b border-border z-20 shadow-sm">
                <img src={logo} alt="Consórcio Magalu" className="h-8" />
                <button
                    onClick={toggleSidebar}
                    className="text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-muted transition-colors"
                    aria-label="Menu"
                >
                    {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Sidebar Overlay for Mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-40 w-72 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-in-out md:static md:w-60 md:shrink-0 md:translate-x-0",
                    isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
                )}
            >
                <div className="p-4 border-b border-border hidden md:flex">
                    <img src={logo} alt="Consórcio Magalu" className="h-10" />
                </div>
                {/* Mobile: logo inside sidebar too */}
                <div className="p-4 border-b border-border md:hidden flex items-center justify-between">
                    <img src={logo} alt="Consórcio Magalu" className="h-8" />
                    <button onClick={closeSidebar} className="p-1 text-muted-foreground">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            onClick={closeSidebar}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )
                            }
                        >
                            <item.icon className="h-5 w-5 shrink-0" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="p-3 border-t border-border">
                    <button
                        onClick={signOut}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full"
                    >
                        <LogOut className="h-5 w-5 shrink-0" />
                        Sair
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 overflow-auto min-h-0">
                <div className="w-full max-w-[1400px] mx-auto p-3 sm:p-4 md:p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
