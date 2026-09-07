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

/* ==================== Agnes AI（P2-12/13） ==================== */

const AI_BASE = process.env.AGNES_BASE_URL ?? "https://apihub.agnes-ai.com/v1";
const AI_KEY = process.env.AGNES_API_KEY;
const AI_MODEL = process.env.AGNES_CHAT_MODEL ?? "agnes-2.5-flash";

/** AI 是否可用（配置了 key） */
export async function aiAvailable(): Promise<boolean> {
  return Boolean(AI_KEY);
}

/** OpenAI 兼容 chat 调用；失败抛错，由调用方决定兜底 */
async function chat(system: string, user: string): Promise<string> {
  if (!AI_KEY) throw new Error("未配置 AGNES_API_KEY");
  const res = await fetch(`${AI_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.8,
    }),
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) {
    throw new Error(`AI 接口 ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("AI 没有返回内容");
  return text;
}

export interface DiaryInput {
  title: string;
  content: string;
  mood?: string | null;
  weather?: string | null;
  tags?: string[];
}

/**
 * P2-12：AI 整理日记。
 * 把随手记的碎片整理成温柔自然的日记，保留原意与口语感，不编造事实。
 * 返回 { title, content }；解析失败时把整段返回作为 content。
 */
export async function aiPolishDiary(
  input: DiaryInput,
): Promise<{ title: string; content: string }> {
  const text = await chat(
    "你是「小佳佳的生活日记」的日记整理助手。用户会给你一段随手记的日记碎片，请你把它整理成一篇温柔、自然、口语化的日记：保留她的原意和语气，可以理顺句子、补充过渡，但绝不编造她没写过的事实。篇幅不超过 300 字。只输出 JSON，格式：{\"title\":\"标题\",\"content\":\"正文\"}，不要输出其他任何内容。",
    [
      `标题：${input.title}`,
      input.mood ? `心情：${input.mood}` : "",
      input.weather ? `天气：${input.weather}` : "",
      input.tags?.length ? `标签：${input.tags.join("、")}` : "",
      `正文：${input.content}`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]) as { title?: string; content?: string };
      if (parsed.content) {
        return { title: parsed.title?.trim() || input.title, content: parsed.content.trim() };
      }
    }
  } catch {
    // fallthrough
  }
  return { title: input.title, content: text };
}

/**
 * P2-13：AI 生成小红书文案。
 */
export async function aiGenerateXhs(input: DiaryInput): Promise<string> {
  return chat(
    "你是一位小红书文案写手。根据用户的日记内容，写一条真实、可爱、不夸张的小红书文案：带一个吸睛但不说谎的标题、简短分段的正文、贴合内容的 emoji，最后给出 5-8 个话题标签（#开头）。整体口语化、像真人和朋友分享。只输出文案本身。",
    [
      `日记标题：${input.title}`,
      input.mood ? `心情：${input.mood}` : "",
      input.tags?.length ? `标签：${input.tags.join("、")}` : "",
      `正文：${input.content}`,
    ]
      .filter(Boolean)
      .join("\n"),
  );
}
