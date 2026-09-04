# Phase 1 Migration Plan (execution-ready, NOT executed)

Source: `tjljtwdzextdnqefnbdh` (Lovable Cloud) → Target: `ylzupmcftshsbwsxxknn` (your own project).
Nothing below has been run. No row was created, changed or deleted in either project.

## 1. Admin identity strategy

| Item | Decision |
| --- | --- |
| Account retained | **Target** admin `admin@krishnacomputercenter.com`, UID `ac68903d…` — it already owns the target `profiles` row and `super_admin` role |
| Source admin `5e4ecb91…` | **Not** recreated in target Auth. Used only as a lookup key |
| Remap rule | Build one map `{'5e4ecb91…' → 'ac68903d…'}` applied to every Auth-UUID column during copy; any unmapped source UUID becomes `NULL` (all such columns are nullable) |
| Result | One admin identity, no duplicate email, no Auth conflict |

Auth-UUID columns to remap (from live source schema):

| Table | Columns |
| --- | --- |
| profiles | id, approved_by, created_by |
| user_roles | user_id |
| students | user_id, created_by, updated_by, faculty_id |
| teachers | user_id, created_by, updated_by |
| admissions | reviewed_by, approved_by, rejected_by |
| audit_logs | actor_id |
| configuration_history | changed_by |
| student_edit_history | changed_by |
| teacher_edit_history | changed_by |
| courses | created_by, updated_by |
| batches | created_by, updated_by, faculty_id |
| exams | created_by |
| attendance | marked_by |
| certificates | issued_by |
| certificate_templates | created_by |
| fee_structure | created_by |
| fee_installments | collected_by |
| student_fees | created_by |
| student_results | published_by |
| student_documents | uploaded_by |
| study_materials | uploaded_by |
| download_history | user_id |
| material_favorites | user_id |
| notification_reads | user_id |
| notifications | user_id, created_by |
| system_settings | updated_by |
| integration_settings | updated_by |

Business-entity UUIDs (branch_id, course_id, batch_id, student_id, admission_id…) are remapped through the per-table ID maps built in section 3, not through the Auth map.

## 2. Existing target data — actual conflicts found

Branches (by code):

| Code | Source | Target | Action |
| --- | --- | --- | --- |
| KCC-KN, KCC-LN, KWN, MAINBR | present | present | SKIP insert, keep target row, map source id → target id |
| KCC-RP "Rampark Branch" | present | absent (target has `RMP` = same name) | **MERGE by name** → map source `KCC-RP` to target `RMP`; do not create a 6th branch |

Courses (by code): 12 of 22 already exist in target (ADCA, AI, CCC, CPO, DCA, DTP, GD, OA, PY, TALLY, TYP, WEBDEV) → SKIP + map. 10 missing (ADITSM, ADVEXCEL, CLANG, CPP, DENTRY, DM, JAVA, OLEVEL, PGDCA, SPKENG) → INSERT with new ids.

Admissions (by application_no): source APP202600005–09; target APP202600001, 00003 → **no overlap**, all 5 insert cleanly. Note admission_no series continues at 01009, so `application_no_seq`/`admission_no_seq` in target must be advanced past 9 to avoid future collisions.

Configuration (natural keys): target already holds equal-or-larger sets (form_fields 43 vs 42, master_values 113 vs 111, others identical counts). Rule: **target wins**; source config is only inserted where the natural key is missing.

## 3. Per-table migration rules

| Table | Src | Tgt | Method | Conflict key | Rollback |
| --- | --- | --- | --- | --- | --- |
| branches | 5 | 5 | SKIP + map (KCC-RP→RMP by name) | code, then name | none needed |
| courses | 22 | 12 | INSERT missing only | code | delete inserted ids from batch log |
| profiles | 1 | 1 | SKIP (target admin) | id/email | none |
| user_roles | 2 | 1 | SKIP | (user_id, role) | none |
| students | 13 | 0 | INSERT all | student_code / enrollment_no | delete by batch tag |
| admissions | 5 | 2 | INSERT all | application_no | delete by application_no list |
| audit_logs | 117 | 6 | INSERT (append) | none (log) | delete by created_at window |
| configuration_history | 50 | 0 | SKIP (history, not needed) | — | — |
| system_settings | 12 | 12 | SKIP | (group_key, setting_key) | — |
| role_permissions | 53 | 53 | SKIP | (role, module) | — |
| menu_config | 16 | 16 | SKIP | key | — |
| master_categories | 28 | 28 | SKIP | key | — |
| master_values | 111 | 113 | MERGE missing only | (category_id, code) | delete inserted ids |
| form_configs | 7 | 7 | SKIP | form_key | — |
| form_fields | 42 | 43 | MERGE missing only | (form_config_id, field_key) | delete inserted ids |
| document_templates | 12 | 12 | SKIP | key | — |
| download_categories | 12 | 12 | SKIP | category_name | — |
| notification_templates | 10 | 10 | SKIP | (key, channel) | — |
| numbering_settings | 9 | 9 | UPDATE next_number to max(src,tgt) | key | restore prior values (captured pre-run) |
| notifications | 5 | 0 | INSERT | none | delete by batch |
| student_edit_history | 1 | 0 | INSERT | none | delete by batch |
| attendance, batches, certificates, certificate_templates, exams, subjects, teachers, teacher_batches, teacher_courses, teacher_edit_history, student_fees, fee_structure, fee_installments, student_results, result_details, student_documents, study_materials, download_history, material_favorites, notification_reads, integration_settings | 0 | 0 | SKIP (empty both sides) | — | — |

