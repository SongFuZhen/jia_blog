"use server";

/**
 * 私密空间密码校验（Server Action）
 * 密码只存在服务端环境变量 PRIVATE_PASSWORD 中，不会暴露给客户端。
 * 未配置 PRIVATE_PASSWORD 时一律拒绝解锁（不设默认密码）。
 * 注意：MVP 阶段仅做校验，解锁状态保存在客户端；接入 Neon/账号体系后应改为 HttpOnly Cookie 会话。
 */
export async function verifyPrivatePassword(pwd: string): Promise<boolean> {
  const expected = process.env.PRIVATE_PASSWORD;
  if (!expected) return false;
  return pwd === expected;
}
