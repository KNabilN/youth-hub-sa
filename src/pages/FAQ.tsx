import { useSiteContent } from "@/hooks/useSiteContent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

export default function FAQ() {
  const { data } = useSiteContent("faq");
  const faq = data || { title: "الأسئلة الشائعة", subtitle: "", categories: [] };

  return (
    <>
      <section className="py-20 px-4 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto max-w-3xl text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <HelpCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold">{faq.title}</h1>
          {faq.subtitle && <p className="text-muted-foreground">{faq.subtitle}</p>}
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="container mx-auto max-w-3xl">
          {faq.categories?.length > 0 ? (
            <Tabs defaultValue="0" dir="rtl">
              <TabsList className="w-full overflow-x-auto flex-nowrap h-auto gap-1 mb-8 justify-start">
                {faq.categories.map((cat: any, i: number) => (
                  <TabsTrigger key={i} value={String(i)} className="flex-1 min-w-[120px]">
                    {cat.title}
                  </TabsTrigger>
                ))}
              </TabsList>

              {faq.categories.map((cat: any, i: number) => (
                <TabsContent key={i} value={String(i)}>
                  <Accordion type="single" collapsible className="space-y-2">
                    {cat.items?.map((item: any, j: number) => (
                      <AccordionItem key={j} value={`${i}-${j}`} className="border border-border rounded-xl px-4 data-[state=open]:bg-muted/30">
                        <AccordionTrigger className="text-sm font-medium text-right hover:no-underline">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <p className="text-center text-muted-foreground">لا توجد أسئلة بعد.</p>
          )}
        </div>
      </section>
    </>
  );
}
