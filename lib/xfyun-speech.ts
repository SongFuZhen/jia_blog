/**
 * 讯飞「中英识别大模型」(slm) 浏览器端接入。
 * 浏览器直连 wss://iat.xf-yun.com/v1，按讯飞要求用 HmacSHA256 对请求签名
 * （APISecret 必须出现在前端——这是讯飞 Web 方案的固有做法，参考官方 web demo）。
 * 音频用 ScriptProcessor 采集 float 再转 16bit PCM@16k，按 1280 字节(≈40ms) 分帧发送。
 * 返回结果 payload.result.text 为 base64 编码的 JSON（{sn,ls,ws}），需解码后取 ws[].cw[].w。
 */

export interface IatHandlers {
  onResult: (text: string) => void;
  onError: (msg: string) => void;
  onState?: (recording: boolean) => void;
}

const HOST = "iat.xf-yun.com";
const PATH = "/v1";

/**
 * 讯飞语音识别凭证——写死在此，免去环境变量配置。
 * 注意：iat 的鉴权签名必须在浏览器端用 APISecret 完成，所以这些值本就会进入
 * 前端包（与之前 NEXT_PUBLIC_ 的暴露范围一致），仅额度风险、非账号风险。
 * 如需更换，直接改这里；或在 .env.local 用同名 NEXT_PUBLIC_ 变量覆盖。
 */
export const XFYUN_APP_ID =
  process.env.NEXT_PUBLIC_XFYUN_APPID ?? "b97b0183";
export const XFYUN_API_KEY =
  process.env.NEXT_PUBLIC_XFYUN_API_KEY ?? "63ba8d459db74c0e8b91e9228cce63ec";
export const XFYUN_API_SECRET =
  process.env.NEXT_PUBLIC_XFYUN_API_SECRET ?? "MWY5ZGFkOTZiMDRiNDY0YjcyYWNmNGE2";

function toBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

/** 把 base64（UTF-8 字节）解码成正常字符串：atob 出来是逐字节 Latin-1 串，需再按 UTF-8 还原 */
function decodeBase64Utf8(b64: string): string {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
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
  const signatureOrigin = `host: ${HOST}\ndate: ${date}\nGET ${PATH} HTTP/1.1`;
  const signature = toBase64(await hmacSha256(apiSecret, signatureOrigin));
  const authorizationOrigin = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
  const authorization = toBase64(new TextEncoder().encode(authorizationOrigin));
  return `wss://${HOST}${PATH}?authorization=${encodeURIComponent(authorization)}&date=${encodeURIComponent(date)}&host=${encodeURIComponent(HOST)}`;
}

const FRAME = 640; // 16k*16bit，640 样本 = 1280 字节 ≈ 40ms

export class XfyunIat {
  private ws: WebSocket | null = null;
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private pcm: number[] = [];
  private firstFrame = true;
  private seq = 1;
  private committed = ""; // 已确定（末帧）文本
  private live = ""; // 当前帧（累计式，每帧即全句）

  constructor(
    private appId: string = XFYUN_APP_ID,
    private apiKey: string = XFYUN_API_KEY,
    private apiSecret: string = XFYUN_API_SECRET,
  ) {}

  async start(h: IatHandlers) {
    try {
      // 每次 start 都是一次新的录音会话，重置累积状态，避免复用实例时串字
      this.pcm = [];
      this.firstFrame = true;
      this.seq = 1;
      this.committed = "";
      this.live = "";
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
    // （640 不是），这里用 4096，内部仍按 640 样本(1280 字节)分帧发给讯飞
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
        this.sendAudio(new Uint8Array(buf.buffer));
      }
    };
    source.connect(processor);
    processor.connect(ctx.destination);
  }

  /** 发送一帧音频：首帧 status=0(带 parameter)，后续 status=1 */
  private sendAudio(bytes: Uint8Array) {
    if (!this.ws) return;
    const status = this.firstFrame ? 0 : 1;
    this.firstFrame = false;
    const body: Record<string, unknown> = {
      header: { app_id: this.appId, status },
      payload: {
        audio: {
          encoding: "raw",
          sample_rate: 16000,
          channels: 1,
          bit_depth: 16,
          seq: this.seq++,
          status,
          audio: toBase64(bytes),
        },
      },
    };
    if (status === 0) {
      body.parameter = {
        iat: {
          domain: "slm",
          language: "zh_cn",
          accent: "mandarin",
          eos: 6000,
          dwa: "wpgs",
          result: { encoding: "utf8", compress: "raw", format: "json" },
        },
      };
    }
    this.ws.send(JSON.stringify(body));
  }

  /** 发送结束帧：status=2，audio 为空 */
  private sendEnd() {
    if (!this.ws) return;
    this.ws.send(
      JSON.stringify({
        header: { app_id: this.appId, status: 2 },
        payload: {
          audio: {
            encoding: "raw",
            sample_rate: 16000,
            channels: 1,
            bit_depth: 16,
            seq: this.seq++,
            status: 2,
            audio: "",
          },
        },
      }),
    );
  }

  private onMessage(e: MessageEvent, h: IatHandlers) {
    let j: {
      header?: { code?: number; message?: string; status?: number };
      payload?: { result?: { text?: string } };
    };
    try {
      j = JSON.parse(e.data as string);
    } catch {
      return;
    }
    if (j.header?.code && j.header.code !== 0) {
      h.onError(`讯飞返回错误 ${j.header.code}`);
      return;
    }
    const b64 = j.payload?.result?.text;
    if (!b64) return; // 首帧确认等无文字结果
    let obj: { sn?: number; ls?: boolean; ws?: { cw?: { w: string }[] }[] };
    try {
      obj = JSON.parse(decodeBase64Utf8(b64));
    } catch {
      return;
    }
    const text = (obj.ws ?? [])
      .map((seg) => seg.cw?.map((c) => c.w).join("") ?? "")
      .join("");
    // slm 为累计式返回：每一帧都是当前完整句子，只保留最新一帧，避免重复拼接
    if (obj.ls || j.header?.status === 2) {
      this.committed = text;
      this.live = "";
    } else {
      this.live = text;
    }
    h.onResult(this.committed + this.live);
  }

  stop() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendEnd();
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
    this.seq = 1;
    this.committed = "";
    this.live = "";
  }
}
