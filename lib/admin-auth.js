export const ADMIN_SESSION_COOKIE = "jilo_admin_key";

export function hasValidAdminKey(candidate, adminKey) {
  if (!candidate || !adminKey) return false;
  return candidate === adminKey;
}

export function isAdminAuthorized(request, adminKey) {
  const headerKey = request.headers.get("x-admin-key");
  if (hasValidAdminKey(headerKey, adminKey)) return true;

  const cookieHeader = request.headers.get("cookie") || "";
  const cookieValue = cookieHeader
    .split(";")
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith(`${ADMIN_SESSION_COOKIE}=`))
    ?.slice(`${ADMIN_SESSION_COOKIE}=`.length);

  return hasValidAdminKey(cookieValue, adminKey);
}
