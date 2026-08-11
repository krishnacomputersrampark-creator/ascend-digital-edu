export type SettingFieldType =
  | "text" | "textarea" | "number" | "switch" | "select" | "tags" | "color" | "email" | "url" | "time";

export type SettingField = {
  key: string;
  label: string;
  type: SettingFieldType;
  options?: Array<{ value: string; label: string }>;
  help?: string;
  placeholder?: string;
  span?: 1 | 2;
};

export type SettingsGroupDef = {
  id: string;
  title: string;
  description: string;
  group: string;
  settingKey: string;
  keywords: string[];
  cards: Array<{ title: string; fields: SettingField[] }>;
};

export const SETTINGS_GROUPS: SettingsGroupDef[] = [
  {
    id: "institute",
    title: "Institute Profile",
    description: "Identity, contact details and public information for Krishna Computer Center.",
    group: "institute",
    settingKey: "profile",
    keywords: ["institute", "profile", "logo", "director", "address", "social", "footer", "about", "vision", "mission"],
    cards: [
      {
        title: "Identity",
        fields: [
          { key: "institute_name", label: "Institute Name", type: "text" },
          { key: "tagline", label: "Tagline", type: "text" },
          { key: "logo_url", label: "Logo URL", type: "url" },
          { key: "favicon_url", label: "Favicon URL", type: "url" },
          { key: "director_name", label: "Director Name", type: "text" },
          { key: "founder_name", label: "Founder Name", type: "text" },
          { key: "established_year", label: "Established Year", type: "text" },
          { key: "registration_number", label: "Registration Number", type: "text" },
        ],
      },
      {
        title: "Contact",
        fields: [
          { key: "email", label: "Email", type: "email" },
          { key: "phone", label: "Phone", type: "text" },
          { key: "whatsapp", label: "WhatsApp", type: "text" },
          { key: "website", label: "Website", type: "url" },
          { key: "office_timing", label: "Office Timing", type: "text" },
          { key: "address", label: "Address", type: "textarea", span: 2 },
        ],
      },
      {
        title: "Content",
        fields: [
          { key: "about_us", label: "About Us", type: "textarea", span: 2 },
          { key: "vision", label: "Vision", type: "textarea", span: 2 },
          { key: "mission", label: "Mission", type: "textarea", span: 2 },
          { key: "footer_text", label: "Footer Text", type: "textarea", span: 2 },
        ],
      },
      {
        title: "Social Media",
        fields: [
          { key: "facebook", label: "Facebook", type: "url" },
          { key: "instagram", label: "Instagram", type: "url" },
          { key: "youtube", label: "YouTube", type: "url" },
          { key: "telegram", label: "Telegram", type: "url" },
          { key: "linkedin", label: "LinkedIn", type: "url" },
        ],
      },
    ],
  },
  {
    id: "preferences",
    title: "Preferences",
    description: "Language, formats, theme colours and feature switches for the whole ERP.",
    group: "preferences",
    settingKey: "general",
    keywords: ["language", "hindi", "english", "date", "time", "currency", "timezone", "pagination", "theme", "colour", "color", "enable"],
    cards: [
      {
        title: "Localization",
        fields: [
          { key: "default_language", label: "Default Language", type: "select", options: [
            { value: "en", label: "English" }, { value: "hi", label: "Hindi" }, { value: "both", label: "Hindi + English" },
          ] },
          { key: "date_format", label: "Date Format", type: "select", options: [
            { value: "DD/MM/YYYY", label: "DD/MM/YYYY" }, { value: "MM/DD/YYYY", label: "MM/DD/YYYY" }, { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
          ] },
          { key: "time_format", label: "Time Format", type: "select", options: [
            { value: "12h", label: "12 Hour" }, { value: "24h", label: "24 Hour" },
          ] },
          { key: "currency", label: "Currency", type: "select", options: [{ value: "INR", label: "INR (₹)" }, { value: "USD", label: "USD ($)" }] },
          { key: "timezone", label: "Timezone", type: "text" },
        ],
      },
      {
        title: "Defaults",
        fields: [
          { key: "default_branch", label: "Default Branch", type: "text", help: "Branch name shown first in selectors" },
          { key: "default_session", label: "Default Session", type: "text" },
          { key: "pagination_size", label: "Pagination Size", type: "number" },
        ],
      },
      {
        title: "Theme",
        fields: [
          { key: "theme", label: "Theme", type: "select", options: [{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }] },
          { key: "primary_color", label: "Primary Color", type: "color" },
          { key: "secondary_color", label: "Secondary Color", type: "color" },
        ],
      },
      {
        title: "Feature Switches",
        fields: [
          { key: "enable_notifications", label: "Enable Notifications", type: "switch" },
          { key: "enable_email", label: "Enable Email", type: "switch" },
          { key: "enable_sms", label: "Enable SMS", type: "switch" },
          { key: "enable_whatsapp", label: "Enable WhatsApp", type: "switch" },
          { key: "enable_online_admission", label: "Enable Online Admission", type: "switch" },
          { key: "enable_online_payment", label: "Enable Online Payment", type: "switch" },
          { key: "enable_student_login", label: "Enable Student Login", type: "switch" },
          { key: "enable_teacher_login", label: "Enable Teacher Login", type: "switch" },
        ],
      },
    ],
  },
  {
    id: "admission-config",
    title: "Admission Configuration",
    description: "Control the public admission window, numbering, documents and notifications.",
    group: "admission",
    settingKey: "config",
    keywords: ["admission", "application", "prefix", "documents", "file size", "approval", "welcome letter"],
    cards: [
      {
        title: "Application",
        fields: [
          { key: "admission_open", label: "Admission Open", type: "switch" },
          { key: "approval_required", label: "Approval Required", type: "switch" },
          { key: "application_prefix", label: "Application Prefix", type: "text" },
          { key: "application_format", label: "Application Number Format", type: "text", help: "Use {PREFIX}, {YYYY}, {SEQ}" },
          { key: "application_fee", label: "Application Fee (₹)", type: "number" },
          { key: "default_status", label: "Default Status", type: "select", options: [
            { value: "pending", label: "Pending" }, { value: "approved", label: "Approved" },
          ] },
        ],
      },
      {
        title: "Documents",
        fields: [
          { key: "required_documents", label: "Required Documents", type: "tags", span: 2 },
          { key: "allowed_file_types", label: "Allowed File Types", type: "tags", span: 2 },
          { key: "max_file_size_mb", label: "Maximum File Size (MB)", type: "number" },
        ],
      },
      {
        title: "Automation",
        fields: [
          { key: "auto_student_creation", label: "Auto Student Creation", type: "switch" },
          { key: "auto_welcome_letter", label: "Auto Welcome Letter", type: "switch" },
          { key: "auto_fee_receipt", label: "Auto Fee Receipt", type: "switch" },
          { key: "email_notification", label: "Email Notification", type: "switch" },
          { key: "whatsapp_notification", label: "WhatsApp Notification", type: "switch" },
          { key: "sms_notification", label: "SMS Notification", type: "switch" },
        ],
      },
    ],
  },
  {
    id: "student-config",
    title: "Student Configuration",
    description: "Student numbering prefixes, required data and ID card behaviour.",
    group: "student",
    settingKey: "config",
    keywords: ["student", "prefix", "enrollment", "id card", "qr", "status", "photo"],
    cards: [
      {
        title: "Numbering",
        fields: [
          { key: "student_id_prefix", label: "Student ID Prefix", type: "text" },
          { key: "admission_number_prefix", label: "Admission Number Prefix", type: "text" },
          { key: "enrollment_number_prefix", label: "Enrollment Number Prefix", type: "text" },
        ],
      },
      {
        title: "Rules",
        fields: [
          { key: "default_status", label: "Default Student Status", type: "text" },
          { key: "required_fields", label: "Required Student Fields", type: "tags", span: 2 },
          { key: "photo_required", label: "Student Photo Required", type: "switch" },
          { key: "id_card_generation", label: "ID Card Generation", type: "switch" },
          { key: "qr_code_generation", label: "QR Code Generation", type: "switch" },
          { key: "auto_student_login", label: "Auto Student Login", type: "switch" },
        ],
      },
    ],
  },
  {
    id: "teacher-config",
    title: "Teacher Configuration",
    description: "Teacher codes, login policy and required documents.",
    group: "teacher",
    settingKey: "config",
    keywords: ["teacher", "faculty", "employee code", "password", "documents"],
    cards: [
      {
        title: "Numbering & Status",
        fields: [
          { key: "teacher_id_prefix", label: "Teacher ID Prefix", type: "text" },
          { key: "employee_code_prefix", label: "Employee Code Prefix", type: "text" },
          { key: "default_status", label: "Default Teacher Status", type: "text" },
        ],
      },
      {
        title: "Access & Documents",
        fields: [
          { key: "faculty_login", label: "Faculty Login", type: "switch" },
          { key: "password_min_length", label: "Minimum Password Length", type: "number" },
          { key: "require_strong_password", label: "Require Strong Password", type: "switch" },
          { key: "photo_required", label: "Teacher Photo Required", type: "switch" },
          { key: "documents_required", label: "Teacher Documents", type: "tags", span: 2 },
        ],
      },
    ],
  },
  {
    id: "course-config",
    title: "Course Configuration",
    description: "Defaults applied when new courses are created.",
    group: "course",
    settingKey: "config",
    keywords: ["course", "prefix", "duration", "mode"],
    cards: [
      {
        title: "Course Defaults",
        fields: [
          { key: "course_code_prefix", label: "Course Code Prefix", type: "text" },
          { key: "default_duration", label: "Default Duration", type: "number" },
          { key: "default_duration_unit", label: "Duration Unit", type: "select", options: [
            { value: "months", label: "Months" }, { value: "weeks", label: "Weeks" }, { value: "days", label: "Days" }, { value: "hours", label: "Hours" },
          ] },
          { key: "default_mode", label: "Default Mode", type: "select", options: [
            { value: "offline", label: "Offline" }, { value: "online", label: "Online" }, { value: "hybrid", label: "Hybrid" },
          ] },
        ],
      },
    ],
  },
  {
    id: "batch-config",
    title: "Batch Configuration",
    description: "Batch capacity, timings, working days and assignment rules.",
    group: "batch",
    settingKey: "config",
    keywords: ["batch", "timing", "capacity", "working days", "session", "teacher assignment"],
    cards: [
      {
        title: "Capacity & Codes",
        fields: [
          { key: "batch_code_prefix", label: "Batch Code Prefix", type: "text" },
          { key: "default_capacity", label: "Default Capacity", type: "number" },
          { key: "maximum_students", label: "Maximum Students", type: "number" },
          { key: "session", label: "Session", type: "text" },
        ],
      },
      {
        title: "Schedule Rules",
        fields: [
          { key: "allowed_timings", label: "Allowed Batch Timings", type: "tags", span: 2 },
          { key: "working_days", label: "Working Days", type: "tags", span: 2 },
          { key: "teacher_conflict_check", label: "Teacher Assignment Conflict Check", type: "switch" },
          { key: "one_batch_per_student", label: "One Active Batch Per Student", type: "switch" },
        ],
      },
    ],
  },
  {
    id: "fee-config",
    title: "Fee & Receipt Configuration",
    description: "Receipt numbering, payment modes, installments and receipt content.",
    group: "fee",
    settingKey: "config",
    keywords: ["fee", "receipt", "invoice", "payment mode", "installment", "late fee", "discount", "terms"],
    cards: [
      {
        title: "Numbering",
        fields: [
          { key: "receipt_prefix", label: "Receipt Prefix", type: "text" },
          { key: "receipt_format", label: "Receipt Number Format", type: "text", help: "Use {PREFIX}, {YYYY}, {SEQ}" },
          { key: "invoice_prefix", label: "Invoice Prefix", type: "text" },
        ],
      },
      {
        title: "Payments",
        fields: [
          { key: "payment_modes", label: "Payment Modes", type: "tags", span: 2 },
          { key: "installments_enabled", label: "Installments Enabled", type: "switch" },
          { key: "max_installments", label: "Maximum Installments", type: "number" },
          { key: "late_fee_enabled", label: "Late Fee Enabled", type: "switch" },
          { key: "late_fee_amount", label: "Late Fee Amount (₹)", type: "number" },
          { key: "max_discount_percent", label: "Maximum Discount (%)", type: "number" },
        ],
      },
      {
        title: "Receipt Content",
        fields: [
          { key: "receipt_logo_url", label: "Receipt Logo URL", type: "url", span: 2 },
          { key: "receipt_footer", label: "Receipt Footer", type: "textarea", span: 2 },
          { key: "terms", label: "Terms & Conditions", type: "textarea", span: 2 },
        ],
      },
    ],
  },
  {
    id: "certificate-config",
    title: "Certificate Configuration",
    description: "Certificate numbering, templates, signatures and QR verification.",
    group: "certificate",
    settingKey: "config",
    keywords: ["certificate", "qr", "verification", "signature", "diploma", "template"],
    cards: [
      {
        title: "Certificate",
        fields: [
          { key: "certificate_prefix", label: "Certificate Number Prefix", type: "text" },
          { key: "certificate_types", label: "Certificate Types", type: "tags", span: 2 },
          { key: "template", label: "Certificate Template", type: "text" },
          { key: "logo_url", label: "Institute Logo URL", type: "url" },
          { key: "signature_url", label: "Director Signature URL", type: "url" },
          { key: "qr_verification", label: "QR Verification", type: "switch" },
          { key: "verification_url", label: "Verification URL", type: "text" },
          { key: "footer", label: "Certificate Footer", type: "textarea", span: 2 },
        ],
      },
    ],
  },
  {
    id: "security",
    title: "Security",
    description: "Session, password policy, login attempts and audit logging.",
    group: "security",
    settingKey: "config",
    keywords: ["security", "session", "password", "login attempts", "audit", "two factor", "ip"],
    cards: [
      {
        title: "Policies",
        fields: [
          { key: "session_timeout_minutes", label: "Session Timeout (minutes)", type: "number" },
          { key: "password_min_length", label: "Minimum Password Length", type: "number" },
          { key: "require_strong_password", label: "Require Strong Password", type: "switch" },
          { key: "login_attempt_limit", label: "Login Attempt Limit", type: "number" },
          { key: "audit_logging", label: "Audit Logging", type: "switch" },
          { key: "two_factor_ready", label: "Two Factor Authentication Readiness", type: "switch" },
          { key: "ip_restriction_ready", label: "IP Restriction Readiness", type: "switch" },
          { key: "allowed_ips", label: "Allowed IPs", type: "tags", span: 2 },
        ],
      },
    ],
  },
  {
    id: "website",
    title: "Public Website",
    description: "Content shown on the public website. Plain text only — no HTML or scripts.",
    group: "website",
    settingKey: "content",
    keywords: ["website", "public", "about", "vision", "mission", "notice", "footer", "contact", "social"],
    cards: [
      {
        title: "Content",
        fields: [
          { key: "about_us", label: "About Us", type: "textarea", span: 2 },
          { key: "vision", label: "Vision", type: "textarea", span: 2 },
          { key: "mission", label: "Mission", type: "textarea", span: 2 },
          { key: "notice", label: "Highlighted Notice", type: "textarea", span: 2 },
          { key: "footer", label: "Footer", type: "textarea", span: 2 },
        ],
      },
      {
        title: "Contact & Availability",
        fields: [
          { key: "contact_email", label: "Contact Email", type: "email" },
          { key: "contact_phone", label: "Contact Phone", type: "text" },
          { key: "office_timing", label: "Office Timing", type: "text" },
          { key: "admission_open", label: "Show Admission Open", type: "switch" },
          { key: "facebook", label: "Facebook", type: "url" },
          { key: "instagram", label: "Instagram", type: "url" },
          { key: "youtube", label: "YouTube", type: "url" },
        ],
      },
    ],
  },
];

export const INTEGRATION_DEFS = [
  {
    provider: "smtp",
    category: "email",
    title: "Email / SMTP",
    keywords: ["email", "smtp", "mail", "sender"],
    fields: [
      { key: "host", label: "SMTP Host", type: "text" as const },
      { key: "port", label: "SMTP Port", type: "number" as const },
      { key: "username", label: "SMTP Username", type: "text" as const },
      { key: "encryption", label: "Encryption", type: "select" as const, options: [
        { value: "tls", label: "TLS" }, { value: "ssl", label: "SSL" }, { value: "none", label: "None" },
      ] },
      { key: "from_name", label: "From Name", type: "text" as const },
      { key: "from_email", label: "From Email", type: "email" as const },
    ],
    secrets: ["SMTP_PASSWORD"],
  },
  {
    provider: "whatsapp",
    category: "messaging",
    title: "WhatsApp",
    keywords: ["whatsapp", "message", "business"],
    fields: [
      { key: "provider_name", label: "Provider", type: "text" as const },
      { key: "api_url", label: "API URL", type: "url" as const },
      { key: "phone_number_id", label: "Phone Number ID", type: "text" as const },
      { key: "business_account_id", label: "Business Account ID", type: "text" as const },
      { key: "template_namespace", label: "Template Namespace", type: "text" as const },
    ],
    secrets: ["WHATSAPP_API_KEY"],
  },
  {
    provider: "sms",
    category: "messaging",
    title: "SMS",
    keywords: ["sms", "sender id", "text message"],
    fields: [
      { key: "provider_name", label: "Provider", type: "text" as const },
      { key: "api_url", label: "API URL", type: "url" as const },
      { key: "sender_id", label: "Sender ID", type: "text" as const },
      { key: "template_id", label: "Template ID", type: "text" as const },
    ],
    secrets: ["SMS_API_KEY"],
  },
  {
    provider: "razorpay",
    category: "payment",
    title: "Payment Gateway (Razorpay)",
    keywords: ["payment", "razorpay", "gateway", "webhook", "currency"],
    fields: [
      { key: "key_id", label: "Key ID", type: "text" as const },
      { key: "currency", label: "Currency", type: "text" as const },
      { key: "mode", label: "Mode", type: "select" as const, options: [
        { value: "test", label: "Test Mode" }, { value: "live", label: "Live Mode" },
      ] },
      { key: "webhook_url", label: "Webhook URL", type: "text" as const },
      { key: "success_url", label: "Payment Success URL", type: "text" as const },
      { key: "failure_url", label: "Payment Failure URL", type: "text" as const },
    ],
    secrets: ["RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"],
  },
];

export const PERMISSION_KEYS = [
  "view", "create", "edit", "delete", "approve", "export", "print", "manage_settings", "manage_users", "manage_reports",
];
