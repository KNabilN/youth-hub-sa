const errorMap: Record<string, string> = {
  "Email not confirmed": "لم يتم تأكيد البريد الإلكتروني. يرجى التحقق من بريدك.",
  "Invalid login credentials": "بيانات الدخول غير صحيحة",
  "User already registered": "البريد الإلكتروني مسجل مسبقاً",
  "Password should be at least 6 characters": "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
  "Email rate limit exceeded": "تم تجاوز الحد المسموح. يرجى المحاولة لاحقاً.",
  "For security purposes, you can only request this after": "لأسباب أمنية، يرجى الانتظار قبل المحاولة مرة أخرى.",
  "User not found": "المستخدم غير موجود",
  "New password should be different from the old password": "كلمة المرور الجديدة يجب أن تختلف عن القديمة",
  "Auth session missing": "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.",
  "Token has expired or is invalid": "الرابط منتهي أو غير صالح",
  "Unable to validate email address: invalid format": "صيغة البريد الإلكتروني غير صحيحة",
  "Signups not allowed for this instance": "التسجيل غير متاح حالياً",
};

export function translateError(message: string): string {
  for (const [key, value] of Object.entries(errorMap)) {
    if (message.includes(key)) return value;
  }
  return "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";
}
