import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload = await req.json();

    // Validar se é uma mensagem recebida
    if (payload.event !== "message_received") {
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const { data } = payload;

    // Extrair dados relevantes
    const groupId = data.chatId;
    const senderName = data.sender.name || data.sender.pushName;
    const senderPhone = data.sender.id;
    const messageText = data.text || "";
    const messageTimestamp = new Date(data.timestamp * 1000);

    // Inserir na tabela raw_messages
    const { error } = await supabase.from("raw_messages").insert({
      group_id: groupId,
      sender_name: senderName,
      sender_phone: senderPhone,
      message_text: messageText,
      message_timestamp: messageTimestamp,
      is_processed: false,
    });

    if (error) {
      console.error("Error inserting message:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    console.log(
      `Message captured from ${senderName}: ${messageText.substring(0, 50)}...`
    );

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
