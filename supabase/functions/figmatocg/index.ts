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
    const { id, pageIndex, jsonData, page, jsonDataV2 } = JSON.parse(
      await req.text(),
    );

    console.log("Parsed data:", { id, pageIndex, jsonData, page, jsonDataV2 });

    const aiResult = await sendFigmaJsonToApi(jsonDataV2);

    console.log("AI Result:", aiResult);

    // Check if aiResult contains the result array
    if (aiResult && aiResult.result && Array.isArray(aiResult.result)) {
      // Prepare the insert payload
      const componentsPayload = aiResult.result.map((component: any) => ({
        name: component.name,
        type: component.type,
        dx: component.dx,
        dy: component.dy,
        width: component.width,
        height: component.height,
        version: component.version,
        options: component.options,
        page_id: page.id,
        created_at: new Date(),
        updated_at: new Date(),
        group_id: component.group_id,
        is_lib_comp: component.is_lib_comp,
        index_in_page: component.index_in_page,
      }));

      // Insert components into the Supabase table
      const { data, error: insertError } = await supabase
        .from("components")
        .insert(componentsPayload);

      if (insertError) {
        console.error("Insert error:", insertError);
        return new Response(
          JSON.stringify({ error: "Error inserting components" }),
          {
            status: 500,
            headers: corsHeaders,
          },
        );
      }

      // const insertPayload = {
      //   "edge_func_res": aiResult,
      // };

      // const { data: data, error: insertError } = await supabase
      //   .from("fig2cg_ai_res")
      //   .insert(insertPayload);

      if (insertError) {
        console.error("Insert error:", insertError);
        return new Response(JSON.stringify({ error: "Error inserting data" }), {
          status: 500,
          headers: corsHeaders,
        });
      }

      const responseMessage = {
        message: `Added jsonData to pages for project with id ${id}`,
      };

      return new Response(JSON.stringify(responseMessage), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  return new Response(JSON.stringify({ error: "Invalid request" }), {
    status: 400,
    headers: corsHeaders,
  });
});

//  TODO: Get the jsonData, map it to ComponentV2 and add it to the components table in supabase

// for (let i = 0; i < jsonData.length; i++) {
//   const item = jsonData[i];
//   console.log("Inserting item:", item);

//   // Ensure width and height are fetched from the correct place
//   const width = item.options.width ? parseInt(item.options.width) : null;
//   const height = item.options.height ? parseInt(item.options.height) : null;
//   console.log(item);
//   // ADD if the dx is more than page width then set it to 0
//   const { data: componentData, error } = await supabase.from("components")
//     .insert([
//       {
//         name: item.name,
//         type: item.type,
//         dx: item.dx,
//         dy: item.dy,
//         width: width,
//         height: height,
//         options: item.options,
//         page_id: page["id"],
//         version: "1.0",
//         is_lib_comp: false,
//         index_in_page: i,
//       },
//     ]);

//   if (error) {
//     console.log(error);
//     return new Response(
//       JSON.stringify({ error: "Error fetching component data" }),
//       { status: 500 },
//     );
//   }

//   console.log("componentData", componentData);

//   if (componentData) {
//     console.log("Component added to components table");
//   } else {
//     console.error("Error adding component to components table");
//   }
// }

// const { data: projectData, error } = await supabase.from("pages").select("*")
//   .eq(
//     "id",
//     id,
//   ).single();

// console.log("SUPABSE URL::: ", Deno.env.get("SUPABASE_URL"));

// console.log("projectData", projectData);

// if (error) {
//   console.log(error);
//   return new Response(
//     JSON.stringify({ error: "Error fetching project data" }),
//     { status: 500 },
//   );
// }

// const pages = projectData.pages || [];

// if (pages.length > 0 && pages[0].cgCustomComponents) {
//   jsonData.forEach((item: any) => {
//     const newItem = {
//       id: null,
//       name: null,
//       description: null,
//       width: null,
//       height: null,
//       dx: null,
//       dy: null,
//       previewImageUrl: null,
//       createdAt: null,
//       updatedAt: null,
//       childWidgets: [item],
//       isPublic: false,
//     };

//     pages[pageIndex].cgCustomComponents.push(newItem);
//   });
// } else {
//   console.error(
//     "pages array is empty or does not have cgCustomComponents",
//   );
// }

// const { data: updatedData } = await supabase.from("projects")
//   .update({ pages }).eq("id", id);

// if (error) {
//   console.log(error);
//   return new Response(
//     JSON.stringify({ error: "Error updating project data" }),
//     { status: 500 },
//   );
// }

// const response = {
//   message: `Added jsonData to pages for project with id ${id}`,
//   updatedData,
// };

// return new Response(JSON.stringify(response), {
//   headers: {
//     ...corsHeaders,
//     "Content-Type": "application/json",
//   },
// });

// Existing code where you postMessage to the Figma UI

// Function to send JSON data to your API via POST
async function sendFigmaJsonToApi(jsonDt: []) {
  const url = "http://121.167.147.128:40121/figma-to-creatego"; // API endpoint

  const payload = {
    user_id: "super_dev",
    session_id: "test_session_10389874582",
    request_id: "req_8472657564785628765",
    figma_json: jsonDt,
    generation_params: {
      temperature: 0,
      top_p: 0.99,
      max_tokens: 2048,
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("API Response:", result);
    return result;
  } catch (error) {
    console.error("Error sending Figma JSON to API:", error);
  }
}
