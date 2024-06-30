import { NextResponse } from "next/server";

export async function GET() {
  const nextResponse = NextResponse.json({
    message: "Logged out successfully",
  });

  // Set the token cookie to expire immediately
  nextResponse.headers.set(
    "Set-Cookie",
    "access_token=; HttpOnly; Path=/; Max-Age=0;",
  );

  return nextResponse;
}
