ALTER TABLE public.form_fields
  ADD COLUMN IF NOT EXISTS section text,
  ADD COLUMN IF NOT EXISTS options jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

UPDATE public.form_fields ff
SET section = CASE
    WHEN ff.sort_order BETWEEN 100 AND 199 THEN 'Personal'
    WHEN ff.sort_order BETWEEN 200 AND 299 THEN 'Contact'
    WHEN ff.sort_order BETWEEN 300 AND 399 THEN 'Academic'
    WHEN ff.sort_order BETWEEN 400 AND 499 THEN 'Course'
    WHEN ff.sort_order BETWEEN 500 AND 599 THEN 'Documents'
    ELSE 'Declaration' END
FROM public.form_configs fc
WHERE fc.id = ff.form_config_id AND fc.form_key = 'admission_form' AND ff.section IS NULL;

UPDATE public.form_fields ff SET options = v.opts
FROM public.form_configs fc,
LATERAL (VALUES
  ('gender', '["Male","Female","Other"]'::jsonb),
  ('blood_group', '["A+","A-","B+","B-","O+","O-","AB+","AB-"]'::jsonb),
  ('category', '["General","OBC","SC","ST","EWS"]'::jsonb),
  ('qualification', '["8th","10th","12th","Diploma","Graduate","Post Graduate"]'::jsonb),
  ('preferred_timing', '["Morning","Afternoon","Evening","Weekend"]'::jsonb)
) AS v(k, opts)
WHERE fc.id = ff.form_config_id AND fc.form_key = 'admission_form'
  AND ff.field_key = v.k AND ff.options = '[]'::jsonb;