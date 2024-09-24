import { createClient } from "npm:@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";
console.log("Hello from Functions!");

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  // Handle CORS preflight (OPTIONS) request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { id, pageIndex, jsonData, page, jsonDataV2 } = await req.json();

    console.log("Parsed data:", { id, pageIndex, jsonData, page, jsonDataV2 });

    const aiResult = await sendFigmaJsonToApi(jsonDataV2);

    console.log("AI Result:", aiResult);

    await updateComponents(aiResult, page, jsonDataV2, id);

    return new Response(JSON.stringify({ result: aiResult }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Invalid request" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

async function sendFigmaJsonToApi(jsonDt: any) {
  const url = "http://121.167.147.128:40121/figma-to-creatego";

  const payload = {
    user_id: "super_dev",
    session_id: "test_session_10389874582",
    request_id: "req_8472657564785628765",
    figma_json: Array.isArray(jsonDt) ? jsonDt : JSON.parse(jsonDt),
    generation_params: {
      temperature: 0,
      top_p: 0.99,
      max_tokens: 2048,
    },
  };

  console.log("Payload to send:", JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorResponse = await response.json();
      console.error(`Error: ${errorResponse.error}`);
      throw new Error(
        `HTTP error! Status: ${response.status}, Message: ${errorResponse.error}`,
      );
    }

    const result = await response.json();
    console.log("API Response:", result);

    await supabase
      .from("fig2cg_ai_res")
      .insert({
        "json": result,
      });

    return result;
  } catch (error) {
    console.error("Error sending Figma JSON to API:", error);
    throw error;
  }
}

async function updateComponents(
  aiResult: any,
  page: any,
  jsonDataV2: any,
  id: any,
) {
  try {
    // Check if aiResult contains the result array
    if (aiResult && aiResult.result) {
      if (Array.isArray(aiResult.result.components)) {
        const componentsPayload = aiResult.result.components.map(
          (component: any) => {
            return {
              name: component.name,
              type: component.type,
              dx: component.dx,
              dy: component.dy,
              width: component.width,
              height: component.height,
              version: component.version,
              options: component.options,
              page_id: page.id,
              group_id: component.group_id,
              is_lib_comp: component.is_lib_comp,
              index_in_page: component.index_in_page,
            };
          },
        );

        // Insert components into the Supabase table
        const { data, error: insertError } = await supabase
          .from("components")
          .insert(componentsPayload);
      } else {
        const componentsPayload = {
          name: aiResult.result.name,
          type: aiResult.result.type,
          dx: aiResult.result.dx,
          dy: aiResult.result.dy,
          width: aiResult.result.width,
          height: aiResult.result.height,
          version: aiResult.result.version,
          options: aiResult.result.options,
          page_id: page.id,
          group_id: aiResult.result.group_id,
          is_lib_comp: aiResult.result.is_lib_comp,
          index_in_page: aiResult.result.index_in_page,
        };

        // Insert components into the Supabase table
        const { data, error: insertError } = await supabase
          .from("components")
          .insert(componentsPayload);
      }

      const { data: data1, error: insertError1 } = await supabase
        .from("fig2cg_ai_res")
        .insert({
          "json": jsonDataV2.toString(),
          "ai_res": aiResult,
        });

      return {
        message: `Added jsonData to pages for project with id ${id}`,
      };
    } else {
      throw new Error("Invalid AI result structure");
    }
  } catch (error) {
    console.error("Error in updateComponents:", error);
    throw error; // Re-throw the error to be caught by the calling function
  }
}

const cleanOptions = (options: any) => {
  return Object.fromEntries(
    Object.entries(options).filter(([, value]) =>
      value != null && value !== "null"
    ),
  );
};
