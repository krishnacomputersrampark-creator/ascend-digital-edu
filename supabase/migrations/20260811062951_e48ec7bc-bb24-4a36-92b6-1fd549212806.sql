
-- ============ MASTERS ============
CREATE TABLE public.master_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  icon text,
  is_system boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.master_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.master_categories TO authenticated;
GRANT ALL ON public.master_categories TO service_role;
ALTER TABLE public.master_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "master_categories read all" ON public.master_categories FOR SELECT USING (true);
CREATE POLICY "master_categories super admin write" ON public.master_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

CREATE TABLE public.master_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.master_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX master_values_cat_code_uniq ON public.master_values (category_id, lower(code));
CREATE UNIQUE INDEX master_values_cat_name_uniq ON public.master_values (category_id, lower(name));
GRANT SELECT ON public.master_values TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.master_values TO authenticated;
GRANT ALL ON public.master_values TO service_role;
ALTER TABLE public.master_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY "master_values read all" ON public.master_values FOR SELECT USING (true);
CREATE POLICY "master_values super admin write" ON public.master_values FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- ============ SYSTEM SETTINGS ============
CREATE TABLE public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_key text NOT NULL,
  setting_key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_public boolean NOT NULL DEFAULT false,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_key, setting_key)
);
GRANT SELECT ON public.system_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_settings TO authenticated;
GRANT ALL ON public.system_settings TO service_role;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "system_settings public read" ON public.system_settings FOR SELECT TO anon USING (is_public);
CREATE POLICY "system_settings auth read" ON public.system_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "system_settings super admin write" ON public.system_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- ============ MENU CONFIG ============
CREATE TABLE public.menu_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  icon text,
  path text,
  section text,
  sort_order integer NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  is_public boolean NOT NULL DEFAULT false,
  roles app_role[] NOT NULL DEFAULT ARRAY['super_admin','admin']::app_role[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.menu_config TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_config TO authenticated;
GRANT ALL ON public.menu_config TO service_role;
ALTER TABLE public.menu_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "menu_config read all" ON public.menu_config FOR SELECT USING (true);
CREATE POLICY "menu_config super admin write" ON public.menu_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- ============ FORM CONFIG ============
CREATE TABLE public.form_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.form_configs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.form_configs TO authenticated;
GRANT ALL ON public.form_configs TO service_role;
ALTER TABLE public.form_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "form_configs read all" ON public.form_configs FOR SELECT USING (true);
CREATE POLICY "form_configs super admin write" ON public.form_configs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

CREATE TABLE public.form_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_config_id uuid NOT NULL REFERENCES public.form_configs(id) ON DELETE CASCADE,
  field_key text NOT NULL,
  label text NOT NULL,
  field_type text NOT NULL DEFAULT 'text',
  is_required boolean NOT NULL DEFAULT false,
  is_visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  help_text text,
  placeholder text,
  default_value text,
  validation jsonb NOT NULL DEFAULT '{}'::jsonb,
  roles app_role[] NOT NULL DEFAULT ARRAY[]::app_role[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (form_config_id, field_key)
);
GRANT SELECT ON public.form_fields TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.form_fields TO authenticated;
GRANT ALL ON public.form_fields TO service_role;
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "form_fields read all" ON public.form_fields FOR SELECT USING (true);
CREATE POLICY "form_fields super admin write" ON public.form_fields FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- ============ NOTIFICATION TEMPLATES ============
CREATE TABLE public.notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  channel text NOT NULL DEFAULT 'email',
  name text NOT NULL,
  subject text,
  body text NOT NULL DEFAULT '',
  draft_body text,
  draft_subject text,
  variables text[] NOT NULL DEFAULT ARRAY[]::text[],
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (key, channel)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_templates TO authenticated;
GRANT ALL ON public.notification_templates TO service_role;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notification_templates auth read" ON public.notification_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "notification_templates super admin write" ON public.notification_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- ============ DOCUMENT TEMPLATES ============
CREATE TABLE public.document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  header text,
  footer text,
  logo_url text,
  signature_url text,
  terms text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.document_templates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_templates TO authenticated;
GRANT ALL ON public.document_templates TO service_role;
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "document_templates read all" ON public.document_templates FOR SELECT USING (true);
CREATE POLICY "document_templates super admin write" ON public.document_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- ============ NUMBERING ============
CREATE TABLE public.numbering_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  prefix text NOT NULL DEFAULT '',
  format text NOT NULL DEFAULT '{PREFIX}{YYYY}{SEQ}',
  padding integer NOT NULL DEFAULT 5,
  next_number integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.numbering_settings TO authenticated;
GRANT ALL ON public.numbering_settings TO service_role;
ALTER TABLE public.numbering_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "numbering auth read" ON public.numbering_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "numbering super admin write" ON public.numbering_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- ============ INTEGRATIONS (non-secret config only) ============
CREATE TABLE public.integration_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL UNIQUE,
  category text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  secret_keys text[] NOT NULL DEFAULT ARRAY[]::text[],
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integration_settings TO authenticated;
GRANT ALL ON public.integration_settings TO service_role;
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "integration_settings super admin all" ON public.integration_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- ============ ROLE PERMISSIONS ============
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  module text NOT NULL,
  permissions text[] NOT NULL DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role, module)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "role_permissions auth read" ON public.role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "role_permissions super admin write" ON public.role_permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- ============ CONFIGURATION HISTORY ============
