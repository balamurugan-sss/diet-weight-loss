import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/home", "/planner", "/recipes", "/cook", "/progress", "/profile", "/shopping", "/settings", "/subscription", "/targets", "/onboarding"];

// Optimistic check only (cookie presence). Every page and action re-verifies
// the session against the database in the data access layer.
export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const needsAuth = PROTECTED.some((p) => path === p || path.startsWith(p + "/"));
  if (needsAuth && !req.cookies.get("thali_session")?.value) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|webp|ico)$).*)"],
};
