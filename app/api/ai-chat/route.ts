import { type NextRequest } from "next/server";
import { serverEnv } from "@/lib/server-env";

export const dynamic = "force-dynamic";

const AI_BASE = serverEnv("AGNES_BASE_URL") ?? "https://apihub.agnes-ai.com/v1";
const AI_KEY = serverEnv("AGNES_API_KEY");
const AI_MODEL = serverEnv("AGNES_CHAT_MODEL") ?? "agnes-2.5-flash";

/**
 * AI 聊天（小祯子）流式转发：
 * 客户端传 { messages }，这里转发给 Agnes /chat/completions（stream:true），
 * 把 OpenAI 的 SSE 流转换成「纯文本分片」流返回，前端逐片追加即可。
 */
export async function POST(req: NextRequest) {
  if (!AI_KEY) {
    return new Response("未配置 AGNES_API_KEY", { status: 500 });
  }

  let messages: { role: string; content: string }[] = [];
  try {
    const body = await req.json();
    if (Array.isArray(body?.messages)) messages = body.messages;
  } catch {
    return new Response("请求体解析失败", { status: 400 });
  }
  if (messages.length === 0) {
    return new Response("messages 不能为空", { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${AI_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        temperature: 0.8,
        stream: true,
      }),
    });
  } catch (e) {
    return new Response(`AI 请求失败：${e instanceof Error ? e.message : ""}`, {
      status: 502,
    });
  }

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    return new Response(`AI 接口 ${upstream.status}: ${text.slice(0, 200)}`, {
      status: upstream.status,
    });
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let buf = "";
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith("data:")) continue;
            const data = t.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const json = JSON.parse(data);
              const delta: string | undefined = json?.choices?.[0]?.delta?.content;
              if (delta) controller.enqueue(encoder.encode(delta));
            } catch {
              // 跳过无法解析的分片（注释行 / 心跳等）
            }
          }
        }
      } catch (e) {
        controller.enqueue(
          encoder.encode(`\n（流式中断：${e instanceof Error ? e.message : "未知错误"}）`),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