CREATE TABLE public.configuration_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity text NOT NULL,
  entity_id text,
  label text,
  old_value jsonb,
  new_value jsonb,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_by_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.configuration_history TO authenticated;
GRANT ALL ON public.configuration_history TO service_role;
ALTER TABLE public.configuration_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "config_history admin read" ON public.configuration_history FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "config_history super admin insert" ON public.configuration_history FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- updated_at triggers
CREATE TRIGGER trg_master_categories_upd BEFORE UPDATE ON public.master_categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_master_values_upd BEFORE UPDATE ON public.master_values FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_system_settings_upd BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_menu_config_upd BEFORE UPDATE ON public.menu_config FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_form_configs_upd BEFORE UPDATE ON public.form_configs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_form_fields_upd BEFORE UPDATE ON public.form_fields FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_notification_templates_upd BEFORE UPDATE ON public.notification_templates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_document_templates_upd BEFORE UPDATE ON public.document_templates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_numbering_settings_upd BEFORE UPDATE ON public.numbering_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_integration_settings_upd BEFORE UPDATE ON public.integration_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_role_permissions_upd BEFORE UPDATE ON public.role_permissions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ SEED MASTERS ============
INSERT INTO public.master_categories (key, name, description, sort_order) VALUES
 ('course_category','Course Category','Categories used to group courses',1),
 ('enquiry_status','Enquiry Status','Lifecycle status of an enquiry',2),
 ('enquiry_source','Enquiry Source','Where the enquiry came from',3),
 ('designation','Designation','Staff designations',4),
 ('department','Department','Institute departments',5),
 ('student_status','Student Status','Student lifecycle status',6),
 ('teacher_status','Teacher Status','Teacher lifecycle status',7),
 ('expense_category','Expense Category','Accounting expense heads',8),
 ('id_proof','ID Proof','Accepted identity documents',9),
 ('preferred_time','Preferred Time','Preferred class timings',10),
 ('qualification','Qualification','Academic qualifications',11),
 ('payment_mode','Payment Mode','Accepted payment modes',12),
 ('asset_category','Asset Category','Asset groupings',13),
 ('library_category','Library Category','Library book groupings',14),
 ('document_type','Document Type','Uploadable document types',15),
 ('admission_additional_field','Admission Additional Field','Extra admission data points',16),
 ('leave_type','Leave Type','Staff/student leave types',17),
 ('gender','Gender','Gender options',18),
 ('category','Category','Social category options',19),
 ('blood_group','Blood Group','Blood group options',20),
 ('session','Session','Academic sessions',21),
 ('course_type','Course Type','Delivery type of a course',22),
 ('batch_timing','Batch Timing','Standard batch time slots',23),
 ('payment_status','Payment Status','Fee payment states',24),
 ('certificate_type','Certificate Type','Types of certificates issued',25),
 ('fee_type','Fee Type','Fee heads',26),
 ('installment_type','Installment Type','Installment plans',27),
 ('branch_type','Branch Type','Branch classifications',28);

