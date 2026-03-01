import { Link } from "react-router-dom";
import logoImg from "@/assets/logo.png";
import { useSiteContent } from "@/hooks/useSiteContent";
import { Mail, Phone } from "lucide-react";

const topCategories = [
  "الخدمات المالية",
  "البناء المؤسسي",
  "العمليات الداخلية",
  "الخدمات التقنية",
  "الخدمات التدريبية",
  "خدمات التسويق",
];

export default function LandingFooter() {
  const { data: footer } = useSiteContent("footer");
  const ft = footer || { site_name: "منصة الخدمات المشتركة", copyright: "", links: [] };

  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="منصة الخدمات المشتركة" className="h-12 w-auto object-contain" />
              <span className="font-bold text-sm">{ft.site_name}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              منصة إلكترونية شاملة تربط الجمعيات الأهلية بمزودي خدمات معتمدين في مختلف المجالات.
            </p>
          </div>

          {/* Top Categories */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">الفئات الأعلى تقييماً</h4>
            <ul className="space-y-2">
              {topCategories.map((cat) => (
                <li key={cat} className="text-sm text-muted-foreground">{cat}</li>
              ))}
            </ul>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">روابط مهمة</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">من نحن</Link></li>
              <li><Link to="/faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">الأسئلة الشائعة</Link></li>
              <li><Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">سياسة الخصوصية</Link></li>
              {(ft.links || []).map((link: any) => (
                <li key={link.label}>
                  <a href={link.url} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">تواصل معنا</h4>
            <div className="space-y-2">
              <a href="mailto:sspf.scy@gmail.com" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="h-4 w-4 shrink-0" />
                sspf.scy@gmail.com
              </a>
              <a href="tel:0554648475" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors" dir="ltr">
                <Phone className="h-4 w-4 shrink-0" />
                0554648475
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border py-4 px-4">
        <div className="container mx-auto text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {ft.copyright || "منصة الخدمات المشتركة. جميع الحقوق محفوظة."}
          </p>
        </div>
      </div>
    </footer>
  );
}
