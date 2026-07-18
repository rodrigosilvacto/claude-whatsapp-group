import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type RawMessage = {
  id: string;
  group_id: string;
  sender_name: string;
  message_text: string;
  message_timestamp: string;
  is_processed: boolean;
};

type TopicDraft = {
  topic_title: string;
  discussion_summary: string;
  references_mentioned: string[];
  date_discussed: string;
  message_count: number;
  raw_message_ids: string[];
};

function extractText(text: string): string {
  if (!text) return "";
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed.message === "string") return parsed.message.trim();
    if (typeof parsed === "string") return parsed.trim();
  } catch {
    // texto simples
  }
  return text.trim();
}

function formatDateBr(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

function groupByDay(messages: RawMessage[]): Map<string, RawMessage[]> {
  const groups = new Map<string, RawMessage[]>();
  for (const message of messages) {
    const day = message.message_timestamp.slice(0, 10);
    const list = groups.get(day) || [];
    list.push(message);
    groups.set(day, list);
  }
  return groups;
}

function buildFallbackTopic(day: string, messages: RawMessage[]): TopicDraft {
  const sorted = [...messages].sort(
    (a, b) => new Date(a.message_timestamp).getTime() - new Date(b.message_timestamp).getTime()
  );
  const participants = [...new Set(sorted.map((m) => m.sender_name || "Participante"))];
  const lines = sorted
    .map((m) => {
      const text = extractText(m.message_text);
      return text ? `• ${m.sender_name}: ${text}` : null;
    })
    .filter(Boolean) as string[];

  return {
    topic_title: `Conversa do dia ${formatDateBr(day)}`,
    discussion_summary: [
      `Resumo das ${sorted.length} mensagens do dia ${formatDateBr(day)}.`,
      `Quem participou: ${participants.join(", ")}.`,
      "",
      ...lines,
    ].join("\n"),
    references_mentioned: participants,
    date_discussed: day,
    message_count: sorted.length,
    raw_message_ids: sorted.map((m) => m.id),
  };
}

function extractJson(text: string): unknown {
  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Resposta da IA em formato inválido");
  }
}

const DEFAULT_MODELS = [
  Deno.env.get("ANTHROPIC_MODEL") || "claude-sonnet-4-6",
  "claude-sonnet-4-5-20250929",
  "claude-haiku-4-5-20251001",
].filter((model, index, arr) => arr.indexOf(model) === index);

async function callAnthropic(apiKey: string, model: string, prompt: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const errText = await response.text();
  if (!response.ok) {
    throw new Error(`Anthropic ${model} (${response.status}): ${errText.slice(0, 400)}`);
  }

  const payload = JSON.parse(errText);
  const content = payload.content?.find((c: { type: string }) => c.type === "text")?.text;
  if (!content) throw new Error(`Anthropic ${model}: resposta sem texto`);
  return content;
}