INSERT INTO public.master_values (category_id, name, code, sort_order)
SELECT c.id, v.name, v.code, v.ord FROM public.master_categories c
JOIN (VALUES
 ('gender','Male','male',1),('gender','Female','female',2),('gender','Other','other',3),
 ('category','General','general',1),('category','OBC','obc',2),('category','SC','sc',3),('category','ST','st',4),('category','EWS','ews',5),
 ('blood_group','A+','a_pos',1),('blood_group','A-','a_neg',2),('blood_group','B+','b_pos',3),('blood_group','B-','b_neg',4),('blood_group','O+','o_pos',5),('blood_group','O-','o_neg',6),('blood_group','AB+','ab_pos',7),('blood_group','AB-','ab_neg',8),
 ('payment_mode','Cash','cash',1),('payment_mode','UPI','upi',2),('payment_mode','Card','card',3),('payment_mode','Bank Transfer','bank_transfer',4),('payment_mode','Cheque','cheque',5),('payment_mode','Online','online',6),
 ('payment_status','Pending','pending',1),('payment_status','Partially Paid','partially_paid',2),('payment_status','Paid','paid',3),('payment_status','Overdue','overdue',4),('payment_status','Cancelled','cancelled',5),
 ('student_status','Active','active',1),('student_status','Inactive','inactive',2),('student_status','Completed','completed',3),('student_status','Dropped','dropped',4),
 ('teacher_status','Active','active',1),('teacher_status','Inactive','inactive',2),('teacher_status','Resigned','resigned',3),
 ('designation','Computer Faculty','computer_faculty',1),('designation','Senior Faculty','senior_faculty',2),('designation','Center Head','center_head',3),('designation','Counsellor','counsellor',4),('designation','Office Assistant','office_assistant',5),
 ('department','Computer Science','computer_science',1),('department','Accounts','accounts',2),('department','Administration','administration',3),('department','Spoken English','spoken_english',4),
 ('qualification','10th','10th',1),('qualification','12th','12th',2),('qualification','Diploma','diploma',3),('qualification','Graduate','graduate',4),('qualification','Post Graduate','post_graduate',5),
 ('course_category','Basic Computer','basic_computer',1),('course_category','Tally & Accounting','tally_accounting',2),('course_category','Programming','programming',3),('course_category','Graphic Design','graphic_design',4),('course_category','Typing','typing',5),('course_category','Government Certified','govt_certified',6),
 ('course_type','Offline','offline',1),('course_type','Online','online',2),('course_type','Hybrid','hybrid',3),
 ('batch_timing','07:00 AM - 09:00 AM','0700_0900',1),('batch_timing','09:00 AM - 11:00 AM','0900_1100',2),('batch_timing','11:00 AM - 01:00 PM','1100_1300',3),('batch_timing','02:00 PM - 04:00 PM','1400_1600',4),('batch_timing','04:00 PM - 06:00 PM','1600_1800',5),
 ('preferred_time','Morning','morning',1),('preferred_time','Afternoon','afternoon',2),('preferred_time','Evening','evening',3),
 ('session','2025-2026','2025_2026',1),('session','2026-2027','2026_2027',2),
 ('enquiry_status','New','new',1),('enquiry_status','Follow Up','follow_up',2),('enquiry_status','Converted','converted',3),('enquiry_status','Closed','closed',4),
 ('enquiry_source','Walk In','walk_in',1),('enquiry_source','Website','website',2),('enquiry_source','Referral','referral',3),('enquiry_source','Social Media','social_media',4),
 ('id_proof','Aadhaar Card','aadhaar',1),('id_proof','PAN Card','pan',2),('id_proof','Voter ID','voter_id',3),('id_proof','Driving Licence','dl',4),
 ('document_type','Photo','photo',1),('document_type','Signature','signature',2),('document_type','Marksheet','marksheet',3),('document_type','Aadhaar','aadhaar',4),
 ('certificate_type','Course Completion','course_completion',1),('certificate_type','Diploma','diploma',2),('certificate_type','Advanced Diploma','advanced_diploma',3),('certificate_type','Training','training',4),('certificate_type','Participation','participation',5),
 ('fee_type','Course Fee','course_fee',1),('fee_type','Registration Fee','registration_fee',2),('fee_type','Exam Fee','exam_fee',3),('fee_type','Certificate Fee','certificate_fee',4),('fee_type','Study Material','study_material',5),
 ('installment_type','Single Payment','single',1),('installment_type','2 Installments','two',2),('installment_type','3 Installments','three',3),('installment_type','Monthly','monthly',4),
 ('leave_type','Casual Leave','casual',1),('leave_type','Sick Leave','sick',2),('leave_type','Unpaid Leave','unpaid',3),
 ('expense_category','Rent','rent',1),('expense_category','Salary','salary',2),('expense_category','Electricity','electricity',3),('expense_category','Marketing','marketing',4),
 ('asset_category','Computer','computer',1),('asset_category','Furniture','furniture',2),('asset_category','Networking','networking',3),
 ('library_category','Computer Books','computer_books',1),('library_category','Accounting Books','accounting_books',2),
 ('branch_type','Main Branch','main',1),('branch_type','Franchise','franchise',2),
 ('admission_additional_field','Reference Name','reference_name',1),('admission_additional_field','Transport Required','transport_required',2)
) AS v(cat, name, code, ord) ON v.cat = c.key;

