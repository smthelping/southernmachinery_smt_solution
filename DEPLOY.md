# 站点部署说明（GitHub Pages）

1. Pages 来源：分支 `main` / 根目录（由仓库 Settings → Pages 配置）
2. 自定义域名：`solution.smthelp.eu`（见仓库根 `CNAME` 文件）
3. Cloudflare DNS：`CNAME  solution  →  <account>.github.io`，**先设为 DNS only（灰云）**，
   待 GitHub Pages 签发证书、`Enforce HTTPS` 可用后，再视需要切回代理（SSL 模式选 Full）。
