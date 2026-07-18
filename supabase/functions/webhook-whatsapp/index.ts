import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function extractMessageText(payload: Record<string, unknown>): string {
  const raw = payload.text ?? payload.message ?? payload.body ?? "";

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return "";
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object" && typeof parsed.message === "string") {
        return parsed.message;
      }
      if (typeof parsed === "string") return parsed;
    } catch {
      return trimmed;
    }
    return trimmed;
  }

  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.text === "string") return obj.text;
  }

  return String(raw || "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    if (!payload.isGroup) {
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const groupId = payload.chatId || payload.chatLid || `group-${payload.phone}`;

    if (!groupId || groupId === "null" || String(groupId).includes("null")) {
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const senderName = payload.senderName || payload.name || payload.phone || "Desconhecido";
    const senderPhone = payload.senderPhone || payload.phone || "desconhecido";
    const messageText = extractMessageText(payload);
    const messageTimestamp = payload.timestamp
      ? new Date(payload.timestamp * 1000).toISOString()
      : new Date().toISOString();

    if (!messageText) {
      return new Response(JSON.stringify({ received: true, skipped: "empty_message" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const groupPhone = payload.phone || payload.senderPhone || String(groupId).split("-")[0] || "unknown";
    const { error: groupError } = await supabase.from("whatsapp_groups").insert({
      id: groupId,
      group_name: payload.groupName || `Grupo ${String(groupId).substring(0, 12)}`,
      group_phone: groupPhone,
      active: true,
    });

    if (groupError && !groupError.message.includes("duplicate key")) {
      throw groupError;
    }

    const { error: insertError } = await supabase.from("raw_messages").insert({
      group_id: groupId,
      sender_name: senderName,
      sender_phone: senderPhone,
      message_text: messageText,
      message_timestamp: messageTimestamp,
    });

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ received: true, success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Erro:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
