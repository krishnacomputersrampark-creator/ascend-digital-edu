import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/auth";

/* ---------------- types ---------------- */
export type MasterCategory = {
  id: string; key: string; name: string; description: string | null; sort_order: number;
};
export type MasterValue = {
  id: string; category_id: string; name: string; code: string; description: string | null;
  is_active: boolean; sort_order: number; created_at: string; updated_at: string;
};
export type MenuItemConfig = {
  id: string; key: string; label: string; icon: string | null; path: string | null; section: string | null;
  sort_order: number; is_enabled: boolean; is_public: boolean; roles: AppRole[];
};
export type FormConfig = { id: string; form_key: string; name: string; description: string | null; is_active: boolean };
export type FormField = {
  id: string; form_config_id: string; field_key: string; label: string; field_type: string;
  is_required: boolean; is_visible: boolean; sort_order: number; help_text: string | null;
  placeholder: string | null; default_value: string | null; validation: Record<string, unknown>; roles: AppRole[];
};
export type NotificationTemplate = {
  id: string; key: string; channel: string; name: string; subject: string | null; body: string;
  draft_subject: string | null; draft_body: string | null; variables: string[]; is_active: boolean;
};
export type DocumentTemplate = {
  id: string; key: string; name: string; is_enabled: boolean; header: string | null; footer: string | null;
  logo_url: string | null; signature_url: string | null; terms: string | null;
};
export type NumberingSetting = {
  id: string; key: string; name: string; prefix: string; format: string; padding: number; next_number: number;
};
export type IntegrationSetting = {
  id: string; provider: string; category: string; is_enabled: boolean;
  config: Record<string, unknown>; secret_keys: string[];
};
export type RolePermission = { id: string; role: AppRole; module: string; permissions: string[] };
export type ConfigHistoryRow = {
  id: string; entity: string; entity_id: string | null; label: string | null;
  old_value: unknown; new_value: unknown; changed_by_email: string | null; created_at: string;
};
export type BranchRow = {
  id: string; name: string; code: string; address: string | null; city: string | null; state: string | null;
  pincode: string | null; phone: string | null; email: string | null; is_active: boolean;
};

/* ---------------- history ---------------- */
export async function recordHistory(entity: string, entityId: string | null, label: string, oldValue: unknown, newValue: unknown) {
  const { data: u } = await supabase.auth.getUser();
  await supabase.from("configuration_history").insert({
    entity, entity_id: entityId, label,
    old_value: (oldValue ?? null) as never, new_value: (newValue ?? null) as never,
    changed_by: u.user?.id ?? null, changed_by_email: u.user?.email ?? null,
  });
}

export async function listHistory(entity?: string, limit = 50): Promise<ConfigHistoryRow[]> {
  let q = supabase.from("configuration_history").select("*").order("created_at", { ascending: false }).limit(limit);
  if (entity) q = q.eq("entity", entity);
  const { data } = await q;
  return (data ?? []) as unknown as ConfigHistoryRow[];
}

/* ---------------- system settings ---------------- */
export type SettingsGroupValue = Record<string, unknown>;

export async function getSettings(group: string, key = "config" ): Promise<SettingsGroupValue> {
  const { data, error } = await supabase.from("system_settings").select("value").eq("group_key", group).eq("setting_key", key).maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.value ?? {}) as SettingsGroupValue;
}

export async function saveSettings(group: string, key: string, value: SettingsGroupValue, label: string) {
  const prev = await getSettings(group, key).catch(() => ({}));
  const { data: u } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("system_settings")
    .upsert({ group_key: group, setting_key: key, value: value as never, updated_by: u.user?.id ?? null }, { onConflict: "group_key,setting_key" });
  if (error) throw new Error(error.message);
  await recordHistory(`system_settings:${group}.${key}`, null, label, prev, value);
}

/* ---------------- masters ---------------- */
export async function listMasterCategories(): Promise<MasterCategory[]> {
  const { data, error } = await supabase.from("master_categories").select("id,key,name,description,sort_order").order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []) as MasterCategory[];
}

export async function listMasterValues(categoryId: string): Promise<MasterValue[]> {
  const { data, error } = await supabase.from("master_values").select("*").eq("category_id", categoryId).order("sort_order").order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as MasterValue[];
}

