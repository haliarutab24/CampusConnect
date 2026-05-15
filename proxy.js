import { NextResponse } from "next/server";

// Proxy replaces middleware in Next.js 16+
// We read the auth session cookie to determine if the user is logged in
// and their role, then redirect accordingly.
// The actual session validation happens server-side in the API routes.
export function proxy(request) {
  const { nextUrl } = request;
  const pathname = nextUrl.pathname;

  // Read the NextAuth session token cookie
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  const isLoggedIn = !!sessionToken;

  // Define route groups
  const isStudentRoute = pathname.startsWith("/student");
  const isRecruiterRoute = pathname.startsWith("/recruiter");
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/signup");

  // Redirect logged-in users away from auth pages
  if (isAuthRoute && isLoggedIn) {
    // We can't determine role from cookie alone easily, so redirect to home
    // The dashboard layout will handle showing the right content
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  // Protect student and recruiter routes - redirect to login if not authenticated
  if ((isStudentRoute || isRecruiterRoute) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/student/:path*",
    "/recruiter/:path*",
    "/login",
    "/signup",
  ],
};
