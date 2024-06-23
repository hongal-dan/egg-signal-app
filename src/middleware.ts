import { NextResponse, NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { cookies } = request;
  const accessTokenExists = cookies.has("access_token");
  const pathUrl = request.nextUrl.pathname;

  // 로그인 된 사용자가 로그인/회원가입 페이지 요청 시 /main 페이지로 강제 리다이렉트
  if (accessTokenExists) {
    if (pathUrl.startsWith("/login") || pathUrl.startsWith("/signup")) {
      return NextResponse.redirect(new URL("/main", request.url));
    }
  }

  // 모든 사용자 접근 허용
  if (
    pathUrl.startsWith("/login") ||
    pathUrl.startsWith("/") ||
    pathUrl.startsWith("/signup")
  ) {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    {
      source: "/((?!services|_next/static|_next/image|favicon.ico).*)",
    },
  ],
};