async function summarizeWithAnthropic(
  day: string,
  messages: RawMessage[],
  apiKey: string
): Promise<TopicDraft[]> {
  const transcript = messages
    .map((m) => {
      const time = new Date(m.message_timestamp).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `[${time}] ${m.sender_name}: ${extractText(m.message_text)}`;
    })
    .join("\n");

  const prompt = `Você é um assistente corporativo que resume conversas de grupos de WhatsApp para gestores.

Analise as mensagens abaixo (data ${formatDateBr(day)}) e gere um ou mais tópicos claros em português do Brasil.

Regras:
1. Agrupe por assunto. Se houver um único tema, retorne 1 tópico. Se houver assuntos distintos, retorne até 5.
2. Escreva de forma simples, objetiva e útil para quem não leu o grupo.
3. Em references_mentioned, liste pessoas, documentos, sistemas, prazos, produtos ou decisões mencionadas. Se não houver, use [].
4. Não invente informações que não estejam nas mensagens.
5. Retorne APENAS JSON válido neste formato:
{
  "topics": [
    {
      "topic_title": "título curto",
      "discussion_summary": "resumo em 2 a 6 frases",
      "references_mentioned": ["referência 1", "referência 2"]
    }
  ]
}

Mensagens:
${transcript}`;

  let lastError = "Falha desconhecida na Anthropic";
  let content = "";

  for (const model of DEFAULT_MODELS) {
    try {
      content = await callAnthropic(apiKey, model, prompt);
      lastError = "";
      break;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.error(lastError);
    }
  }

  if (!content) throw new Error(lastError);

  const parsed = extractJson(content) as {
    topics?: Array<{
      topic_title?: string;
      discussion_summary?: string;
      references_mentioned?: string[];
    }>;
  };

  const topics = Array.isArray(parsed.topics) ? parsed.topics : [];
  if (topics.length === 0) return [buildFallbackTopic(day, messages)];

  const ids = messages.map((m) => m.id);
  return topics.map((topic) => ({
    topic_title: String(topic.topic_title || `Assunto do dia ${formatDateBr(day)}`).slice(0, 120),
    discussion_summary: String(topic.discussion_summary || "Resumo indisponível."),
    references_mentioned: Array.isArray(topic.references_mentioned)
      ? topic.references_mentioned.map(String).filter(Boolean)
      : [],
    date_discussed: day,
    message_count: messages.length,
    raw_message_ids: ids,
  }));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { groupId, startDate, endDate } = await req.json();

    if (!groupId || !startDate || !endDate) {
      return new Response(JSON.stringify({ error: "Informe grupo e período para gerar o resumo." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, supabaseKey);
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: "A chave da Anthropic não está configurada no Supabase." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: messages, error } = await supabase
      .from("raw_messages")
      .select("id, group_id, sender_name, message_text, message_timestamp, is_processed")
      .eq("group_id", groupId)
      .eq("is_processed", false)
      .gte("message_timestamp", `${startDate}T00:00:00`)
      .lte("message_timestamp", `${endDate}T23:59:59.999`)
      .order("message_timestamp", { ascending: true });

    if (error) throw error;

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          topics: [],
          usedAi: true,
          message: "Não há conversas novas para resumir neste período. Tudo já foi processado.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const byDay = groupByDay(messages as RawMessage[]);
    const drafts: TopicDraft[] = [];
    let usedAi = true;
    let aiWarning = "";

    for (const [day, dayMessages] of byDay.entries()) {
      try {
        const aiTopics = await summarizeWithAnthropic(day, dayMessages, anthropicKey);
        drafts.push(...aiTopics);
      } catch (aiError) {
        const detail = aiError instanceof Error ? aiError.message : String(aiError);
        console.error("AI fallback:", detail);
        usedAi = false;
        aiWarning = detail;
        drafts.push(buildFallbackTopic(day, dayMessages));
      }
    }

    const rows = drafts.map((draft) => ({
      group_id: groupId,
      date_discussed: draft.date_discussed,
      topic_title: draft.topic_title,
      discussion_summary: draft.discussion_summary,
      references_mentioned: draft.references_mentioned,
      status: "pending",
      message_count: draft.message_count,
      raw_message_ids: draft.raw_message_ids,
    }));

    const { data: topics, error: insertError } = await supabase
      .from("summarized_topics")
      .insert(rows)
      .select();

    if (insertError) throw insertError;

    const messageIds = (messages as RawMessage[]).map((m) => m.id);
    const { error: updateError } = await supabase
      .from("raw_messages")
      .update({ is_processed: true })
      .in("id", messageIds);

    if (updateError) throw updateError;

    const count = topics?.length || 0;
    const aiLabel = usedAi ? "com inteligência artificial" : "com resumo básico";
    const baseMessage =
      count === 0
        ? "Nenhum resumo foi gerado."
        : count === 1
          ? `Pronto! Geramos 1 resumo ${aiLabel} para você revisar.`
          : `Pronto! Geramos ${count} resumos ${aiLabel} para você revisar.`;

    return new Response(
      JSON.stringify({
        success: true,
        topics: topics || [],
        usedAi,
        warning: aiWarning || undefined,
        message: usedAi
          ? baseMessage
          : `${baseMessage} A IA não respondeu agora, então usamos um resumo simples.`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível gerar o resumo agora.";
    console.error("Erro:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
