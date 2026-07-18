import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const SUMMARIZATION_SYSTEM_PROMPT = `Você é um assistente especializado em sumarizar conversas de grupos WhatsApp em português.

Seu trabalho é:
1. Identificar tópicos principais/temas discutidos
2. Sumarizar o que foi debatido sobre cada tema
3. Extrair referências importantes (links, nomes de pessoas, empresas, produtos mencionados)

Responda SEMPRE em JSON com a seguinte estrutura:
{
  "topics": [
    {
      "title": "Título do tema",
      "summary": "Resumo do que foi discutido",
      "references": ["referência 1", "referência 2"],
      "importance": "high" | "medium" | "low"
    }
  ]
}

Regras importantes:
- Cada tópico deve ser um tema coeso e bem definido
- Não inclua bate-papo social vazio (saudações, reações genéricas)
- Mantenha os resumos concisos mas informativos
- Identifique e extrai qualquer referência mencionada (URLs, nomes, etc)
- Se não houver tópicos relevantes, retorne um array vazio em "topics"`;

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { groupId, startDate, endDate } = await req.json();

    if (!groupId || !startDate || !endDate) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Buscar mensagens do período
    const { data: messages, error: fetchError } = await supabase
      .from("raw_messages")
      .select("*")
      .eq("group_id", groupId)
      .gte("message_timestamp", startDate)
      .lte("message_timestamp", endDate)
      .eq("is_processed", false);

    if (fetchError) throw fetchError;

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ topics: [], message: "No messages to summarize" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Montar o texto das mensagens para o Claude
    const messagesText = messages
      .map((msg) => `${msg.sender_name}: ${msg.message_text}`)
      .join("\n");

    // Chamar Claude API
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      throw new Error("Missing ANTHROPIC_API_KEY");
    }

    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2048,
        system: SUMMARIZATION_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Aqui estão as mensagens do grupo do dia ${new Date(startDate).toLocaleDateString("pt-BR")}:\n\n${messagesText}`,
          },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const error = await claudeResponse.text();
      throw new Error(`Claude API error: ${error}`);
    }

    const claudeData = await claudeResponse.json();
    const content = claudeData.content[0];

    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    // Parse JSON da resposta
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse JSON from Claude response");
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);
    const topics = parsedResponse.topics || [];

    // Salvar tópicos no banco de dados
    const messageIds = messages.map((m) => m.id);
    const summariesToInsert = topics.map((topic) => ({
      group_id: groupId,
      date_discussed: new Date(startDate).toISOString().split("T")[0],
      topic_title: topic.title,
      discussion_summary: topic.summary,
      references_mentioned: topic.references,
      status: "pending",
      message_count: messages.length,
      raw_message_ids: messageIds,
    }));

    const { data: insertedTopics, error: insertError } = await supabase
      .from("summarized_topics")
      .insert(summariesToInsert)
      .select();

    if (insertError) throw insertError;

    // Marcar mensagens como processadas
    await supabase
      .from("raw_messages")
      .update({ is_processed: true })
      .in("id", messageIds);

    return new Response(
      JSON.stringify({
        success: true,
        topics: insertedTopics,
        message: `${topics.length} topics summarized`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error summarizing:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to summarize messages" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