-- ============ SEED SYSTEM SETTINGS ============
INSERT INTO public.system_settings (group_key, setting_key, value, is_public) VALUES
 ('institute','profile','{"institute_name":"Krishna Computer Center","tagline":"Empowering Digital India, One Student at a Time","logo_url":"","favicon_url":"","director_name":"","founder_name":"","established_year":"2010","registration_number":"","email":"info@krishnacomputercenter.com","phone":"","whatsapp":"","website":"","office_timing":"Mon-Sat, 8:00 AM - 8:00 PM","address":"","about_us":"","vision":"","mission":"","footer_text":"","facebook":"","instagram":"","youtube":"","telegram":"","linkedin":""}', true),
 ('preferences','general','{"default_language":"en","date_format":"DD/MM/YYYY","time_format":"12h","currency":"INR","timezone":"Asia/Kolkata","default_branch":"","default_session":"2025-2026","pagination_size":10,"theme":"light","primary_color":"#1d4ed8","secondary_color":"#06b6d4","enable_notifications":true,"enable_email":false,"enable_sms":false,"enable_whatsapp":false,"enable_online_admission":true,"enable_online_payment":false,"enable_student_login":true,"enable_teacher_login":true}', true),
 ('admission','config','{"admission_open":true,"application_prefix":"APP","application_format":"{PREFIX}{YYYY}{SEQ}","required_documents":["Photo","Aadhaar","Marksheet"],"max_file_size_mb":5,"allowed_file_types":["pdf","jpg","jpeg","png"],"application_fee":0,"default_status":"pending","auto_student_creation":true,"auto_welcome_letter":true,"auto_fee_receipt":false,"email_notification":false,"whatsapp_notification":false,"sms_notification":false,"approval_required":true}', false),
 ('student','config','{"student_id_prefix":"KCC","admission_number_prefix":"ADM","enrollment_number_prefix":"ENR","default_status":"active","required_fields":["full_name","phone","course_id","branch_id"],"photo_required":true,"id_card_generation":true,"qr_code_generation":true,"auto_student_login":false}', false),
 ('teacher','config','{"teacher_id_prefix":"TCH","employee_code_prefix":"EMP","default_status":"active","faculty_login":true,"password_min_length":8,"require_strong_password":true,"photo_required":false,"documents_required":["Aadhaar","Qualification"]}', false),
 ('course','config','{"course_code_prefix":"CRS","default_duration":3,"default_duration_unit":"months","default_mode":"offline"}', false),
 ('batch','config','{"batch_code_prefix":"BAT","default_capacity":30,"maximum_students":40,"allowed_timings":["07:00 AM - 09:00 AM","09:00 AM - 11:00 AM","11:00 AM - 01:00 PM","02:00 PM - 04:00 PM","04:00 PM - 06:00 PM"],"working_days":["Mon","Tue","Wed","Thu","Fri","Sat"],"session":"2025-2026","teacher_conflict_check":true,"one_batch_per_student":true}', false),
 ('fee','config','{"receipt_prefix":"RCP","receipt_format":"{PREFIX}{YYYY}{SEQ}","invoice_prefix":"INV","payment_modes":["Cash","UPI","Card","Bank Transfer","Online","Cheque"],"installments_enabled":true,"max_installments":6,"late_fee_enabled":false,"late_fee_amount":0,"max_discount_percent":20,"receipt_logo_url":"","receipt_footer":"Thank you for your payment.","terms":"Fees once paid are non-refundable."}', false),
 ('certificate','config','{"certificate_prefix":"KCC-CERT","certificate_types":["Course Completion","Diploma","Training"],"template":"default","logo_url":"","signature_url":"","qr_verification":true,"verification_url":"/certificate-verification","footer":"Verify this certificate online using the QR code."}', false),
 ('security','config','{"session_timeout_minutes":60,"password_min_length":8,"require_strong_password":true,"login_attempt_limit":5,"audit_logging":true,"two_factor_ready":false,"ip_restriction_ready":false,"allowed_ips":[]}', false),
 ('website','content','{"about_us":"","vision":"","mission":"","contact_email":"","contact_phone":"","office_timing":"","admission_open":true,"notice":"","footer":"","facebook":"","instagram":"","youtube":""}', true),
 ('backup','config','{"last_backup_at":null,"backup_status":"never","auto_backup":false}', false);

