import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const groupId = url.searchParams.get("groupId");
    const status = url.searchParams.get("status") || "all";
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    if (!groupId) {
      return new Response(JSON.stringify({ error: "Missing groupId" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let query = supabase
      .from("summarized_topics")
      .select("*")
      .eq("group_id", groupId);

    if (status !== "all") {
      query = query.eq("status", status);
    }

    if (startDate) {
      query = query.gte("date_discussed", startDate);
    }

    if (endDate) {
      query = query.lte("date_discussed", endDate);
    }

    const { data, error } = await query.order("date_discussed", {
      ascending: false,
    });

    if (error) throw error;

    return new Response(JSON.stringify({ topics: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching topics:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch topics" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
