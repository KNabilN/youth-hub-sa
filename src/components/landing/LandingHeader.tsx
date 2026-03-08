import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, X, ShoppingCart, LayoutDashboard, LogOut } from "lucide-react";
import logoImg from "@/assets/logo.png";
import { useSiteContent } from "@/hooks/useSiteContent";
import AuthModal from "@/components/AuthModal";
import { useUnifiedCart } from "@/hooks/useUnifiedCart";
import { useAuth } from "@/hooks/useAuth";

export default function LandingHeader() {
  const { count: cartCount } = useUnifiedCart();
  const { data: header } = useSiteContent("header");
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const hd = header || { site_name: "الخدمات المشتركة", login_text: "تسجيل الدخول", register_text: "إنشاء حساب" };

  const openAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthOpen(true);
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { label: "الرئيسية", to: "/" },
    { label: "من نحن", to: "/about" },
    { label: "الأسئلة الشائعة", to: "/faq" },
    { label: "شروط الخدمة", to: "/privacy" },
  ];

  return (
    <>
      <header className="border-b border-border glass sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3">
              <img src={logoImg} alt="منصة الخدمات المشتركة" className="h-14 w-auto object-contain" />
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex gap-2 items-center">
            <Button variant="ghost" size="icon" asChild className="relative">
              <Link to="/cart">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                    {cartCount}
                  </Badge>
                )}
              </Link>
            </Button>
            {user ? (
              <>
                <Button className="shadow-md gap-2" onClick={() => navigate("/dashboard")}>
                  <LayoutDashboard className="h-4 w-4" />
                  لوحة التحكم
                </Button>
                <Button variant="outline" className="shadow-md gap-2" onClick={() => signOut()}>
                  <LogOut className="h-4 w-4" />
                  تسجيل الخروج
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => openAuth("login")}>
                  {hd.login_text}
                </Button>
                <Button className="shadow-md" onClick={() => openAuth("register")}>
                  {hd.register_text}
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <Button variant="ghost" size="icon" asChild className="relative">
              <Link to="/cart">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                    {cartCount}
                  </Badge>
                )}
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background px-4 pb-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-2">
              {user ? (
                <>
                  <Button size="sm" className="flex-1 gap-2" onClick={() => { setMobileMenuOpen(false); navigate("/dashboard"); }}>
                    <LayoutDashboard className="h-4 w-4" />
                    لوحة التحكم
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2" onClick={() => { setMobileMenuOpen(false); signOut(); }}>
                    <LogOut className="h-4 w-4" />
                    خروج
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => openAuth("login")}>
                    {hd.login_text}
                  </Button>
                  <Button size="sm" className="flex-1" onClick={() => openAuth("register")}>
                    {hd.register_text}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} defaultMode={authMode} />
    </>
  );
}
