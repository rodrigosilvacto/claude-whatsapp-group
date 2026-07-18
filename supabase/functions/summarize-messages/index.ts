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

function buildHeuristicTopic(day: string, messages: RawMessage[]): TopicDraft {
  const sorted = [...messages].sort(
    (a, b) => new Date(a.message_timestamp).getTime() - new Date(b.message_timestamp).getTime()
  );

  const participants = [...new Set(sorted.map((m) => m.sender_name || "Participante"))];
  const lines = sorted
    .map((m) => {
      const text = extractText(m.message_text);
      return text ? `${m.sender_name}: ${text}` : null;
    })
    .filter(Boolean) as string[];

  const firstLine = extractText(sorted[0]?.message_text || "");
  const titleBase = firstLine.length > 8
    ? firstLine.slice(0, 72) + (firstLine.length > 72 ? "…" : "")
    : `Resumo das discussões — ${formatDateBr(day)}`;

  const summaryParts = [
    `Resumo automático de ${sorted.length} mensagem(ns) em ${formatDateBr(day)}.`,
    `Participantes: ${participants.join(", ")}.`,
    "",
    "Conteúdo consolidado:",
    ...lines.map((line) => `• ${line}`),
  ];

  return {
    topic_title: titleBase,
    discussion_summary: summaryParts.join("\n"),
    references_mentioned: participants,
    date_discussed: day,
    message_count: sorted.length,
    raw_message_ids: sorted.map((m) => m.id),
  };
}

async function buildTopicsWithAi(
  day: string,
  messages: RawMessage[],
  apiKey: string
): Promise<TopicDraft | null> {
  const transcript = messages
    .map((m) => {
      const time = new Date(m.message_timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      return `[${time}] ${m.sender_name}: ${extractText(m.message_text)}`;
    })
    .join("\n");

  const prompt = `Você é um assistente corporativo. Analise as mensagens de um grupo WhatsApp e gere UM tópico em português do Brasil.

Retorne APENAS JSON válido no formato:
{"topic_title":"...","discussion_summary":"...","references_mentioned":["..."]}

Regras:
- topic_title: curto e objetivo (até 80 caracteres)
- discussion_summary: 2 a 5 frases claras sobre o que foi discutido
- references_mentioned: nomes ou assuntos citados

Mensagens (${formatDateBr(day)}):
${transcript}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini",
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Responda somente com JSON válido." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) return null;

    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    return {
      topic_title: String(parsed.topic_title || `Resumo — ${formatDateBr(day)}`).slice(0, 120),
      discussion_summary: String(parsed.discussion_summary || ""),
      references_mentioned: Array.isArray(parsed.references_mentioned)
        ? parsed.references_mentioned.map(String)
        : [],
      date_discussed: day,
      message_count: messages.length,
      raw_message_ids: messages.map((m) => m.id),
    };
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { groupId, startDate, endDate } = await req.json();

    if (!groupId || !startDate || !endDate) {
      return new Response(JSON.stringify({ error: "Parâmetros obrigatórios ausentes" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, supabaseKey);

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
          message: "Não há mensagens pendentes de sumarização no período selecionado.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const byDay = groupByDay(messages as RawMessage[]);
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const drafts: TopicDraft[] = [];

    for (const [day, dayMessages] of byDay.entries()) {
      let draft: TopicDraft | null = null;
      if (openaiKey) {
        draft = await buildTopicsWithAi(day, dayMessages, openaiKey);
      }
      drafts.push(draft || buildHeuristicTopic(day, dayMessages));
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
    return new Response(
      JSON.stringify({
        success: true,
        topics: topics || [],
        message:
          count === 1
            ? "1 tópico gerado e enviado para aprovação."
            : `${count} tópicos gerados e enviados para aprovação.`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    console.error("Erro:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
