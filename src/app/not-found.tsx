"use client";

import React from "react";
import Image from "next/image";


const NotFound = () => {
  return (
    <div className="flex flex-col justify-center items-center">
      <Image src="/img/404.png" alt="404-not-found" width={500} height={500} />
      <h1 className="text-[3rem]">해당 페이지를 찾을 수 없습니다.</h1>
      <button
        className="border-2 p-2 border-black rounded-xl"
        onClick={() => history.back()}
      >
        이전 페이지로
      </button>
    </div>
  );
};

export default NotFound;
