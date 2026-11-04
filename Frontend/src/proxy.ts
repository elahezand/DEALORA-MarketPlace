import { NextRequest, NextResponse } from "next/server";

/*
   ROUTE PROTECTION (server side)
   runs before the page renders, so a signed-out visitor never downloads the dashboard.
   it only checks that an auth cookie exists — the API still verifies the token and the
   client AuthGuard still checks the role (USER / SELLER / ADMIN).
   an expired access token with a valid refresh token passes through, the axios
   interceptor refreshes it on the first request.
*/

// same names getAuthServerData reads + the refresh cookie set by the API
const AUTH_COOKIES = ["token", "accessToken", "refreshToken", "refresh_token"];

export const hasAuthCookie = (request: NextRequest) =>
  AUTH_COOKIES.some((name) => !!request.cookies.get(name)?.value);

export default function proxy(request: NextRequest) {
  if (hasAuthCookie(request)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/", request.url);
  loginUrl.searchParams.set("auth", "required");
  loginUrl.searchParams.set("from", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
