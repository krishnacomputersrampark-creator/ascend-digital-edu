import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import * as repo from "./settings.repo";
export type { 
  MasterCategory, MasterValue, BranchRow, MenuItemConfig, FormConfig, FormField, 
  NotificationTemplate, DocumentTemplate, NumberingSetting, IntegrationSetting, 
  RolePermission, ConfigHistoryRow 
} from "./settings.repo";

export const previewNumber = repo.previewNumber;

export const getSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ group: z.string(), key: z.string().optional().default("config") }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    return repo.getSettingsServer(context.supabase, data.group, data.key);
  });

export const saveSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => d as { group: string; key: string; value: Record<string, any>; label: string })
  .handler(async ({ data, context }) => {
    return repo.saveSettingsServer(context.supabase, data.group, data.key, data.value, data.label);
  });

export const listMasterCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return repo.listMasterCategoriesServer(context.supabase);
  });

export const listMasterValues = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.string().parse(d ?? ""))
  .handler(async ({ data, context }) => {
    return repo.listMasterValuesServer(context.supabase, data);
  });

export const createMasterValue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ categoryId: z.string(), input: z.any() }).parse(d))
  .handler(async ({ data, context }) => {
    return repo.createMasterValueServer(context.supabase, data.categoryId, data.input);
  });

export const updateMasterValue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string(), patch: z.any(), prev: z.any().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    return repo.updateMasterValueServer(context.supabase, data.id, data.patch, data.prev);
  });

export const deleteMasterValue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string(), prev: z.any().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    return repo.deleteMasterValueServer(context.supabase, data.id, data.prev);
  });

export const listHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ entity: z.string().optional(), limit: z.number().optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    return repo.listHistoryServer(context.supabase, data.entity, data.limit);
  });

export const listBranches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return repo.listBranchesServer(context.supabase);
  });

export const saveBranch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string(), patch: z.any(), prev: z.any().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    return repo.saveBranchServer(context.supabase, data.id, data.patch, data.prev);
  });

export const listMenuConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return repo.listMenuConfigServer(context.supabase);
  });

export const updateMenuItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string(), patch: z.any(), prev: z.any().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    return repo.updateMenuItemServer(context.supabase, data.id, data.patch, data.prev);
  });

export const listFormConfigs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return repo.listFormConfigsServer(context.supabase);
  });

export const listFormFields = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.string().parse(d ?? ""))
  .handler(async ({ data, context }) => {
    return repo.listFormFieldsServer(context.supabase, data);
  });

export const createFormField = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ formConfigId: z.string(), patch: z.any() }).parse(d))
  .handler(async ({ data, context }) => {
    return repo.createFormFieldServer(context.supabase, data.formConfigId, data.patch);
  });

export const updateFormField = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string(), patch: z.any(), prev: z.any().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    return repo.updateFormFieldServer(context.supabase, data.id, data.patch, data.prev);
  });

export const deleteFormField = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string(), prev: z.any().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    return repo.deleteFormFieldServer(context.supabase, data.id, data.prev);
  });

export const listNotificationTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return repo.listNotificationTemplatesServer(context.supabase);
  });

export const saveNotificationTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string(), patch: z.any(), prev: z.any().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    return repo.saveNotificationTemplateServer(context.supabase, data.id, data.patch, data.prev);
  });

export const listDocumentTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return repo.listDocumentTemplatesServer(context.supabase);
  });

export const saveDocumentTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string(), patch: z.any(), prev: z.any().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    return repo.saveDocumentTemplateServer(context.supabase, data.id, data.patch, data.prev);
  });

export const listNumbering = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return repo.listNumberingServer(context.supabase);
  });

export const saveNumbering = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string(), patch: z.any(), prev: z.any().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    return repo.saveNumberingServer(context.supabase, data.id, data.patch, data.prev);
  });

export const listIntegrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return repo.listIntegrationsServer(context.supabase);
  });

export const saveIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => d as { provider: string; category: string; isEnabled: boolean; config: Record<string, any>; secretKeys: string[] })
  .handler(async ({ data, context }) => {
    return repo.saveIntegrationServer(context.supabase, data.provider, data.category, data.isEnabled, data.config, data.secretKeys);
  });

export const listRolePermissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return repo.listRolePermissionsServer(context.supabase);
  });

export const saveRolePermission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ role: z.any(), module: z.string(), permissions: z.array(z.string()) }).parse(d))
  .handler(async ({ data, context }) => {
    return repo.saveRolePermissionServer(context.supabase, data.role, data.module, data.permissions);
  });

export const dataSnapshot = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return repo.dataSnapshotServer(context.supabase);
  });
