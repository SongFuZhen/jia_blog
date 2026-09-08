# 贡献指南

## 批量文本替换（sed）的教训

本项目开发中曾因 sed 批量替换 Tailwind 类名造成多处隐性损坏。以下规则是实测总结，**做任何批量替换前先读完**：

### 1. 短前缀匹配会误伤更长类名

```bash
# ❌ 错误：`px-3` 会匹配到 `px-3.5` 的前半段
sed -i 's/bg-white px-3/bg-white px-3 dark:bg-[#2B2225]/g'
# 结果：px-3.5 被切成 "px-3 dark:bg-[#2B2225].5"（孤立残片，类名失效）

# ✅ 正确：用完整边界匹配，或逐处用 Edit 工具
sed -i 's/bg-white px-3\.5 /bg-white px-3.5 /g'   # 先把受影响的 3.5 档修回来
```

### 2. Git Bash (Windows) 下 sed 的 `\n` 行为不可靠

- `s/xxx/yyy\nzzz/` 插入换行、`0,/re/` 地址段等写法可能报错或产生「字面 `\n`」文本
- 多行插入/跨行替换：**用 Edit 工具或 node 脚本**（`fs.readFileSync` + `replace` + `writeFileSync`），不要用 sed

### 3. 终端输出的折行是显示假象

工具输出里看到「一行被折成两行」先别急着判定文件损坏——用 `tsc` / `grep` 验证文件实际内容。本项目曾因此误判并做了无意义的"修复"。

### 4. 批量替换后的强制验证清单

```bash
npx tsc --noEmit   # 类型
npm run lint       # 规范
npm run build      # 构建（能抓住 Turbopack 层面的问题）
npm test           # 单测
```

替换完成后还应人工抽查几个命中点（`grep` 反查替换目标的边界情况）。

### 5. 依赖环境变量的客户端必须惰性初始化

```ts
// ❌ 模块顶层直接初始化：部署平台构建期读不到 DATABASE_URL 会直接构建失败
const sql = neon(process.env.DATABASE_URL!);

// ✅ 首次请求才创建
let _sql: ReturnType<typeof neon> | null = null;
function getSql() { ... }
```

同时：读环境变量统一走 `lib/server-env.ts` 的 `serverEnv()`（兼容部署平台的 `FAMILY_` 前缀命名），不要直接 `process.env.XXX`。

## 提交规范

- 一个逻辑改动一个 commit，正文用中文说明「为什么」
- 提交前跑完上面第 4 条的验证清单
- `.env.local` 永不入库（含数据库连接串与 API Token）
