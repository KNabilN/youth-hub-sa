import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import logoImg from "@/assets/logo.png";
import { useSiteContent } from "@/hooks/useSiteContent";
import AuthModal from "@/components/AuthModal";

export default function LandingHeader() {
  const { data: header } = useSiteContent("header");
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
              <span className="font-bold text-lg hidden sm:inline">{hd.site_name}</span>
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

          <div className="hidden md:flex gap-2">
            <Button variant="ghost" onClick={() => openAuth("login")}>
              {hd.login_text}
            </Button>
            <Button className="shadow-md" onClick={() => openAuth("register")}>
              {hd.register_text}
            </Button>
          </div>

          {/* Mobile menu button */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
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
              <Button variant="ghost" size="sm" className="flex-1" onClick={() => openAuth("login")}>
                {hd.login_text}
              </Button>
              <Button size="sm" className="flex-1" onClick={() => openAuth("register")}>
                {hd.register_text}
              </Button>
            </div>
          </div>
        )}
      </header>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} defaultMode={authMode} />
    </>
  );
}