-- ============ SEED MENU CONFIG ============
INSERT INTO public.menu_config (key,label,icon,path,section,sort_order,is_enabled,roles) VALUES
 ('dashboard','Dashboard','LayoutDashboard','/dashboard','main',1,true,ARRAY['super_admin','admin','branch_manager','faculty']::app_role[]),
 ('students','Students','Users','/dashboard/students','academics',2,true,ARRAY['super_admin','admin','branch_manager']::app_role[]),
 ('admissions','Admissions','FileText','/dashboard/admissions','academics',3,true,ARRAY['super_admin','admin','branch_manager']::app_role[]),
 ('teachers','Teachers','GraduationCap','/dashboard/teachers','academics',4,true,ARRAY['super_admin','admin']::app_role[]),
 ('courses','Courses','BookOpen','/dashboard/courses','academics',5,true,ARRAY['super_admin','admin']::app_role[]),
 ('batches','Batches','CalendarRange','/dashboard/batches','academics',6,true,ARRAY['super_admin','admin','faculty']::app_role[]),
 ('attendance','Attendance','ClipboardCheck','/dashboard/attendance','academics',7,true,ARRAY['super_admin','admin','faculty']::app_role[]),
 ('fees','Fees','IndianRupee','/dashboard/fees','finance',8,true,ARRAY['super_admin','admin','branch_manager']::app_role[]),
 ('results','Results','Award','/dashboard/results','academics',9,true,ARRAY['super_admin','admin','faculty']::app_role[]),
 ('certificates','Certificates','BadgeCheck','/dashboard/certificates','academics',10,true,ARRAY['super_admin','admin']::app_role[]),
 ('downloads','Downloads','Download','/dashboard/downloads','resources',11,true,ARRAY['super_admin','admin','faculty']::app_role[]),
 ('gallery','Gallery','Image','/admin/gallery','website',12,true,ARRAY['super_admin','admin']::app_role[]),
 ('notices','Notice Board','Megaphone','/admin/notices','website',13,true,ARRAY['super_admin','admin']::app_role[]),
 ('reports','Reports','BarChart3','/admin/reports','insights',14,true,ARRAY['super_admin','admin']::app_role[]),
 ('analytics','Analytics','TrendingUp','/admin/analytics','insights',15,true,ARRAY['super_admin','admin']::app_role[]),
 ('settings','Settings & Configuration','Settings','/dashboard/settings/configuration','system',16,true,ARRAY['super_admin']::app_role[]);

-- ============ SEED FORM CONFIGS ============
INSERT INTO public.form_configs (form_key, name, description) VALUES
 ('admission_form','Admission Form','Public online admission application'),
 ('student_form','Student Form','Student create/edit wizard'),
 ('teacher_form','Teacher Form','Teacher create/edit wizard'),
 ('course_form','Course Form','Course create/edit form'),
 ('batch_form','Batch Form','Batch create/edit form'),
 ('contact_form','Contact Form','Public contact page form'),
 ('enquiry_form','Enquiry Form','Enquiry capture form');

