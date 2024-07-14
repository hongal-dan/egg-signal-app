"use client";

import { useEffect, useState } from "react";
import MainContent from "@/containers/main/MainContent";
import Loading from "@/containers/main/Loading";

const Main = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  return !isMounted ? <Loading /> : <MainContent />;
};

export default Main;
