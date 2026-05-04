import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Clock, FileText, Scale, Shield, Lock, BookOpen, XCircle, Stamp, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ContractDocumentData } from "@/hooks/useContractDocument";

const LEGAL_CLAUSES = [
  { icon: Scale, text: "تدار هذه الاتفاقية وتُفسر وفقاً لأنظمة المملكة العربية السعودية." },
  { icon: Shield, text: "تتولى المنصة الفصل في أي نزاع ينشأ بين الأطراف وفق الآليات المعتمدة." },
  { icon: Lock, text: "يلتزم الطرفان بالحفاظ على سرية جميع المعلومات المتبادلة خلال فترة التعاقد وبعدها." },
  { icon: BookOpen, text: "تنتقل حقوق الملكية الفكرية للأعمال المنجزة إلى الطرف الأول (الجمعية) بعد إتمام الدفع." },
  { icon: XCircle, text: "يحق لأي طرف إلغاء العقد قبل بدء التنفيذ مع استرداد كامل المبلغ عبر نظام الضمان المالي." },
];

interface Props {
  data: ContractDocumentData;
  scopeOverride?: string;
}

function partyDisplay(p: any) {
  if (!p) return "—";
  return p.organization_name || p.full_name || "—";
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ar-SA");
}

export function ContractDocument({ data, scopeOverride }: Props) {
  const { contract, project, acceptedBid, service, escrow, association, provider } = data;
  const scope = scopeOverride ?? data.scope;
  const isBothSigned = !!(contract.association_signed_at && contract.provider_signed_at);
  const amount = Number(escrow?.amount ?? acceptedBid?.price ?? project?.budget ?? 0);
  const timeline = acceptedBid?.timeline_days ?? null;
  const subjectTitle = project?.title || service?.title || "—";
  const subjectDesc = project?.description || service?.long_description || service?.description || "";
  const contractRef = `CTR-${(contract.id || "").slice(0, 8).toUpperCase()}`;

  return (
    <div className="bg-card border rounded-xl shadow-sm relative overflow-hidden print:shadow-none print:border-0" id="contract-document">
      {/* Watermark */}
      {!isBothSigned && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.04] select-none">
          <span className="text-[160px] font-bold rotate-[-25deg] whitespace-nowrap">مسودة</span>
        </div>
      )}

      {/* Header */}
      <div className="border-b-4 border-primary/80 bg-gradient-to-l from-primary/5 to-transparent p-6 sm:p-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <p className="text-xs text-primary font-bold tracking-widest">عقد رسمي معتمد</p>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <FileText className="h-7 w-7 text-primary" />
              عقد تنفيذ خدمة
            </h1>
            <p className="text-sm text-muted-foreground">مرجع العقد: <span className="font-mono">{contractRef}</span></p>
            {project?.request_number && (
              <p className="text-sm text-muted-foreground">رقم الطلب: <span className="font-mono">{project.request_number}</span></p>
            )}
          </div>
          <div className="text-end space-y-1">
            <Badge variant={isBothSigned ? "default" : "outline"} className="text-xs">
              {isBothSigned ? "موقّع بالكامل" : contract.association_signed_at || contract.provider_signed_at ? "موقّع جزئياً" : "بانتظار التوقيع"}
            </Badge>
            <p className="text-xs text-muted-foreground">تاريخ الإنشاء: {fmtDate(contract.created_at)}</p>
            {isBothSigned && (
              <p className="text-xs text-success flex items-center gap-1 justify-end">
                <Stamp className="h-3 w-3" /> اعتُمد بتوقيع الطرفين
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6 relative">
        {/* Preamble */}
        <section className="text-sm leading-relaxed">
          <p>
            أُبرم هذا العقد بتاريخ <span className="font-semibold">{fmtDate(contract.created_at)}</span> بين كل من الطرفين الموضحين أدناه،
            بناءً على ما تم الاتفاق عليه عبر منصة الخدمات المشتركة، ويعد توقيع الطرفين إلكترونياً ملزِماً قانونياً ومعتمداً.
          </p>
        </section>

        {/* Parties */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border bg-muted/30 space-y-1.5">
            <p className="text-xs font-bold text-primary">الطرف الأول — الجمعية / المستفيد</p>
            <p className="font-semibold">{partyDisplay(association)}</p>
            {association?.user_number && <p className="text-xs text-muted-foreground">رقم المستخدم: {association.user_number}</p>}
            {association?.license_number && <p className="text-xs text-muted-foreground">رقم الترخيص: {association.license_number}</p>}
            {association?.contact_officer_name && (
              <p className="text-xs text-muted-foreground">مسؤول التواصل: {association.contact_officer_name}</p>
            )}
            <div className="flex items-center gap-1 text-xs pt-1">
              {contract.association_signed_at ? (
                <><Check className="h-3.5 w-3.5 text-success" /><span className="text-success">وقّع في {fmtDate(contract.association_signed_at)}</span></>
              ) : (
                <><Clock className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-muted-foreground">لم يوقّع بعد</span></>
              )}
            </div>
          </div>
          <div className="p-4 rounded-lg border bg-muted/30 space-y-1.5">
            <p className="text-xs font-bold text-primary">الطرف الثاني — مقدم الخدمة</p>
            <p className="font-semibold">{partyDisplay(provider)}</p>
            {provider?.user_number && <p className="text-xs text-muted-foreground">رقم المستخدم: {provider.user_number}</p>}
            {provider?.contact_officer_email && (
              <p className="text-xs text-muted-foreground">البريد: {provider.contact_officer_email}</p>
            )}
            <div className="flex items-center gap-1 text-xs pt-1">
              {contract.provider_signed_at ? (
                <><Check className="h-3.5 w-3.5 text-success" /><span className="text-success">وقّع في {fmtDate(contract.provider_signed_at)}</span></>
              ) : (
                <><Clock className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-muted-foreground">لم يوقّع بعد</span></>
              )}
            </div>
          </div>
        </section>

        <Separator />

        {/* المادة الأولى — موضوع العقد */}
        <section className="space-y-2">
          <h2 className="font-bold text-base text-primary">المادة الأولى: موضوع العقد</h2>
          <div className="p-3 rounded-lg bg-background border text-sm space-y-1">
            <p><span className="font-semibold">عنوان الخدمة/المشروع:</span> {subjectTitle}</p>
            {project?.categories?.name && <p><span className="font-semibold">التصنيف:</span> {project.categories.name}</p>}
            {project?.regions?.name && <p><span className="font-semibold">المنطقة:</span> {project.regions.name}{project?.cities?.name ? ` - ${project.cities.name}` : ""}</p>}
            {service?.service_number && <p><span className="font-semibold">رقم الخدمة:</span> <span className="font-mono">{service.service_number}</span></p>}
            {subjectDesc && (
              <div className="pt-2">
                <p className="font-semibold mb-1">وصف الخدمة:</p>
                <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">{subjectDesc}</p>
              </div>
            )}
          </div>
        </section>

        {/* المادة الثانية — نطاق العمل والتزامات المزود */}
        <section className="space-y-2">
          <h2 className="font-bold text-base text-primary">المادة الثانية: نطاق العمل والتزامات الطرف الثاني (مقدم الخدمة)</h2>
          <div className="p-3 rounded-lg bg-background border text-sm space-y-2">
            {scope && (
              <div>
                <p className="font-semibold mb-1">نطاق العمل المتفق عليه:</p>
                <p className="whitespace-pre-wrap leading-relaxed">{scope}</p>
              </div>
            )}
            {acceptedBid?.cover_letter && (
              <div className="pt-2 border-t">
                <p className="font-semibold mb-1">بيان مقدم الخدمة (من العرض المقبول):</p>
                <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">{acceptedBid.cover_letter}</p>
              </div>
            )}
            <ul className="list-disc list-inside space-y-1 pt-2 border-t text-foreground/90">
              <li>تنفيذ الخدمة وفق المواصفات والنطاق المتفق عليه أعلاه بأعلى جودة مهنية.</li>
              <li>الالتزام بالمدة الزمنية المحددة في المادة الرابعة.</li>
              <li>تسليم المخرجات عبر قسم التسليمات في المنصة وإجراء التعديلات المعقولة عند الطلب.</li>
              <li>الحفاظ على سرية بيانات الطرف الأول وعدم استخدامها خارج نطاق التعاقد.</li>
            </ul>
          </div>
        </section>

        {/* المادة الثالثة — التزامات الجمعية */}
        <section className="space-y-2">
          <h2 className="font-bold text-base text-primary">المادة الثالثة: التزامات الطرف الأول (الجمعية)</h2>
          <div className="p-3 rounded-lg bg-background border text-sm">
            <ul className="list-disc list-inside space-y-1 text-foreground/90">
              <li>تزويد مقدم الخدمة بالمواد والمعلومات اللازمة لتنفيذ نطاق العمل في الوقت المناسب.</li>
              <li>سداد قيمة العقد عبر نظام الضمان المالي المعتمد في المنصة.</li>
              <li>مراجعة التسليمات خلال مدة معقولة وإبداء الملاحظات بشكل واضح ومحدد.</li>
              <li>الإفراج عن الضمان المالي عند اكتمال التسليم وقبوله.</li>
            </ul>
          </div>
        </section>

        {/* المادة الرابعة — المقابل المالي والمدة */}
        <section className="space-y-2">
          <h2 className="font-bold text-base text-primary">المادة الرابعة: المقابل المالي ومدة التنفيذ</h2>
          <div className="p-3 rounded-lg bg-background border text-sm grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex justify-between gap-2"><span className="text-muted-foreground">قيمة العقد:</span><span className="font-bold">{amount.toLocaleString()} ر.س</span></div>
            {timeline !== null && (
              <div className="flex justify-between gap-2"><span className="text-muted-foreground">مدة التنفيذ:</span><span className="font-semibold">{timeline} يوم</span></div>
            )}
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">حالة الضمان المالي:</span>
              <Badge variant="outline" className="text-xs">
                {escrow?.status === "held" ? "محتجز" : escrow?.status === "released" ? "محرر" : escrow?.status === "refunded" ? "مسترد" : escrow?.status || "—"}
              </Badge>
            </div>
            {escrow?.escrow_number && (
              <div className="flex justify-between gap-2"><span className="text-muted-foreground">رقم الضمان:</span><span className="font-mono text-xs">{escrow.escrow_number}</span></div>
            )}
          </div>
        </section>

        {/* المادة الخامسة — الضمان والتسليمات */}
        <section className="space-y-2">
          <h2 className="font-bold text-base text-primary">المادة الخامسة: آلية الضمان والتسليم</h2>
          <p className="p-3 rounded-lg bg-background border text-sm leading-relaxed">
            يُحتَجز المبلغ في نظام الضمان المالي للمنصة فور توقيع العقد، ولا يُفرَج عنه لمقدم الخدمة إلا بعد قبول الطرف الأول للتسليم النهائي.
            في حال نشوء أي خلاف يحق للطرفين فتح نزاع رسمي عبر المنصة، ويُجمَّد الضمان حتى الفصل فيه.
          </p>
        </section>

        {/* المادة السادسة — البنود العامة */}
        <section className="space-y-2">
          <h2 className="font-bold text-base text-primary">المادة السادسة: البنود والأحكام العامة</h2>
          <div className="space-y-1.5">
            {LEGAL_CLAUSES.map((c, i) => {
              const Icon = c.icon;
              return (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30 text-sm">
                  <Icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{c.text}</span>
                </div>
              );
            })}
          </div>
        </section>

        <Separator />

        {/* Signatures */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border-2 border-dashed text-center space-y-1">
            <p className="text-xs text-muted-foreground">توقيع الطرف الأول</p>
            <p className="font-bold">{partyDisplay(association)}</p>
            {contract.association_signed_at ? (
              <>
                <p className="text-success font-semibold text-sm flex items-center gap-1 justify-center"><Check className="h-4 w-4" /> موقّع إلكترونياً</p>
                <p className="text-xs text-muted-foreground">{fmtDate(contract.association_signed_at)}</p>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">— بانتظار التوقيع —</p>
            )}
          </div>
          <div className="p-4 rounded-lg border-2 border-dashed text-center space-y-1">
            <p className="text-xs text-muted-foreground">توقيع الطرف الثاني</p>
            <p className="font-bold">{partyDisplay(provider)}</p>
            {contract.provider_signed_at ? (
              <>
                <p className="text-success font-semibold text-sm flex items-center gap-1 justify-center"><Check className="h-4 w-4" /> موقّع إلكترونياً</p>
                <p className="text-xs text-muted-foreground">{fmtDate(contract.provider_signed_at)}</p>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">— بانتظار التوقيع —</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export function PrintContractButton() {
  return (
    <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden">
      <Printer className="h-4 w-4 me-1" /> طباعة / حفظ PDF
    </Button>
  );
}
