import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
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
    const messageTimestamp = new Date(data.timestamp * 1000).toISOString();

    // Insert via Supabase REST API (anon key)
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    const response = await fetch(`${supabaseUrl}/rest/v1/raw_messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseAnonKey || "",
        "Authorization": `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        group_id: groupId,
        sender_name: senderName,
        sender_phone: senderPhone,
        message_text: messageText,
        message_timestamp: messageTimestamp,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Error inserting message:", error);
      return new Response(JSON.stringify({ error: error }), {
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
