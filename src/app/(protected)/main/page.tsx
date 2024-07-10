"use client";

import MainContent from "@/containers/main/MainContent";
import { useEffect, useState } from "react";

const Main = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  return isMounted ? (
    <MainContent />
  ) : (
    <div className="w-[100vw] h-[100vh] flex flex-col justify-center items-center gap-24">
      <div className="flex flex-col items-center gap-4 text-3xl">
        <p>로딩 중입니다.</p>
        <p>잠시만 기다려주세요</p>
      </div>
      <span className="pan"></span>
    </div>
  );
};

export default Main;
