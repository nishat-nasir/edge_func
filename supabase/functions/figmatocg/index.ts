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

// Deno.serve(async (req) => {
//   const { data: res, error } = await supabase.from("projects").select("name")
//     .limit(1).single();

//   if (error) console.log(error);
//   const data = {
//     message: `Hello ${res?.name}!`,
//   };
//   console.log(data);

//   return new Response(
//     JSON.stringify(data),
//     { headers: { "Content-Type": "application/json" } },
//   );
// });

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
  routes.push(JSON.parse(jsonData));

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
    headers: { "Content-Type": "application/json" },
  });
});
