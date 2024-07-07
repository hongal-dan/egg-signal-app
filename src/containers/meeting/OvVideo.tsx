"use client";

import React, { useRef } from "react";
import { StreamManager } from "openvidu-browser";
import { useEffect, useState } from "react";
import { isChosenState } from "@/app/store/socket";
import { useRecoilState } from "recoil";
import "../../styles/App.css";

type Props = {
  streamManager: StreamManager;
  socket: any;
};

const OpenViduVideoComponent = (props: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const [isChosen, setIsChosen] = useRecoilState<boolean>(isChosenState);
  const socket = props.socket;
  // const selected = useRef<boolean>(false);

  useEffect(() => {
    if (props.streamManager && videoRef.current) {
      console.log("Adding video element to stream manager:", videoRef.current);
      props.streamManager.addVideoElement(videoRef.current);
    }
  }, [videoRef, props.streamManager]);

  const handleChoose = () => {
    if (isChosen) {
      alert("선택은 한 번만 할 수 있어요!");
      return;
    }
    const myName = document.querySelector(".pub")?.querySelector(".nickname");
    console.log(myName?.textContent);
    const currentNickname = containerRef.current
      ?.closest(".streamcomponent")
      ?.querySelector(".nickname");
    console.log(currentNickname?.textContent);

    socket.emit("choose", {
      sender: myName?.textContent,
      receiver: currentNickname?.textContent,
    });
    setIsChosen(true);

    containerRef.current!.classList.add("chosen-stream");
    videoRef.current!.classList.add("opacity");

    console.log(myName?.textContent, currentNickname?.textContent);
    setIsChosen(true);
  };

  return (
    <>
      <div className="cam-wrapper" ref={containerRef}>
        <video autoPlay={true} ref={videoRef}></video>
        <div
          className="choose-btn hidden"
          onClick={handleChoose}
          ref={btnRef}
        ></div>
      </div>
    </>
  );
};

export default OpenViduVideoComponent;
