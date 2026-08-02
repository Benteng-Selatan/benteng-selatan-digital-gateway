export const ADMIN_ROLES = [
  "super_admin",
  "operator",
  "content_editor",
  "reviewer",
  "auditor",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  operator: "Operator Pelayanan",
  content_editor: "Editor Konten",
  reviewer: "Reviewer",
  auditor: "Auditor",
};

export const ADMIN_PERMISSIONS = [
  "cms:view",
  "cms:edit",
  "operations:view",
  "requests:view",
  "requests:edit",
  "requests:message",
  "requests:sensitive",
  "submissions:view",
  "submissions:review",
  "staff:manage",
  "audit:view",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

const rolePermissions: Record<AdminRole, readonly AdminPermission[]> = {
  super_admin: ADMIN_PERMISSIONS,
  operator: [
    "operations:view",
    "requests:view",
    "requests:edit",
    "requests:message",
    "requests:sensitive",
  ],
  content_editor: [
    "cms:view",
    "cms:edit",
    "operations:view",
    "submissions:view",
    "submissions:review",
  ],
  reviewer: [
    "operations:view",
    "requests:view",
    "submissions:view",
    "submissions:review",
  ],
  auditor: [
    "operations:view",
    "requests:view",
    "submissions:view",
    "audit:view",
  ],
};

export function hasAdminPermission(
  role: AdminRole,
  permission: AdminPermission
): boolean {
  return rolePermissions[role].includes(permission);
}

export function permissionsForRole(role: AdminRole): AdminPermission[] {
  return [...rolePermissions[role]];
}
