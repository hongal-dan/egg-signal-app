"use client";

import React from "react";
import Image from "next/image";
// import { useRouter } from "next/navigation";

// type Props = {}

const ServerError = () => {
  // const router = useRouter();
  return (
    <div className="flex flex-col justify-center items-center w-[100vw] h-[100vh]">
      <h1 className="text-[3rem] relative top-5">서버 연결 실패</h1>
      <Image
        src="/img/500.png"
        alt="500-server-error"
        width={500}
        height={500}
      />
      <button
        className="border-2 p-2 border-black rounded-xl"
        onClick={() => window.location.reload()}
      >
        메인 페이지로
      </button>
    </div>
  );
};

export default ServerError;
