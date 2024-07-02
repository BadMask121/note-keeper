
import { NextResponse, type NextRequest } from "next/server";
import { ProtectedRoutes } from "./lib/routes";
import * as ls from "local-storage";
import { User } from "./lib/types";
import { getUser } from "./lib/storage";

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const path: string = request.nextUrl.pathname;
  const paths = path.split("/");
  const [, routePath] = paths;
  const session = getUser()

  const isProtectedRoute = Object.values(ProtectedRoutes).includes(
    `/${routePath}` as ProtectedRoutes,
  );

  if (isProtectedRoute) {
    requestHeaders.set("x-pathname", path);
  }

  if (!session && isProtectedRoute) {
    // return NextResponse.redirect(new URL("/", request.url));
  }

  const req = {
    request: {
      headers: requestHeaders,
    },
  };

  return NextResponse.next(req);
}

export const config = {
  matcher: ["/note", "/note/:path+"],
};
