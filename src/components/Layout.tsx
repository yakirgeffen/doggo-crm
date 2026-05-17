import { useState, useEffect, useCallback } from 'react';
import { NavLink, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Calendar, Settings, LogOut, Menu, X, Store, BookOpen, Inbox, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/auth-context';
import { WIRED_INTRO_PAGES, type PageId } from '../lib/intro-content';

const navItems = [
    { to: "/", label: "בית", icon: Home },
    { to: "/clients", label: "לקוחות", icon: Users },
    { to: "/leads", label: "לידים", icon: Inbox },
    { to: "/storefront", label: "החנות שלי", icon: Store },
    { to: "/calendar", label: "יומן", icon: Calendar },
];

// Pathname → intro PageId, but only for pages where the intro is actually
// wired (per WIRED_INTRO_PAGES in intro-content.ts). Non-wired routes get
// no `?` button — clicking it would no-op since no listener is mounted.
const PATH_TO_PAGE_ID: Record<string, PageId> = {
    '/clients': 'clients',
    '/settings': 'settings',
    '/storefront': 'storefront',
    '/calendar': 'calendar',
    '/leads': 'leads',
};

function pageIdForPath(pathname: string): PageId | null {
    const candidate = PATH_TO_PAGE_ID[pathname];
    if (!candidate) return null;
    return WIRED_INTRO_PAGES.has(candidate) ? candidate : null;
}

export function Layout() {
    const { signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const closeMenu = () => setIsMobileMenuOpen(false);

    const introPageId = pageIdForPath(location.pathname);
    const openPageIntro = () => {
        if (!introPageId) return;
        const params = new URLSearchParams(location.search);
        params.set('intro', introPageId);
        navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
    };

    // Close mobile menu with Escape key — IS 5568
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape' && isMobileMenuOpen) {
            closeMenu();
        }
    }, [isMobileMenuOpen]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden">

            {/* Skip Link — IS 5568 / WCAG 2.1 AA */}
            <a href="#main-content" className="skip-link">
                מעבר לתוכן הראשי
            </a>

            {/* ========== DESKTOP SIDEBAR (lg+) ========== */}
            <aside className="hidden lg:flex lg:fixed lg:right-0 lg:top-0 lg:h-screen lg:w-[280px] lg:flex-col lg:bg-surface lg:border-e lg:border-border z-30" aria-label="ניווט ראשי">
                {/* Logo */}
                <div className="h-[72px] flex items-center justify-center border-b border-border-light px-6">
                    <h1 className="text-xl font-bold flex items-center gap-2 text-text-primary">
                        <span className="text-2xl">🐾</span>
                        <span>Doggo CRM</span>
                    </h1>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 py-4 px-3 space-y-1" aria-label="תפריט ניווט">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === "/"}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-text-secondary hover:bg-background hover:text-text-primary'
                                }`
                            }
                        >
                            <item.icon size={20} />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer: Help + Settings + Blog + Sign Out + Version */}
                <div className="border-t border-border-light p-3 space-y-1">
                    {introPageId && (
                        <button
                            onClick={openPageIntro}
                            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-text-secondary hover:bg-background hover:text-text-primary transition-colors"
                            title="הסבר על העמוד הנוכחי"
                        >
                            <HelpCircle size={20} />
                            הסבר על העמוד
                        </button>
                    )}
                    <NavLink
                        to="/settings"
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-text-secondary hover:bg-background hover:text-text-primary'
                            }`
                        }
                    >
                        <Settings size={20} />
                        הגדרות
                    </NavLink>
                    {/* PP-26: blog is an internal route — use Link, not <a target="_blank"> */}
                    <Link
                        to="/blog"
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-text-secondary hover:bg-background hover:text-text-primary transition-colors"
                        title="תכנים ומדריכים בנושא אילוף כלבים"
                    >
                        <BookOpen size={20} />
                        בלוג
                    </Link>
                    <button
                        onClick={() => signOut()}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-text-secondary hover:bg-background hover:text-text-primary transition-colors"
                    >
                        <LogOut size={20} className="rtl:rotate-180" />
                        יציאה
                    </button>
                    <div className="text-[11px] text-center text-text-muted/60 pt-2 pb-1 font-medium">
                        גרסה 2.0 • Doggo CRM
                    </div>
                </div>
            </aside>

            {/* ========== MOBILE HEADER (below lg) ========== */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-surface/95 backdrop-blur-sm z-40 flex items-center justify-between px-5 border-b border-border">
                <h1 className="text-lg font-bold flex items-center gap-2 text-text-primary">
                    <span className="text-xl">🐾</span>
                    <span>Doggo CRM</span>
                </h1>
                <div className="flex items-center gap-1">
                    {introPageId && (
                        <button
                            onClick={openPageIntro}
                            className="p-2 text-text-muted hover:text-primary hover:bg-background rounded-lg transition-colors"
                            title="הסבר על העמוד"
                            aria-label="הסבר על העמוד"
                        >
                            <HelpCircle size={20} />
                        </button>
                    )}
                    {/* PP-25: aria-label on hamburger button for screen readers */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 text-text-secondary hover:bg-background rounded-lg transition-colors"
                        aria-label={isMobileMenuOpen ? 'סגור תפריט' : 'פתח תפריט'}
                        aria-expanded={isMobileMenuOpen}
                    >
                        {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </header>

            {/* ========== MOBILE SLIDE-OUT MENU ========== */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden animate-fade-in"
                    onClick={closeMenu}
                />
            )}
            <div
                className={`
                    fixed inset-y-0 right-0 z-50 w-72 bg-surface shadow-elevated transition-transform duration-300 ease-in-out
                    lg:hidden flex flex-col
                    ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
                `}
            >
                <div className="p-4 flex justify-between items-center border-b border-border-light">
                    <h2 className="font-bold text-text-primary flex items-center gap-2">
                        <span>🐾</span> Doggo CRM
                    </h2>
                    <button onClick={closeMenu} className="p-2 text-text-muted hover:bg-background rounded-lg" aria-label="סגור תפריט">
                        <X size={20} />
                    </button>
                </div>
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === "/"}
                            onClick={closeMenu}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-text-secondary hover:bg-background'
                                }`
                            }
                        >
                            <item.icon size={20} />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="border-t border-border-light p-3 space-y-1">
                    <NavLink
                        to="/settings"
                        onClick={closeMenu}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-text-secondary hover:bg-background'
                            }`
                        }
                    >
                        <Settings size={20} />
                        הגדרות
                    </NavLink>
                    <button
                        onClick={() => signOut()}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-text-secondary hover:bg-background transition-colors"
                    >
                        <LogOut size={20} className="rtl:rotate-180" />
                        יציאה
                    </button>
                </div>
            </div>

            {/* ========== MOBILE BOTTOM NAV ========== */}
            <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur-sm border-t border-border pb-6 pt-2" aria-label="ניווט מהיר">
                <div className="flex justify-around items-center">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === "/"}
                            className={({ isActive }) =>
                                `flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors min-w-[60px] ${isActive
                                    ? 'text-primary'
                                    : 'text-text-muted'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-primary/10' : ''}`}>
                                        <item.icon size={22} />
                                    </div>
                                    <span className="text-[11px] font-medium uppercase tracking-wide">
                                        {item.label}
                                    </span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>
            </nav>

            {/* ========== MAIN CONTENT AREA ========== */}
            <main id="main-content" className="flex-1 overflow-hidden flex flex-col relative bg-background pt-14 lg:pt-0 lg:ms-[280px]" role="main">
                <div className="flex-1 overflow-auto px-5 lg:px-8 py-6 lg:py-8 no-scrollbar">
                    <div className="max-w-[960px] mx-auto animate-fade-in pb-28 lg:pb-10">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
