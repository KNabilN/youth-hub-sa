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
    <div className="min-h-screen bg-background">
      <AuthModal open={open} onOpenChange={handleOpenChange} defaultMode={defaultMode} />
    </div>
  );
}
