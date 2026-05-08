import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );

    const prevTitle = document.title;
    document.title = "الصفحة غير موجودة - منصة الخدمات المشتركة";

    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex, nofollow";
    document.head.appendChild(robots);

    const existingCanonical = document.querySelector('link[rel="canonical"]');
    const prevCanonical = existingCanonical?.getAttribute("href") ?? null;
    if (existingCanonical) existingCanonical.remove();

    return () => {
      document.title = prevTitle;
      robots.remove();
      if (prevCanonical) {
        const link = document.createElement("link");
        link.rel = "canonical";
        link.href = prevCanonical;
        document.head.appendChild(link);
      }
    };
  }, [location.pathname]);

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-muted"
      dir="rtl"
    >
      <div className="text-center space-y-4 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <FileQuestion className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-5xl font-bold text-primary">الصفحة غير موجودة</h1>
        <p className="text-xl text-muted-foreground">
          عذراً، الرابط الذي طلبته غير متوفر
        </p>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          ربما تم نقل الصفحة أو حذفها، يمكنك العودة للرئيسية لتصفح المنصة
        </p>
        <Button asChild className="mt-4">
          <a href="/">العودة للرئيسية</a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
