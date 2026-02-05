import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, LogOut, Calendar, Settings, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Layout() {
    const { signOut } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMenu = () => setIsMobileMenuOpen(false);

    return (
        <div className="flex h-screen w-full bg-[var(--color-bg-app)] overflow-hidden font-rubik">

            {/* MOBILE HEADER (Visible only on small screens) */}
            <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[var(--color-sidebar-bg)] z-40 flex items-center justify-between px-4 shadow-md">
                <h1 className="text-xl font-black flex items-center gap-2 tracking-tight text-white">
                    <span className="text-2xl">🐕</span>
                    <span>DoggoCRM</span>
                </h1>
                <button
                    onClick={toggleMenu}
                    className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {/* MOBILE OVERLAY BACKDROP */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in"
                    onClick={closeMenu}
                />
            )}

            {/* SIDEBAR NAVIGATION */}
            <aside
                className={`
                    fixed inset-y-0 right-0 z-50 w-72 bg-[var(--color-sidebar-bg)] text-[var(--color-sidebar-text)] shadow-2xl transition-transform duration-300 ease-in-out
                    md:relative md:translate-x-0 md:shadow-none md:flex md:flex-col md:w-72 md:shrink-0
                    ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x flex flex-col'} 
                    ${/* RTL Fix: Use simple logic or force LTR/RTL transforms explicitly if needed. 
                        Actually, let's try a safer 'hidden' toggle for the closed state if transform is buggy, 
                        BUT animation is nice. 
                        Let's force 'translate-x-full' (move right) for hidden, 'translate-x-0' for shown.
                        In RTL, 'translate-x-full' MIGHT move left depending on browser.
                        Let's use `ltr:translate-x...` if we had it, but standard Tailwind:
                        
                        If the menu is NOT visible, it should be 'translate-x-full' (off screen to right).
                        If visible, 'translate-x-0'.
                     */ ''}
                     ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
                `}
            >
                <div className="p-8 pb-4 hidden md:block">
                    <h1 className="text-2xl font-black flex items-center gap-3 tracking-tight text-white">
                        <span className="text-3xl">🐕</span>
                        <span>DoggoCRM</span>
                    </h1>
                </div>

                {/* Mobile-only close button in sidebar header */}
                <div className="p-4 flex justify-end md:hidden">
                    <button onClick={closeMenu} className="p-2 text-white hover:bg-white/10 rounded-lg">
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-1.5 py-6 overflow-y-auto">
                    {[
                        { to: "/", label: "לוח בקרה", icon: LayoutDashboard },
                        { to: "/clients", label: "לקוחות", icon: Users },
                        { to: "/programs", label: "תוכניות", icon: BookOpen },
                        { to: "/calendar", label: "לוח שנה", icon: Calendar },
                        { to: "/settings", label: "הגדרות", icon: Settings },
                    ].map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={closeMenu}
                            className={({ isActive }) =>
                                `flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group ${isActive
                                    ? 'bg-[var(--color-sidebar-active)]/20 text-white shadow-inner border border-white/10'
                                    : 'text-[var(--color-sidebar-muted)] hover:bg-white/10 hover:text-white'
                                }`
                            }
                        >
                            <item.icon size={20} />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-5 mt-auto border-t border-white/10">
                    <button
                        onClick={() => signOut()}
                        className="flex items-center gap-4 px-4 py-3 w-full rounded-xl text-sm font-bold text-[var(--color-sidebar-muted)] hover:bg-white/10 hover:text-white transition-all duration-200 group"
                    >
                        <LogOut size={20} className="rtl:rotate-180" />
                        התנתק
                    </button>
                    <div className="mt-6 text-[11px] text-center text-[var(--color-sidebar-muted)]/60 opacity-60 font-medium tracking-wide">
                        גרסה 1.0 • DoggoCRM
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 overflow-hidden flex flex-col relative bg-[var(--color-bg-app)] pt-16 md:pt-0">
                <div className="flex-1 overflow-auto p-4 md:p-12 no-scrollbar">
                    <div className="max-w-7xl mx-auto animate-fade-in pb-20 md:pb-0">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