INSERT INTO public.form_fields (form_config_id, field_key, label, field_type, is_required, sort_order)
SELECT f.id, v.field_key, v.label, v.ftype, v.req, v.ord FROM public.form_configs f
JOIN (VALUES
 ('admission_form','full_name','Full Name','text',true,1),
 ('admission_form','father_name','Father Name','text',true,2),
 ('admission_form','mother_name','Mother Name','text',false,3),
 ('admission_form','date_of_birth','Date of Birth','date',true,4),
 ('admission_form','gender','Gender','dropdown',true,5),
 ('admission_form','category','Category','dropdown',false,6),
 ('admission_form','phone','Mobile Number','phone',true,7),
 ('admission_form','email','Email','email',false,8),
 ('admission_form','aadhaar_number','Aadhaar Number','text',false,9),
 ('admission_form','address','Address','textarea',true,10),
 ('admission_form','course_id','Course','dropdown',true,11),
 ('admission_form','branch_id','Branch','dropdown',true,12),
 ('admission_form','photo_url','Photo','file',false,13),
 ('student_form','full_name','Full Name','text',true,1),
 ('student_form','phone','Mobile Number','phone',true,2),
 ('student_form','email','Email','email',false,3),
 ('student_form','gender','Gender','dropdown',false,4),
 ('student_form','course_id','Course','dropdown',true,5),
 ('student_form','batch_id','Batch','dropdown',false,6),
 ('student_form','branch_id','Branch','dropdown',true,7),
 ('teacher_form','full_name','Full Name','text',true,1),
 ('teacher_form','mobile','Mobile Number','phone',true,2),
 ('teacher_form','email','Email','email',false,3),
 ('teacher_form','designation','Designation','dropdown',false,4),
 ('teacher_form','qualification','Qualification','dropdown',false,5),
 ('teacher_form','branch_id','Branch','dropdown',false,6),
 ('course_form','name','Course Name','text',true,1),
 ('course_form','category','Course Category','dropdown',false,2),
 ('course_form','duration','Duration','number',true,3),
 ('course_form','course_fee','Course Fee','number',true,4),
 ('batch_form','name','Batch Name','text',true,1),
 ('batch_form','course_id','Course','dropdown',true,2),
 ('batch_form','branch_id','Branch','dropdown',true,3),
 ('batch_form','timing','Timing','dropdown',false,4),
 ('batch_form','capacity','Capacity','number',true,5),
 ('contact_form','name','Name','text',true,1),
 ('contact_form','phone','Phone','phone',true,2),
 ('contact_form','email','Email','email',false,3),
 ('contact_form','message','Message','textarea',true,4),
 ('enquiry_form','name','Name','text',true,1),
 ('enquiry_form','phone','Phone','phone',true,2),
 ('enquiry_form','course','Course Interested','dropdown',false,3),
 ('enquiry_form','source','Enquiry Source','dropdown',false,4)
) AS v(form_key, field_key, label, ftype, req, ord) ON v.form_key = f.form_key;

-- ============ SEED NOTIFICATION TEMPLATES ============
INSERT INTO public.notification_templates (key, channel, name, subject, body, variables) VALUES
 ('admission_submitted','email','Admission Submitted','Application {{application_number}} received','Dear {{student_name}}, your application {{application_number}} for {{course_name}} at {{branch_name}} has been received.',ARRAY['student_name','application_number','course_name','branch_name']),
 ('admission_approved','email','Admission Approved','Admission Approved - {{admission_number}}','Congratulations {{student_name}}! Your admission {{admission_number}} for {{course_name}} is approved.',ARRAY['student_name','admission_number','course_name']),
 ('admission_rejected','email','Admission Rejected','Regarding application {{application_number}}','Dear {{student_name}}, your application {{application_number}} could not be approved.',ARRAY['student_name','application_number']),
 ('fee_paid','email','Fee Paid','Payment received - {{receipt_number}}','Dear {{student_name}}, we received {{fee_amount}}. Receipt: {{receipt_number}}.',ARRAY['student_name','fee_amount','receipt_number']),
 ('fee_due','sms','Fee Due','Fee reminder','Dear {{student_name}}, your fee of {{fee_amount}} is due. - Krishna Computer Center',ARRAY['student_name','fee_amount']),
 ('attendance','sms','Attendance Alert','Attendance','Dear {{student_name}}, your attendance was marked today.',ARRAY['student_name']),
 ('result_published','email','Result Published','Result published','Dear {{student_name}}, your result for {{course_name}} has been published.',ARRAY['student_name','course_name']),
 ('certificate_issued','email','Certificate Issued','Certificate issued','Dear {{student_name}}, your certificate for {{course_name}} has been issued.',ARRAY['student_name','course_name']),
 ('password_reset','email','Password Reset','Reset your password','Dear {{student_name}}, use the link in this email to reset your password.',ARRAY['student_name']),
 ('welcome_message','whatsapp','Welcome Message',NULL,'Welcome to Krishna Computer Center, {{student_name}}! Your course {{course_name}} starts soon.',ARRAY['student_name','course_name']);

