import type { APIRoute } from "astro";
import { createAuth } from "@/lib/auth";

export const prerender = false;

export const ALL: APIRoute = async ({ request }) => {
  try {
    const auth = createAuth();
    return await auth.handler(request);
  } catch (error: any) {
    console.error("[Auth Error]", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
