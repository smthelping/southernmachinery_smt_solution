/* ==========================================================================
 * auth-config.js — Supabase 接入配置
 *
 * 填入你自己的项目地址与 **anon public key**（可公开，受 RLS 保护）：
 *   Supabase Dashboard → Project Settings → API → Project URL / anon public key
 *
 * ⚠️ 绝对不要在此填 service_role key —— 它会绕过所有 RLS，
 *    而本文件在前端加载、任何人可见。service_role 只在本机脚本的环境变量里使用。
 *
 * 两个值留空时：应用自动降级为「本地模式」（不登录、使用本地 data/kb.js），
 * 现有能力不受影响。公开仓库发行版即为此状态。
 * ========================================================================== */
window.SM_AUTH_CONFIG = {
  // 项目 ref：nfbwnyndpdsnvocymlgn · 2026-09-15 接入
  // 这里只放 anon public key（设计上可公开）；能否读到数据完全由数据库 RLS 决定。
  // 已核验：anon 直接查 knowledge_docs 返回 42501 permission denied（符合预期）。
  supabaseUrl: 'https://nfbwnyndpdsnvocymlgn.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mYndueW5kcGRzbnZvY3ltbGduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzNTgxNTIsImV4cCI6MjEwNDkzNDE1Mn0.vecMrcxZ8z4JgsJug3BXao1-q0L2NkYCRUIibQt8dAA',

  // 团队资料库在服务端的表名（RLS 三重门禁：登录 + MFA(aal2) + 已改初始密码）
  corpusTable: 'knowledge_docs',

  // 首次登录强制改密的最短长度（服务端策略见 supabase/migrations）
  minPasswordLength: 12
};
