import { useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ServiceGalleryProps {
  mainImage: string | null;
  gallery: string[];
}

export function ServiceGallery({ mainImage, gallery }: ServiceGalleryProps) {
  const images = [mainImage, ...gallery].filter(Boolean) as string[];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ direction: "rtl" });

  if (images.length === 0) {
    return (
      <div className="w-full aspect-video bg-muted rounded-xl flex items-center justify-center">
        <span className="text-muted-foreground">لا توجد صور</span>
      </div>
    );
  }

  const scrollTo = (index: number) => {
    setSelectedIndex(index);
    emblaApi?.scrollTo(index);
  };

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl border bg-muted" ref={emblaRef}>
        <div className="flex">
          {images.map((src, i) => (
            <div key={i} className="flex-[0_0_100%] min-w-0">
              <img
                src={src}
                alt={`صورة ${i + 1}`}
                className="w-full aspect-video object-cover"
              />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <>
            <Button
              size="icon"
              variant="secondary"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100"
              onClick={() => { emblaApi?.scrollPrev(); setSelectedIndex(Math.max(0, selectedIndex - 1)); }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100"
              onClick={() => { emblaApi?.scrollNext(); setSelectedIndex(Math.min(images.length - 1, selectedIndex + 1)); }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className={cn(
                "shrink-0 w-16 h-12 rounded-md overflow-hidden border-2 transition-all",
                selectedIndex === i ? "border-primary ring-1 ring-primary" : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
