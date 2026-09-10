/**
 * 讯飞星火大模型（Spark）浏览器端接入。
 * 与 iat 同一套 XFYun 密钥（已写死在 xfyun-speech.ts），浏览器直连
 * wss://spark-api.xfyun.cn/v3.1/chat，按讯飞要求用 HmacSHA256 对请求签名。
 * APISecret 必须出现在前端——与语音听写一致，仅额度风险、非账号风险。
 */

import {
  XFYUN_APP_ID,
  XFYUN_API_KEY,
  XFYUN_API_SECRET,
} from "@/lib/xfyun-speech";

export type SparkRole = "system" | "user" | "assistant";
export interface SparkMessage {
  role: SparkRole;
  content: string;
}

export interface SparkHandlers {
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}

const HOST = "spark-api.xfyun.cn";
const PATH = "/v3.1/chat";

function toBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

async function hmacSha256(key: string, data: string): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(data));
  return new Uint8Array(sig);
}

async function buildWsUrl(
  appId: string,
  apiKey: string,
  apiSecret: string,
): Promise<string> {
  const date = new Date().toUTCString();
  const signatureOrigin = `host: ${HOST}\ndate: ${date}\nGET ${PATH} HTTP/1.1`;
  const signature = toBase64(await hmacSha256(apiSecret, signatureOrigin));
  const authorizationOrigin = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date authorization", signature="${signature}"`;
  const authorization = toBase64(new TextEncoder().encode(authorizationOrigin));
  return `wss://${HOST}${PATH}?authorization=${encodeURIComponent(authorization)}&date=${encodeURIComponent(date)}&host=${encodeURIComponent(HOST)}`;
}

export class XfyunSpark {
  private ws: WebSocket | null = null;

  constructor(
    private appId: string = XFYUN_APP_ID,
    private apiKey: string = XFYUN_API_KEY,
    private apiSecret: string = XFYUN_API_SECRET,
  ) {}

  /** 发送一轮对话（history 含 system/user/assistant 多轮），增量回调 onDelta */
  chat(history: SparkMessage[], h: SparkHandlers) {
    const messages = history.map((m) => ({ role: m.role, content: m.content }));
    buildWsUrl(this.appId, this.apiKey, this.apiSecret)
      .then((u) => {
        const ws = new WebSocket(u);
        this.ws = ws;
        ws.onopen = () => {
          ws.send(
            JSON.stringify({
              header: { app_id: this.appId, uid: "jia-blog" },
              parameter: {
                chat: {
                  domain: "generalv3",
                  temperature: 0.6,
                  max_tokens: 800,
                  top_k: 4,
                },
              },
              payload: { message: { text: messages } },
            }),
          );
        };
        ws.onerror = () => h.onError("AI 连接失败，检查网络或讯飞密钥");
        ws.onmessage = (e) => this.onMessage(e, h);
        ws.onclose = () => {
          this.ws = null;
        };
      })
      .catch(() => h.onError("AI 连接失败"));
  }

  private onMessage(e: MessageEvent, h: SparkHandlers) {
    let j: {
      header?: { code?: number; status?: number; message?: string };
      payload?: { choices?: { text?: { content?: string }[]; status?: number } };
    };
    try {
      j = JSON.parse(e.data as string);
    } catch {
      return;
    }
    if (j.header?.code && j.header.code !== 0) {
      h.onError(`星火返回错误 ${j.header.code}${j.header.message ? `：${j.header.message}` : ""}`);
      this.close();
      return;
    }
    const delta = j.payload?.choices?.text?.[0]?.content ?? "";
    if (delta) h.onDelta(delta);
    if (j.header?.status === 2) {
      h.onDone();
      this.close();
    }
  }

  close() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
    this.ws = null;
  }
}
