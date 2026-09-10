# Agnes AI 接口文档（agnes-2.5-flash）

> 来源：Agnes 官方 API 文档整理，用于本项目「小祯子」AI 聊天（见 `app/api/ai-chat/route.ts` 与 `components/ai-chat-sheet.tsx`）。
> 改 AI 聊天 / 流式相关代码前，先读本文件。

## 概述

- **模型**：`agnes-2.5-flash`（Agnes 2.0 Flash 的 GA 升级版，原 `agnes-2.0-flash` 已废弃）。
- **Base URL**：`https://apihub.agnes-ai.com/v1`
- **鉴权**：`Authorization: Bearer <AGNES_API_KEY>`（本项目服务端读取 `AGNES_API_KEY` / `AGNES_BASE_URL` / `AGNES_CHAT_MODEL`，见 `lib/server-env.ts`）。
- **协议**：OpenAI 兼容 Chat Completions；另支持 Responses API、Anthropic 兼容 Messages API。
- **能力**：多轮对话、代码、Agent 工作流、工具调用、图像理解（image_url）、流式输出。
- **上下文**：512K；最大输出 65.5K。
- **价格（当前）**：输入 / 输出 / 缓存输入 均 $0 / 1M tokens（免费阶段）。

## 本项目实际使用的接口：Chat Completions（流式）

### 请求

```
POST https://apihub.agnes-ai.com/v1/chat/completions
```

Headers：

```
Authorization: Bearer <AGNES_API_KEY>
Content-Type: application/json
```

Body（OpenAI 兼容 `messages`）：

```json
{
  "model": "agnes-2.5-flash",
  "messages": [
    { "role": "system", "content": "你是小祯子，是小可爱的男朋友……" },
    { "role": "user", "content": "今天好累" }
  ],
  "temperature": 0.8,
  "stream": true
}
```

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| model | string | 是 | 固定 `agnes-2.5-flash` |
| messages | array | 是 | system / user / assistant 多轮 |
| temperature | number | 否 | 越低越确定 |
| max_tokens | number | 否 | 最大输出 token |
| stream | boolean | 否 | `true` 开启流式 |
| tools / tool_choice | array / string | 否 | 工具调用 |
| chat_template_kwargs | object | 否 | `{"enable_thinking": true}` 开启思考模式 |

### 流式响应（SSE）格式 —— 解析要点

返回 `Content-Type: text/event-stream`，每行一条 `data:` 事件：

```
data: {"id":"chatcmpl_xxx","object":"chat.completion.chunk","model":"agnes-2.5-flash","choices":[{"index":0,"delta":{"role":"assistant","content":"你"},"finish_reason":null}]}

data: {"id":"chatcmpl_xxx","choices":[{"index":0,"delta":{"content":"辛苦啦"},"finish_reason":null}]}

data: [DONE]
```

- 每个分片的增量文本在 **`choices[0].delta.content`**。
- 流以 **`data: [DONE]`** 结束。
- 解析方式（本项目路由实现）：按 `\n` 切分，过滤以 `data:` 开头的行，去掉前缀后 `JSON.parse`，取出 `delta.content` 追加；跳过 `[DONE]` 与无法解析的行。
- 完整（非流式）响应里文本在 `choices[0].message.content`；流式里则是 `choices[0].delta.content`。

### 非流式响应

```json
{
  "id": "chatcmpl_xxx",
  "object": "chat.completion",
  "model": "agnes-2.5-flash",
  "choices": [
    { "index": 0, "message": { "role": "assistant", "content": "……" }, "finish_reason": "stop" }
  ],
  "usage": { "prompt_tokens": 35, "completion_tokens": 58, "total_tokens": 93 }
}
```

## 图像输入（image_url）

`messages` 的 user 角色 `content` 可为数组，混合文本与图片 URL（需公网可访问）：

```json
{
  "role": "user",
  "content": [
    { "type": "text", "text": "描述这张图" },
    { "type": "image_url", "image_url": { "url": "https://example.com/img.jpg" } }
  ]
}
```

## 思考模式（Thinking）

代码 / 调试 / 推理任务可开启，提升拆题与求解质量：

```json
{
  "model": "agnes-2.5-flash",
  "messages": [{ "role": "user", "content": "写个处理 CSV 的 Python 脚本" }],
  "chat_template_kwargs": { "enable_thinking": true }
}
```

普通编码 `budget_tokens: 2048` 起；复杂任务按需增大。

## 其他接口（备查，本项目暂未用）

### Responses API

```
POST https://apihub.agnes-ai.com/v1/responses
```
用 `input`（字符串或结构化数组）代替 `messages`；输出在 `output[].content[].text`（`type: "message"`）。

### Messages API（Anthropic 兼容）

```
POST https://apihub.agnes-ai.com/v1/messages
Headers: x-api-key / anthropic-version: 2023-06-01
```
`system` 单独传，`messages` 仅 user/assistant。

## 从 2.0 升级

| 项 | 2.0（废弃） | 2.5 |
| --- | --- | --- |
| Endpoint | `/v1/chat/completions` | 同 |
| Base URL | `https://apihub.agnes-ai.com/v1` | 同 |
| Model | `agnes-2.0-flash` | `agnes-2.5-flash` |
| 消息 / 流式 / 工具 / 图像格式 | OpenAI 兼容 | 同 |

迁移通常只需改 `model` 值，不要继续用废弃的 2.0 作兜底。

## 集成检查清单

- [ ] `model` 用 `agnes-2.5-flash`。
- [ ] 基础对话需含 `model` + `messages`。
- [ ] 图像输入用公网 `image_url`。
- [ ] 需要逐字输出时 `stream: true`，并按上面 SSE 格式解析 `delta.content`。
