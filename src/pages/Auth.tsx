import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthModal from "@/components/AuthModal";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const defaultMode = searchParams.get("mode") === "register" ? "register" : "login";
  const [open, setOpen] = useState(true);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-muted flex items-center justify-center" dir="rtl">
      <AuthModal open={open} onOpenChange={handleOpenChange} defaultMode={defaultMode} />
    </div>
  );
}
