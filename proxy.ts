import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await supabase.auth.getClaims();
  const match = request.nextUrl.pathname.match(/^\/(candidate|employer|admin)(?:\/|$)/);
  if (match) {
    const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
    if (!userId) return NextResponse.redirect(new URL("/login", request.url));

    const { data: profile } = await supabase.from("profiles").select("role, status").eq("id", userId).maybeSingle();
    const requiredRole = match[1];
    const assuranceLevel = data?.claims?.aal;
    const authorized = profile?.status === "active" && profile.role === requiredRole && (requiredRole !== "admin" || assuranceLevel === "aal2");
    if (!authorized) return NextResponse.redirect(new URL("/login", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
