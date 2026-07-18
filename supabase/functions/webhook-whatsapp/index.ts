import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

    if (!payload.isGroup) {
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const groupId = payload.chatId || payload.chatLid || `group-${payload.phone}`;

    if (!groupId || groupId === "null" || groupId.includes("null")) {
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const senderName = payload.senderName || payload.name || payload.phone || "Unknown";
    const senderPhone = payload.senderPhone || payload.phone || "unknown";
    const messageText = payload.text || payload.message || "";
    const messageTimestamp = payload.timestamp
      ? new Date(payload.timestamp * 1000).toISOString()
      : new Date().toISOString();

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Ensure group exists (ignore if already exists)
    try {
      await supabase
        .from("whatsapp_groups")
        .insert({
          id: groupId,
          group_name: payload.groupName || `Group ${groupId.substring(0, 8)}`,
          active: true,
        });
    } catch (e) {
      // Group already exists, continue
    }

    // Insert message
    const { error: insertError } = await supabase
      .from("raw_messages")
      .insert({
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
    console.error("Error:", error.message || String(error));
    return new Response(JSON.stringify({ error: error.message || "Internal error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