Order of execution: branches map → courses → admissions → students → student_edit_history → notifications → audit_logs → config merges → numbering_settings.

## 4. Students (all 13)

| Field | Preservation rule |
| --- | --- |
| student_code, enrollment_no, admission_number, roll_no | copied **verbatim** (uniqueness verified — target students table is empty) |
| branch_id | remapped through the branch map (incl. KCC-RP→RMP) |
| course_id | remapped through the course map (existing target ids reused, new ids for the 10 inserted courses) |
| batch_id, faculty_id | NULL in source → stay NULL |
| admission_id | remapped to the newly inserted admission rows where linked |
| user_id | remapped via Auth map; unmapped student logins → NULL (students re-linked later when their Auth users are created) |
| id (student uuid) | preserved as-is; no collision possible since target has 0 students |
| fees, discount, timestamps, documents JSON | copied verbatim |
| Trigger note | `trg_recount_batch_strength` and `set_updated_at` fire normally; `updated_at` may refresh — acceptable |

Verification: `count = 13`, and every `branch_id`/`course_id` resolves to a non-null target row.

## 5. Storage

| Step | Action | Verification |
| --- | --- | --- |
| 1 | Create 14 buckets in target with identical names and **private** visibility: assignments, certificates, documents, downloads, ebooks, gallery, id-cards, question-papers, software, student-photos, study-materials, teachers, thumbnails, videos | bucket list == 14, all `public=false` |
| 2 | Recreate `storage.objects` RLS policies by replaying the source policy definitions as a target migration (role-based read/write per bucket) | policy count per bucket matches source |
| 3 | Copy 43 objects: download each from source with service key, upload to target at the **byte-identical path** (`bucket/prefix/filename`), preserving content-type; `upsert=false` so nothing is overwritten | per-object HTTP 200 log |
| 4 | Verify | per-bucket object count and total == 43; spot-check 5 random files by size/checksum |
| Rollback | Delete only the uploaded object paths from the copy manifest; buckets can stay (empty buckets are harmless) | |

## 6. Authentication

The target admin account stays **unchanged** — same UID, same password, same confirmed email, same `super_admin` role. Nothing is recreated, no password is reset, no Auth user is deleted. Non-admin source Auth users (1 additional) are not migrated in Phase 1; password hashes are not exportable, so those users must be re-invited later via password-reset email (Phase 2).

## 7. Configuration data

Rule: **target is authoritative**. For every configuration table the migration reads the target's natural keys first, and inserts only source rows whose key is absent. No UPDATE, no DELETE, no truncate. `numbering_settings.next_number` is the single exception: it is raised to `max(source, target)` so newly migrated admission/receipt/certificate numbers can never collide with existing target numbers. Pre-run values are captured to a JSON snapshot for rollback.

## 8. Pre-cutover verification (all must PASS before touching Vercel env vars)

| # | Check | PASS criteria |
| --- | --- | --- |
| 1 | Row counts | students 13, courses 22, branches 5, admissions 7 (2 target + 5 migrated) |
| 2 | Referential integrity | 0 students with unresolved branch_id/course_id; 0 orphan admission_id |
| 3 | Auth | sign-in as target admin succeeds; `has_role(uid,'super_admin')` true |
| 4 | RLS | anonymous PostgREST read of students/profiles returns 0 rows |
| 5 | Storage | 14 buckets, 43 objects, signed URL downloads a real file |
| 6 | Uniqueness | no duplicate student_code, enrollment_no, application_no, course code, branch code |
| 7 | Numbering | next admission/receipt number > highest existing value |
| 8 | App smoke test | admin dashboard, student list, admission detail, course list all render against target |

Any FAIL ⇒ stop, roll back, do not change environment variables.

## 9. Rollback (non-destructive)

Every insert is tagged with a run id recorded in a local manifest (table → list of inserted primary keys, plus the storage path list, plus the numbering snapshot). Rollback = delete exactly those primary keys in reverse dependency order (audit_logs → notifications → student_edit_history → students → admissions → courses), delete the copied storage paths, restore `numbering_settings`. Rows that existed in the target before the run, and any rows created by users after the run (not in the manifest), are never touched. The source project is read-only throughout and remains the intact fallback; Vercel env vars are only switched after section 8 passes, so reverting the cutover is a one-variable change.

## 10. SMTP and OAuth

| Item | Blocker for Phase 1? |
| --- | --- |
| Custom SMTP | **No.** Not needed for schema/data/storage migration or admin sign-in. Becomes required before inviting non-admin users or password resets (Phase 2) |
| Google OAuth | **No.** Currently disabled in target; email/password login works. Required only if you want Google sign-in live after cutover |

Neither will be configured now.

## Next step

Reply with approval and I will execute Phase 1 in the order above, one section at a time, with the manifest written before any write.
