import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ExternalLink, Shield } from "lucide-react";
import { AdminUserChatThread } from "./AdminUserChatThread";
import { getDisplayName } from "@/lib/utils";

interface Props {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 user: {
 id: string;
 full_name?: string | null;
 organization_name?: string | null;
 avatar_url?: string | null;
 user_number?: string | null;
 } | null;
}

export function AdminUserChatSheet({ open, onOpenChange, user }: Props) {
 const navigate = useNavigate();
 if (!user) return null;
 const displayName = getDisplayName(user as any);

 return (
 <Sheet open={open} onOpenChange={onOpenChange}>
 <SheetContent side="left" className="w-full sm:max-w-[480px] p-0 flex flex-col">
 <SheetHeader className="p-4 border-b bg-card space-y-3">
 <SheetTitle className="flex items-center gap-2 text-base">
 <Shield className="h-4 w-4 text-primary" />
 محادثة إدارية
 </SheetTitle>
 <div className="flex items-center gap-3">
 <Avatar className="h-11 w-11">
 <AvatarImage src={user.avatar_url || undefined} />
 <AvatarFallback>{displayName?.[0] ?? "؟"}</AvatarFallback>
 </Avatar>
 <div className="flex-1 min-w-0">
 <p className="font-semibold truncate">{displayName}</p>
 {user.user_number && (
 <p className="text-xs text-muted-foreground font-mono">{user.user_number}</p>
 )}
 </div>
 <Button
 variant="outline"
 size="sm"
 className="gap-1"
 onClick={() => {
 onOpenChange(false);
 navigate("/admin/messages");
 }}
 >
 <ExternalLink className="h-3.5 w-3.5" />
 صفحة كاملة
 </Button>
 </div>
 </SheetHeader>
 <div className="flex-1 min-h-0">
 <AdminUserChatThread
 userId={user.id}
 otherPartyName={displayName}
 otherPartyAvatar={user.avatar_url}
 />
 </div>
 </SheetContent>
 </Sheet>
 );
}
