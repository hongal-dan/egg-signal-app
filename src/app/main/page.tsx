"use client";

// import { cookies } from "next/headers";
import MainContent from "@/containers/main/MainContent";
// import { getUserInfo } from "@/services/users";
import ServerError from "@/containers/error/ServerError";
import { useEffect, useState } from "react";
import axios from "axios";
import { redirect } from "next/navigation";

const Main = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [isError, setIsError] = useState(true);

  const checkServerHealth = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_SERVER}`);
      if (response.status === 200) {
        setIsError(false);
      }
    } catch (error) {
      console.error("서버 연결 실패: ", error);
      setIsError(true);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    checkServerHealth();
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("권한 없음!");
      redirect("/login");
    }
    return () => {
      setIsMounted(false);
      setIsError(false);
    };
  }, []);

  return isMounted ? (
    <div>{isError ? <ServerError /> : <MainContent />}</div>
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
