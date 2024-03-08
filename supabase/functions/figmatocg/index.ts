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
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: any) => {
  const { id, jsonData } = JSON.parse(await req.text());

  const { data: projectData, error } = await supabase.from("projects").select(
    "routes",
  ).eq("id", id).single();

  if (error) {
    console.log(error);
    return new Response(
      JSON.stringify({ error: "Error fetching project data" }),
      { status: 500 },
    );
  }

  const routes = projectData.routes || [];

  if (routes.length > 0 && routes[0].cgCustomComponents) {
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
      routes[0].cgCustomComponents.push(newItem);
    });
  } else {
    console.error("Routes array is empty or does not have cgCustomComponents");
  }

  const { data: updatedData } = await supabase.from("projects")
    .update({ routes }).eq("id", id);

  if (error) {
    console.log(error);
    return new Response(
      JSON.stringify({ error: "Error updating project data" }),
      { status: 500 },
    );
  }

  const response = {
    message: `Added jsonData to routes for project with id ${id}`,
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
