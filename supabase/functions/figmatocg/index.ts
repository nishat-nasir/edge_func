import { createClient } from "npm:@supabase/supabase-js@2.39.3";

console.log("Hello from Functions!");
// "https://ofyngtjccmbxofnztary.supabase.co",
// "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9meW5ndGpjY21ieG9mbnp0YXJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDI0MzcyMzYsImV4cCI6MjAxODAxMzIzNn0.c3oJ3CENN5hWSpvcB5ev7BJBC2SsqhPB4OTFU39RqYM",

// "http://127.0.0.1:54321",
// "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Allows all origins; change to specific domain in production
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { id, pageIndex, jsonData, page } = JSON.parse(await req.text());

  console.log(id);
  console.log(jsonData);
  console.log(pageIndex);
  console.log(page["id"]);

  //  TODO: Get the jsonData, map it to ComponentV2 and add it to the components table in supabase

  for (let i = 0; i < jsonData.length; i++) {
    const item = jsonData[i];
    console.log("Inserting item:", item);

    // Ensure width and height are fetched from the correct place
    const width = item.options.width ? parseInt(item.options.width) : null;
    const height = item.options.height ? parseInt(item.options.height) : null;
    console.log(item);
    // ADD if the dx is more than page width then set it to 0
    const { data: componentData, error } = await supabase.from("components")
      .insert([
        {
          name: item.name,
          type: item.type,
          dx: item.dx,
          dy: item.dy,
          width: width,
          height: height,
          options: item.options,
          page_id: page["id"],
          version: "1.0",
          is_lib_comp: false,
          index_in_page: i,
        },
      ]);

    if (error) {
      console.log(error);
      return new Response(
        JSON.stringify({ error: "Error fetching component data" }),
        { status: 500 },
      );
    }

    console.log("componentData", componentData);

    if (componentData) {
      console.log("Component added to components table");
    } else {
      console.error("Error adding component to components table");
    }
  }

  const { data: projectData, error } = await supabase.from("pages").select("*")
    .eq(
      "id",
      id,
    ).single();

  console.log("SUPABSE URL::: ", Deno.env.get("SUPABASE_URL"));

  console.log("projectData", projectData);

  if (error) {
    console.log(error);
    return new Response(
      JSON.stringify({ error: "Error fetching project data" }),
      { status: 500 },
    );
  }

  const pages = projectData.pages || [];

  if (pages.length > 0 && pages[0].cgCustomComponents) {
    jsonData.forEach((item: any) => {
      const newItem = {
        id: null,
        name: null,
        description: null,
        width: null,
        height: null,
        dx: null,
        dy: null,
        previewImageUrl: null,
        createdAt: null,
        updatedAt: null,
        childWidgets: [item],
        isPublic: false,
      };

      pages[pageIndex].cgCustomComponents.push(newItem);
    });
  } else {
    console.error(
      "pages array is empty or does not have cgCustomComponents",
    );
  }

  const { data: updatedData } = await supabase.from("projects")
    .update({ pages }).eq("id", id);

  if (error) {
    console.log(error);
    return new Response(
      JSON.stringify({ error: "Error updating project data" }),
      { status: 500 },
    );
  }

  const response = {
    message: `Added jsonData to pages for project with id ${id}`,
    updatedData,
  };

  console.log(response);

  return new Response(JSON.stringify(response), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
});
