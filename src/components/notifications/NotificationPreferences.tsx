import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { BellRing } from "lucide-react";
import { getPreferencesForRole, getAllKeysForRole, isNotificationEnabled } from "@/lib/notification-preferences";
import type { AppRole } from "@/lib/notification-preferences";

interface NotificationPreferencesProps {
  role: AppRole | null;
  emailNotifications: boolean;
  onEmailNotificationsChange: (v: boolean) => void;
  preferences: Record<string, boolean>;
  onPreferencesChange: (prefs: Record<string, boolean>) => void;
}

export function NotificationPreferences({
  role,
  emailNotifications,
  onEmailNotificationsChange,
  preferences,
  onPreferencesChange,
}: NotificationPreferencesProps) {
  if (!role) return null;

  const groups = getPreferencesForRole(role as AppRole);
  const allKeys = getAllKeysForRole(role as AppRole);

  const togglePref = (key: string, value: boolean) => {
    onPreferencesChange({ ...preferences, [key]: value });
  };

  const enableAll = () => {
    const updated = { ...preferences };
    allKeys.forEach((k) => {
      updated[k] = true;
    });
    onPreferencesChange(updated);
  };

  const disableAll = () => {
    const updated = { ...preferences };
    allKeys.forEach((k) => {
      updated[k] = false;
    });
    onPreferencesChange(updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BellRing className="h-5 w-5 text-primary" /> إعدادات الإشعارات
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Master toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">إشعارات البريد الإلكتروني</p>
            <p className="text-xs text-muted-foreground">استلام إشعارات عبر البريد عند وجود تحديثات جديدة</p>
          </div>
          <Switch checked={emailNotifications} onCheckedChange={onEmailNotificationsChange} />
        </div>

        {/* Granular preferences - shown only when master is on */}
        {emailNotifications && groups.length > 0 && (
          <div className="space-y-4 pt-2 animate-in fade-in-0 slide-in-from-top-2 duration-300">
            {/* Enable/Disable all */}
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={enableAll}>
                تفعيل الكل
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={disableAll}>
                إيقاف الكل
              </Button>
            </div>

            {groups.map((group) => (
              <div key={group.groupLabel} className="bg-muted/30 rounded-xl border p-4 space-y-3">
                <h4 className="text-sm font-semibold text-primary">{group.groupLabel}</h4>
                <div className="space-y-2">
                  {group.types.map((type) => (
                    <div key={type.key} className="flex items-center justify-between py-1.5">
                      <span className="text-sm">{type.label}</span>
                      <Switch
                        checked={isNotificationEnabled(preferences, type.key)}
                        onCheckedChange={(v) => togglePref(type.key, v)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
