"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";

type Props = {
  setTime: number;
};

const EggTimer: React.FC<Props> = ({ setTime }) => {
  const [, setMin] = useState(setTime); // todo: 시작 시간 서버로부터 받기
  const [sec, setSec] = useState(0);
  const time = useRef(300);
  const timerId = useRef<null | NodeJS.Timeout>(null);
  const totalTime = 300;
  const [progressWidth, setProgressWidth] = useState("0%");

  useEffect(() => {
    timerId.current = setInterval(() => {
      setMin(Math.floor(time.current / 60));
      setSec(time.current % 60);
      time.current -= 1;
    }, 1000);

    return () => {
      clearInterval(timerId.current!);
    };
  }, []);

  useEffect(() => {
    if (time.current <= 0) {
      console.log("time out");
      clearInterval(timerId.current!);
    }
    setProgressWidth(`${((totalTime - time.current) / totalTime) * 100}%`);
  }, [sec]);

  return (
    <div className="flex items-center w-full px-[10vw]">
      <Image src="/img/egg1.png" alt="" width={50} height={50} />
      <p
        className="bg-orange-300 h-[20px] rounded-lg"
        style={{
          width: progressWidth,
        }}
      ></p>
      <Image src="/img/egg2.png" alt="" width={50} height={50} />
    </div>
  );
};

export default EggTimer;