-- ============ SEED DOCUMENT TEMPLATES ============
INSERT INTO public.document_templates (key, name, header, footer) VALUES
 ('id_card','ID Card','Krishna Computer Center','Property of Krishna Computer Center'),
 ('admission_form','Admission Form','Krishna Computer Center','Signature of Applicant'),
 ('welcome_letter','Welcome Letter','Krishna Computer Center','We look forward to teaching you.'),
 ('fee_receipt','Fee Receipt','Krishna Computer Center','This is a computer generated receipt.'),
 ('certificate','Certificate','Krishna Computer Center','Verify online with the QR code.'),
 ('diploma','Diploma','Krishna Computer Center','Verify online with the QR code.'),
 ('admit_card','Admit Card','Krishna Computer Center','Carry a valid photo ID.'),
 ('syllabus','Syllabus','Krishna Computer Center',''),
 ('prospectus','Prospectus','Krishna Computer Center',''),
 ('notes','Notes','Krishna Computer Center',''),
 ('assignments','Assignments','Krishna Computer Center',''),
 ('time_table','Time Table','Krishna Computer Center','');

-- ============ SEED NUMBERING ============
INSERT INTO public.numbering_settings (key, name, prefix, format, padding, next_number) VALUES
 ('application','Application Number','APP','{PREFIX}{YYYY}{SEQ}',5,1),
 ('admission','Admission Number','ADM','{PREFIX}{YYYY}{SEQ}',5,1),
 ('enrollment','Enrollment Number','ENR','{PREFIX}{YYYY}{SEQ}',5,1),
 ('student','Student Code','KCC','{PREFIX}{SEQ}',5,1),
 ('teacher','Teacher ID','TCH','{PREFIX}{SEQ}',4,1),
 ('receipt','Fee Receipt','RCP','{PREFIX}{YYYY}{SEQ}',5,1),
 ('certificate','Certificate Number','KCC-CERT','{PREFIX}/{YYYY}/{SEQ}',5,1),
 ('course','Course Code','CRS','{PREFIX}{SEQ}',3,1),
 ('batch','Batch Code','BAT','{PREFIX}{SEQ}',3,1);

-- ============ SEED ROLE PERMISSIONS ============
INSERT INTO public.role_permissions (role, module, permissions)
SELECT r.role::app_role, m.module,
  CASE
    WHEN r.role = 'super_admin' THEN ARRAY['view','create','edit','delete','approve','export','print','manage_settings','manage_users','manage_reports']
    WHEN r.role = 'admin' THEN ARRAY['view','create','edit','approve','export','print','manage_reports']
    WHEN r.role = 'branch_manager' THEN ARRAY['view','create','edit','export']
    WHEN r.role = 'faculty' THEN ARRAY['view']
    ELSE ARRAY['view']
  END
FROM (VALUES ('super_admin'),('admin'),('branch_manager'),('faculty'),('student')) AS r(role)
CROSS JOIN (VALUES ('students'),('admissions'),('teachers'),('courses'),('batches'),('attendance'),('fees'),('results'),('certificates'),('downloads'),('reports'),('settings')) AS m(module)
WHERE NOT (r.role = 'student' AND m.module NOT IN ('attendance','fees','results','certificates','downloads'));
