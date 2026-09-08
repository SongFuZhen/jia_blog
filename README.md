# 小佳佳的生活日记

奶油系私人生活记录站：日记记录 · 美妆成长 · 灵感收藏 · 私密健康空间。

基于 Next.js (App Router) + Tailwind CSS + Zustand + Neon Postgres，支持 PWA 安装到主屏幕。

## 本地开发

```bash
npm install
npm run dev        # http://localhost:14007
```

常用脚本：

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 开发服务器（端口 14007） |
| `npm run build` | 生产构建 |
| `npm run lint` | ESLint 检查 |
| `npm test` | 单元测试（vitest） |
| `node scripts/gen-icons.mjs` | 重新生成 PWA 全尺寸图标 |

环境变量（`.env.local`，参考仓库内配置说明）：

- `DATABASE_URL` — Neon Postgres 连接串
- `PRIVATE_PASSWORD` — 私密空间密码
- `AGNES_API_KEY` — AI 整理日记/生成小红书文案
- `IMGBED_API_TOKEN` — 图床上传

## 贡献

批量修改代码前请先阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)——里面有 sed 批量替换的踩坑记录与提交前验证清单。
