"use client";

import React from "react";
import { StreamManager } from "openvidu-browser";
import { useEffect, useState } from "react";
import "../../styles/App.css";

type Props = {
  streamManager: StreamManager;
  socket: any;
};

const OpenViduVideoComponent = (props: Props) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const btnRef = React.useRef<HTMLDivElement>(null);
  const [isChosen, setIsChosen] = useState<boolean>(false);
  const socket = props.socket;

  useEffect(() => {
    if (props.streamManager && videoRef.current) {
      console.log("Adding video element to stream manager:", videoRef.current);
      props.streamManager.addVideoElement(videoRef.current);
    }
  }, [videoRef, props.streamManager]);

  const handleChoose = () => {
    const myName = document.querySelector(".pub")?.querySelector(".nickname");
    console.log(myName?.textContent);
    const currentNickname = containerRef.current
      ?.closest(".streamcomponent")
      ?.querySelector(".nickname");
    console.log(currentNickname?.textContent);
    // const currStreamContainer = containerRef.current?.closest(".stream-container");
    if (isChosen) {
      containerRef.current!.classList.remove("chosen-stream");
      videoRef.current!.classList.remove("opacity");
      setIsChosen(false);
      return;
    }
    containerRef.current!.classList.add("chosen-stream");
    videoRef.current!.classList.add("opacity");
    socket.emit("choose", {
      sender: myName?.textContent,
      receiver: currentNickname?.textContent,
    });
    console.log(myName?.textContent, currentNickname?.textContent);
    setIsChosen(true);
  };

  const emitChoose = (eventName: string) => {
    socket.emit(eventName, {
      sender: myName?.textContent,
      receiver: currentNickname?.textContent,
    })
  }

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
