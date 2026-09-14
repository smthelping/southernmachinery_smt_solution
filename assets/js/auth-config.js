/* 公开版：认证未配置 → 应用以本地模式运行（不登录、不含客户资料库）。
   内部版本在此填入 Supabase Project URL 与 anon public key 后，
   即启用服务端登录门禁（强制改密 + TOTP MFA + 角色隔离，均由数据库 RLS 强制）。 */
window.SM_AUTH_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  corpusTable: 'knowledge_docs',
  minPasswordLength: 12
};
