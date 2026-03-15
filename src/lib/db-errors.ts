type DatabaseErrorLike = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

const UNIQUE_CONSTRAINT_MESSAGES: Record<string, string> = {
  projects_request_number_unique: "حدث تعارض في توليد رقم الطلب. فضلاً أعد المحاولة.",
  support_tickets_ticket_number_unique: "حدث تعارض في توليد رقم التذكرة. فضلاً أعد المحاولة.",
  micro_services_service_number_unique: "حدث تعارض في توليد رقم الخدمة. فضلاً أعد المحاولة.",
  disputes_dispute_number_unique: "حدث تعارض في توليد رقم النزاع. فضلاً أعد المحاولة.",
  escrow_transactions_escrow_number_unique: "حدث تعارض في توليد رقم الضمان. فضلاً أعد المحاولة.",
  bank_transfers_transfer_number_unique: "حدث تعارض في توليد رقم التحويل. فضلاً أعد المحاولة.",
  withdrawal_requests_withdrawal_number_unique: "حدث تعارض في توليد رقم السحب. فضلاً أعد المحاولة.",
  profiles_user_number_unique: "حدث تعارض في توليد رقم المستخدم. فضلاً أعد المحاولة.",
};

function extractConstraint(errorMessage: string): string | null {
  const match = errorMessage.match(/constraint\s+"([^"]+)"/i);
  return match?.[1] ?? null;
}

export function getFriendlyDatabaseError(
  error: unknown,
  fallback = "حدث خطأ أثناء الحفظ. حاول مرة أخرى."
): string {
  if (!error) return fallback;

  const dbError = error as DatabaseErrorLike;
  const message = dbError.message ?? (error instanceof Error ? error.message : "");
  const code = dbError.code;

  const isUniqueViolation = code === "23505" || message.includes("duplicate key value violates unique constraint");

  if (isUniqueViolation) {
    const constraint = extractConstraint(message);
    if (constraint && UNIQUE_CONSTRAINT_MESSAGES[constraint]) {
      return UNIQUE_CONSTRAINT_MESSAGES[constraint];
    }
    return "حدث تعارض أثناء الحفظ. فضلاً أعد المحاولة.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