/** Public helper for ERP modules: active values for a master category key. */
export async function getMasterOptions(categoryKey: string): Promise<Array<{ value: string; label: string }>> {
  const { data } = await supabase
    .from("master_values")
    .select("name, code, sort_order, is_active, master_categories!inner(key)")
    .eq("master_categories.key", categoryKey)
    .eq("is_active", true)
    .order("sort_order");
  return (data ?? []).map((r: { name: string; code: string }) => ({ value: r.code, label: r.name }));
}

export async function createMasterValue(categoryId: string, input: Partial<MasterValue>) {
  const { error } = await supabase.from("master_values").insert({
    category_id: categoryId,
    name: (input.name ?? "").trim(),
    code: (input.code ?? "").trim().toLowerCase().replace(/\s+/g, "_"),
    description: input.description ?? null,
    is_active: input.is_active ?? true,
    sort_order: input.sort_order ?? 0,
  });
  if (error) throw new Error(error.message.includes("duplicate") ? "This value already exists in the master." : error.message);
  await recordHistory("master_values", categoryId, `Added master value "${input.name}"`, null, input);
}

export async function updateMasterValue(id: string, patch: Partial<MasterValue>, prev?: MasterValue) {
  const { error } = await supabase.from("master_values").update({
    ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
    ...(patch.code !== undefined ? { code: patch.code.trim().toLowerCase().replace(/\s+/g, "_") } : {}),
    ...(patch.description !== undefined ? { description: patch.description } : {}),
    ...(patch.is_active !== undefined ? { is_active: patch.is_active } : {}),
    ...(patch.sort_order !== undefined ? { sort_order: patch.sort_order } : {}),
  }).eq("id", id);
  if (error) throw new Error(error.message.includes("duplicate") ? "This value already exists in the master." : error.message);
  await recordHistory("master_values", id, `Updated master value "${patch.name ?? prev?.name ?? ""}"`, prev ?? null, patch);
}

export async function deleteMasterValue(id: string, prev?: MasterValue) {
  const { error } = await supabase.from("master_values").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await recordHistory("master_values", id, `Deleted master value "${prev?.name ?? id}"`, prev ?? null, null);
}

/* ---------------- menu ---------------- */
export async function listMenuConfig(): Promise<MenuItemConfig[]> {
  const { data, error } = await supabase.from("menu_config").select("*").order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as MenuItemConfig[];
}

export async function updateMenuItem(id: string, patch: Partial<MenuItemConfig>, prev?: MenuItemConfig) {
  const { error } = await supabase.from("menu_config").update(patch as never).eq("id", id);
  if (error) throw new Error(error.message);
  await recordHistory("menu_config", id, `Updated menu "${prev?.label ?? id}"`, prev ?? null, patch);
}

/* ---------------- forms ---------------- */
export async function listFormConfigs(): Promise<FormConfig[]> {
  const { data, error } = await supabase.from("form_configs").select("*").order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as FormConfig[];
}

export async function listFormFields(formConfigId: string): Promise<FormField[]> {
  const { data, error } = await supabase.from("form_fields").select("*").eq("form_config_id", formConfigId).order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as FormField[];
}

export async function updateFormField(id: string, patch: Partial<FormField>, prev?: FormField) {
  const { error } = await supabase.from("form_fields").update(patch as never).eq("id", id);
  if (error) throw new Error(error.message);
  await recordHistory("form_fields", id, `Updated field "${prev?.label ?? id}"`, prev ?? null, patch);
}

export async function createFormField(formConfigId: string, patch: Partial<FormField>) {
  const { error } = await supabase.from("form_fields").insert({
    form_config_id: formConfigId,
    field_key: (patch.field_key ?? "").trim(),
    label: (patch.label ?? "").trim(),
    field_type: patch.field_type ?? "text",
    is_required: patch.is_required ?? false,
    is_visible: patch.is_visible ?? true,
    sort_order: patch.sort_order ?? 0,
    help_text: patch.help_text ?? null,
    placeholder: patch.placeholder ?? null,
    default_value: patch.default_value ?? null,
  });
  if (error) throw new Error(error.message);
  await recordHistory("form_fields", formConfigId, `Added field "${patch.label}"`, null, patch);
}

export async function deleteFormField(id: string, prev?: FormField) {
  const { error } = await supabase.from("form_fields").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await recordHistory("form_fields", id, `Deleted field "${prev?.label ?? id}"`, prev ?? null, null);
}

