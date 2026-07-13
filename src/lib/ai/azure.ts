// Shared Azure OpenAI client (Responses API). Used by orchestrator, timetable refine,
// committee-minutes extraction, and admission-document OCR (vision).

type Msg = { role: "system" | "user" | "assistant"; content: unknown };

function cfg() {
  return {
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    key: process.env.AZURE_OPENAI_KEY,
    model: process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-5.4",
  };
}

export function azureReady(): boolean {
  const c = cfg();
  return !!(c.endpoint && c.key);
}

function extractText(data: Record<string, unknown>): string {
  if (typeof data.output_text === "string" && data.output_text) return data.output_text;
  const out = (data.output as unknown[]) || [];
  for (const item of out) {
    const it = item as Record<string, unknown>;
    for (const c of ((it.content as unknown[]) || [])) {
      const cc = c as Record<string, unknown>;
      if (typeof cc.text === "string") return cc.text;
    }
  }
  return "";
}

async function call(input: Msg[], maxTokens = 1500): Promise<string> {
  const c = cfg();
  if (!c.endpoint || !c.key) throw new Error("AI not configured");
  const res = await fetch(c.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": c.key },
    body: JSON.stringify({ model: c.model, input, max_output_tokens: maxTokens }),
  });
  if (!res.ok) throw new Error(`Azure ${res.status}: ${await res.text()}`);
  return extractText(await res.json() as Record<string, unknown>);
}

/** Plain chat → text. */
export async function azureChat(system: string, user: string, maxTokens = 1500): Promise<string> {
  return call([{ role: "system", content: system }, { role: "user", content: user }], maxTokens);
}

/** Chat expecting a JSON object reply → parsed. Strips code fences, extracts first {...}. */
export async function azureJSON<T = Record<string, unknown>>(system: string, user: string, maxTokens = 1800): Promise<T> {
  const text = await call([{ role: "system", content: system }, { role: "user", content: user }], maxTokens);
  let t = text.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a >= 0 && b > a) t = t.slice(a, b + 1);
  return JSON.parse(t) as T;
}

/** Vision OCR: send an image (data URL or https URL) + instruction, expect a JSON object back. */
export async function azureVisionJSON<T = Record<string, unknown>>(imageUrl: string, instruction: string, maxTokens = 1200): Promise<T> {
  const input: Msg[] = [{
    role: "user",
    content: [
      { type: "input_text", text: instruction + "\n\nReply with ONLY a JSON object." },
      { type: "input_image", image_url: imageUrl },
    ],
  }];
  const text = await call(input, maxTokens);
  let t = text.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a >= 0 && b > a) t = t.slice(a, b + 1);
  return JSON.parse(t) as T;
}
