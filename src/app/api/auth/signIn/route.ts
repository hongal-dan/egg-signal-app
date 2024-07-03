import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import axios from "axios";

const NESTJS_SERVER_URL =
  process.env.NEXT_PUBLIC_API_SERVER || "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const response = await axios.post(
      `${NESTJS_SERVER_URL}/auth/signIn`,
      body,
      {
        withCredentials: true,
      },
    );

    const cookies = response.headers["set-cookie"];
    const nextResponse = NextResponse.json(response.data, {
      status: response.status,
    });

    if (cookies) {
      cookies.forEach(cookie => {
        nextResponse.headers.append("Set-Cookie", cookie);
      });
    }

    return nextResponse;
  } catch (error: any) {
    console.error("Error fetching data: ", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: error.response?.status || 500 },
    );
  }
}
