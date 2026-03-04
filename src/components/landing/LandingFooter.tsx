import { Link } from "react-router-dom";
import logoWhite from "@/assets/logo-white.png";
import { useSiteContent } from "@/hooks/useSiteContent";
import { Mail, Phone, Instagram } from "lucide-react";

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
    <footer className="bg-[#1B2A4A]">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={logoWhite} alt="منصة الخدمات المشتركة" className="h-12 w-auto object-contain" />
              <span className="font-bold text-sm text-white">{ft.site_name}</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              منصة إلكترونية شاملة تربط الجمعيات الأهلية بمزودي خدمات معتمدين في مختلف المجالات.
            </p>
          </div>

          {/* Top Categories */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-white">الفئات الأعلى تقييماً</h4>
            <ul className="space-y-2">
              {topCategories.map((cat) => (
                <li key={cat} className="text-sm text-gray-400">{cat}</li>
              ))}
            </ul>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-white">روابط مهمة</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-sm text-gray-400 hover:text-white transition-colors">من نحن</Link></li>
              <li><Link to="/faq" className="text-sm text-gray-400 hover:text-white transition-colors">الأسئلة الشائعة</Link></li>
              <li><Link to="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">سياسة الخصوصية</Link></li>
              {(ft.links || []).map((link: any) => (
                <li key={link.label}>
                  <a href={link.url} className="text-sm text-gray-400 hover:text-white transition-colors">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-white">تواصل معنا</h4>
            <div className="space-y-2">
              <a href="mailto:sspf.scy@gmail.com" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                <Mail className="h-4 w-4 shrink-0" />
                <span dir="ltr">sspf.scy@gmail.com</span>
              </a>
              <a href="tel:0554648475" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                <Phone className="h-4 w-4 shrink-0" />
                <span dir="ltr">0554648475</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 px-4">
        <div className="container mx-auto text-center">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} {ft.copyright || "منصة الخدمات المشتركة. جميع الحقوق محفوظة."}
          </p>
        </div>
      </div>
    </footer>
  );
}
