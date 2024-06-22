"use client";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main className="w-full h-screen flex justify-center items-center">
      <div>
        <p className="text-5xl font-bold text-center mb-5">Egg Chat</p>
        <button
          className="w-96 h-12 bg-amber-400 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center mb-1"
          onClick={() => router.push("/login")}
        >
          START
        </button>
      </div>
    </main>
  );
}