/* ---------------- templates ---------------- */
export async function listNotificationTemplates(): Promise<NotificationTemplate[]> {
  const { data, error } = await supabase.from("notification_templates").select("*").order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as NotificationTemplate[];
}

export async function saveNotificationTemplate(id: string, patch: Partial<NotificationTemplate>, prev?: NotificationTemplate) {
  const { error } = await supabase.from("notification_templates").update(patch as never).eq("id", id);
  if (error) throw new Error(error.message);
  await recordHistory("notification_templates", id, `Updated template "${prev?.name ?? id}"`, prev ?? null, patch);
}

export async function listDocumentTemplates(): Promise<DocumentTemplate[]> {
  const { data, error } = await supabase.from("document_templates").select("*").order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as DocumentTemplate[];
}

export async function saveDocumentTemplate(id: string, patch: Partial<DocumentTemplate>, prev?: DocumentTemplate) {
  const { error } = await supabase.from("document_templates").update(patch as never).eq("id", id);
  if (error) throw new Error(error.message);
  await recordHistory("document_templates", id, `Updated document "${prev?.name ?? id}"`, prev ?? null, patch);
}

/* ---------------- numbering ---------------- */
export async function listNumbering(): Promise<NumberingSetting[]> {
  const { data, error } = await supabase.from("numbering_settings").select("*").order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as NumberingSetting[];
}

export async function saveNumbering(id: string, patch: Partial<NumberingSetting>, prev?: NumberingSetting) {
  const { error } = await supabase.from("numbering_settings").update(patch as never).eq("id", id);
  if (error) throw new Error(error.message);
  await recordHistory("numbering_settings", id, `Updated numbering "${prev?.name ?? id}"`, prev ?? null, patch);
}

export function previewNumber(n: NumberingSetting): string {
  const year = new Date().getFullYear();
  return n.format
    .replace("{PREFIX}", n.prefix)
    .replace("{YYYY}", String(year))
    .replace("{YY}", String(year).slice(2))
    .replace("{SEQ}", String(n.next_number).padStart(n.padding, "0"));
}

/* ---------------- integrations ---------------- */
export async function listIntegrations(): Promise<IntegrationSetting[]> {
  const { data, error } = await supabase.from("integration_settings").select("*").order("provider");
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as IntegrationSetting[];
}

export async function saveIntegration(provider: string, category: string, isEnabled: boolean, config: Record<string, unknown>, secretKeys: string[]) {
  const prev = (await listIntegrations()).find((i) => i.provider === provider);
  const { data: u } = await supabase.auth.getUser();
  const { error } = await supabase.from("integration_settings").upsert(
    { provider, category, is_enabled: isEnabled, config: config as never, secret_keys: secretKeys, updated_by: u.user?.id ?? null },
    { onConflict: "provider" },
  );
  if (error) throw new Error(error.message);
  await recordHistory("integration_settings", provider, `Updated integration "${provider}"`, prev ?? null, { is_enabled: isEnabled, config });
}

/* ---------------- roles ---------------- */
export async function listRolePermissions(): Promise<RolePermission[]> {
  const { data, error } = await supabase.from("role_permissions").select("*").order("module");
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as RolePermission[];
}

export async function saveRolePermission(role: AppRole, module: string, permissions: string[]) {
  const { error } = await supabase.from("role_permissions").upsert(
    { role, module, permissions }, { onConflict: "role,module" },
  );
  if (error) throw new Error(error.message);
  await recordHistory("role_permissions", `${role}:${module}`, `Updated permissions for ${role} / ${module}`, null, permissions);
}

/* ---------------- branches ---------------- */
export async function listBranches(): Promise<BranchRow[]> {
  const { data, error } = await supabase.from("branches").select("*").order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as BranchRow[];
}

export async function saveBranch(id: string, patch: Partial<BranchRow>, prev?: BranchRow) {
  const { error } = await supabase.from("branches").update(patch as never).eq("id", id);
  if (error) throw new Error(error.message);
  await recordHistory("branches", id, `Updated branch "${prev?.name ?? id}"`, prev ?? null, patch);
}

/* ---------------- backup snapshot ---------------- */
export async function dataSnapshot() {
  const tables = ["students", "teachers", "admissions", "courses", "batches", "certificates", "student_fees"] as const;
  const counts = await Promise.all(
    tables.map(async (t) => {
      const { count } = await supabase.from(t).select("id", { count: "exact", head: true });
      return { table: t, count: count ?? 0 };
    }),
  );
  return counts;
}
