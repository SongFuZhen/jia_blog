/**
 * 讯飞语音听写（iat）浏览器端接入。
 * 浏览器直连 wss://iat-api.xfyun.cn，按讯飞要求用 HmacSHA256 对请求签名
 * （APISecret 必须出现在前端——这是讯飞 Web 方案的固有做法，参考官方 web demo）。
 * 音频用 ScriptProcessor 采集 float 再转 16bit PCM@16k，按 ~40ms(640 样本) 分帧发送。
 */

export interface IatHandlers {
  onResult: (text: string) => void;
  onError: (msg: string) => void;
  onState?: (recording: boolean) => void;
}

const HOST = "iat-api.xfyun.cn";

/**
 * 讯飞语音听写（iat）凭证——写死在此，免去环境变量配置。
 * 注意：iat 的鉴权签名必须在浏览器端用 APISecret 完成，所以这些值本就会进入
 * 前端包（与之前 NEXT_PUBLIC_ 的暴露范围一致），仅额度风险、非账号风险。
 * 如需更换，直接改这里；或在 .env.local 用同名 NEXT_PUBLIC_ 变量覆盖。
 */
export const XFYUN_APP_ID =
  process.env.NEXT_PUBLIC_XFYUN_APPID ?? "5c0ec9db";
export const XFYUN_API_KEY =
  process.env.NEXT_PUBLIC_XFYUN_API_KEY ?? "856a8da6e76d61f332ca72cd6263b655";
export const XFYUN_API_SECRET =
  process.env.NEXT_PUBLIC_XFYUN_API_SECRET ?? "ZmQ5Zjg2YjMzY2E2MzIyOWNkZmFkMDhl";

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

async function buildWsUrl(appId: string, apiKey: string, apiSecret: string): Promise<string> {
  const date = new Date().toUTCString();
  const signatureOrigin = `host: ${HOST}\ndate: ${date}\nGET /v2/iat HTTP/1.1`;
  const signature = toBase64(await hmacSha256(apiSecret, signatureOrigin));
  const authorizationOrigin = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
  const authorization = toBase64(new TextEncoder().encode(authorizationOrigin));
  return `wss://${HOST}/v2/iat?authorization=${encodeURIComponent(authorization)}&date=${encodeURIComponent(date)}&host=${HOST}`;
}

const FRAME = 640; // 16k * 16bit * 40ms

export class XfyunIat {
  private ws: WebSocket | null = null;
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private pcm: number[] = [];
  private committed = "";
  private live = "";
  private firstFrame = true;

  constructor(
    private appId: string = XFYUN_APP_ID,
    private apiKey: string = XFYUN_API_KEY,
    private apiSecret: string = XFYUN_API_SECRET,
  ) {}

  async start(h: IatHandlers) {
    try {
      // 每次 start 都是一次新的录音会话，重置累积状态，避免复用实例时串字
      this.committed = "";
      this.live = "";
      this.firstFrame = true;
      this.pcm = [];
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ws = new WebSocket(
        await buildWsUrl(this.appId, this.apiKey, this.apiSecret),
      );
      this.ws = ws;
      ws.onopen = () => this.attachAudio();
      ws.onerror = () => h.onError("语音连接失败，检查网络或讯飞密钥");
      // 无论正常结束还是出错，close 时都要释放麦克风与音频上下文
      ws.onclose = () => {
        this.cleanup();
        h.onState?.(false);
      };
      ws.onmessage = (e) => this.onMessage(e, h);
      h.onState?.(true);
    } catch {
      this.cleanup();
      h.onError("没有麦克风权限");
    }
  }

  private attachAudio() {
    if (!this.stream) return;
    const ctx = new AudioContext({ sampleRate: 16000 });
    this.ctx = ctx;
    const source = ctx.createMediaStreamSource(this.stream);
    // 注意：ScriptProcessor 的 bufferSize 必须是 256~16384 的 2 的幂
    // （640 不是），这里用 4096，内部仍按 640 样本分帧发给讯飞
    const processor = ctx.createScriptProcessor(4096, 1, 1);
    this.source = source;
    this.processor = processor;
    processor.onaudioprocess = (ev) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      const input = ev.inputBuffer.getChannelData(0);
      for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        this.pcm.push(s < 0 ? s * 0x8000 : s * 0x7fff);
      }
      while (this.pcm.length >= FRAME) {
        const chunk = this.pcm.splice(0, FRAME);
        const buf = new Int16Array(chunk);
        this.sendFrame(new Uint8Array(buf.buffer), !this.firstFrame);
        this.firstFrame = false;
      }
    };
    source.connect(processor);
    processor.connect(ctx.destination);
  }

  private sendFrame(bytes: Uint8Array, intermediate: boolean) {
    if (!this.ws) return;
    const body: Record<string, unknown> = {
      data: {
        status: intermediate ? 1 : 0,
        format: "audio/L16;rate=16000",
        encoding: "raw",
        audio: toBase64(bytes),
      },
    };
    if (!intermediate) {
      body.common = { app_id: this.appId };
      body.business = {
        language: "zh_cn",
        domain: "iat",
        accent: "mandarin",
        vad_eos: 3000,
        dwa: "wpgs",
      };
    }
    this.ws.send(JSON.stringify(body));
  }

  private onMessage(e: MessageEvent, h: IatHandlers) {
    let j: { code?: number; data?: { result?: { ws?: { cw?: { w: string }[] }[]; ls?: boolean }; is_last?: boolean } };
    try {
      j = JSON.parse(e.data as string);
    } catch {
      return;
    }
    if (j.code && j.code !== 0) {
      h.onError(`讯飞返回错误 ${j.code}`);
      return;
    }
    const txt = (j.data?.result?.ws ?? [])
      .map((seg) => seg.cw?.map((c) => c.w).join("") ?? "")
      .join("");
    if (j.data?.result?.ls || j.data?.is_last) {
      this.committed += txt;
      this.live = "";
    } else {
      this.live = txt;
    }
    h.onResult(this.committed + this.live);
  }

  stop() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ data: { status: 2, audio: "" } }));
      this.ws.close();
    }
    this.cleanup();
  }

  private cleanup() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.source?.disconnect();
    this.processor?.disconnect();
    this.ctx?.close().catch(() => {});
    this.stream = null;
    this.source = null;
    this.processor = null;
    this.ctx = null;
    this.ws = null;
    this.pcm = [];
    this.firstFrame = true;
  }
}
