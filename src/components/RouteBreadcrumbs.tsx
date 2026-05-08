import { Link, useLocation } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";

const LABELS: Record<string, string> = {
  dashboard: "لوحة التحكم",
  profile: "الملف الشخصي",
  marketplace: "السوق",
  services: "الخدمات",
  "my-services": "خدماتي",
  projects: "المشاريع",
  "my-projects": "مشاريعي",
  "available-projects": "المشاريع المتاحة",
  "project-create": "مشروع جديد",
  "project-edit": "تعديل المشروع",
  contracts: "العقود",
  bids: "العروض",
  "my-bids": "عروضي",
  earnings: "الأرباح",
  invoices: "الفواتير",
  cart: "السلة",
  checkout: "الدفع",
  messages: "الرسائل",
  notifications: "الإشعارات",
  ratings: "التقييمات",
  disputes: "النزاعات",
  "my-disputes": "نزاعاتي",
  tickets: "تذاكر الدعم",
  "support-tickets": "تذاكر الدعم",
  trash: "المحذوفات",
  associations: "الجمعيات",
  donors: "المانحون",
  donations: "التبرعات",
  grants: "المنح",
  "my-grants": "منحي",
  "grant-requests": "طلبات المنح",
  "my-grant-requests": "طلباتي للمنح",
  "received-grants": "المنح المستلمة",
  "donor-purchases": "مشتريات المانح",
  "impact-reports": "تقارير الأثر",
  "association-impact-reports": "تقارير أثر الجمعيات",
  "time-tracking": "تتبع الوقت",
  "time-logs": "سجلات الوقت",
  admin: "الإدارة",
  users: "المستخدمون",
  finance: "المالية",
  reports: "التقارير",
  settings: "الإعدادات",
  cms: "إدارة المحتوى",
  "discount-codes": "أكواد الخصم",
  hypotheses: "الفرضيات",
  "edit-requests": "طلبات التعديل",
  "user-guide": "دليل المستخدم",
  faq: "الأسئلة الشائعة",
  about: "من نحن",
};

const labelOf = (seg: string) =>
  LABELS[seg] ?? decodeURIComponent(seg).replace(/-/g, " ");

export function RouteBreadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0 || pathname === "/dashboard") return null;

  // Skip dynamic ID segments (UUIDs / numeric)
  const isDynamic = (s: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(s) || /^\d+$/.test(s);

  const crumbs: { label: string; href?: string }[] = [];
  let acc = "";
  segments.forEach((seg, i) => {
    acc += "/" + seg;
    if (isDynamic(seg)) {
      crumbs.push({ label: "تفاصيل" });
      return;
    }
    const isLast = i === segments.length - 1;
    crumbs.push({ label: labelOf(seg), href: isLast ? undefined : acc });
  });

  return (
    <div className="px-4 md:px-6 pt-3">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/dashboard" className="flex items-center gap-1">
                <Home className="h-3.5 w-3.5" />
                <span>الرئيسية</span>
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <BreadcrumbSeparator className="rotate-180" />
              <BreadcrumbItem>
                {c.href ? (
                  <BreadcrumbLink asChild>
                    <Link to={c.href}>{c.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{c.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </span>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
