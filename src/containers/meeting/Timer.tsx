"use client";
import React, { useState, useEffect, useRef } from "react";

type Props = {
  startCount: number;
  onComplete: void;
};

const Timer = ({ startCount, onComplete }: Props) => {
  const [countdown, setCountdown] = useState(startCount);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCountdown((prevCountdown: number) => {
        if (prevCountdown > 1) {
          return prevCountdown - 1;
        } else {
          clearInterval(intervalRef.current);
          onComplete();
          return 0;
        }
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [onComplete]);

  return <div>{countdown}초 뒤 세션이 종료됩니다.</div>;
};

export default Timer;
