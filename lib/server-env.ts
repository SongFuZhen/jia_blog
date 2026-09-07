/**
 * 服务端环境变量读取：兼容部署平台上的 FAMILY_ 前缀命名。
 * FAMILY_DATABASE_URL 这类「FAMILY_ + 原名」优先于原名。
 */
export function serverEnv(name: string): string | undefined {
  return process.env[`FAMILY_${name}`] ?? process.env[name];
}
