// Reusable notification service stubs. Wire real providers (SMTP/SMS) later.
// Each function is safe to call and never throws; it only logs to console for now.

export type AdmissionEmailPayload = {
  to: string;
  applicationNo: string;
  fullName: string;
  courseName?: string | null;
  branchName?: string | null;
  remarks?: string | null;
};

async function safeLog(kind: string, payload: unknown) {
  try {
    // eslint-disable-next-line no-console
    console.info(`[notify:${kind}]`, payload);
  } catch {}
}

export const emailService = {
  admissionSubmitted: (p: AdmissionEmailPayload) => safeLog("email.submitted", p),
  admissionApproved: (p: AdmissionEmailPayload) => safeLog("email.approved", p),
  admissionRejected: (p: AdmissionEmailPayload) => safeLog("email.rejected", p),
};

export type AdmissionSmsPayload = {
  to: string;
  applicationNo: string;
  message?: string;
};

export const smsService = {
  admissionSubmitted: (p: AdmissionSmsPayload) => safeLog("sms.submitted", p),
  admissionApproved: (p: AdmissionSmsPayload) => safeLog("sms.approved", p),
  admissionRejected: (p: AdmissionSmsPayload) => safeLog("sms.rejected", p),
};