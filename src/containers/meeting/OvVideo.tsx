"use client";

import React from "react";
import { StreamManager } from "openvidu-browser";
import { useEffect, useState } from "react";
import "../../styles/App.css";
import { isLastChooseState } from "@/app/store/socket";
import { useRecoilValue } from "recoil";

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
  const isLastChoose = useRecoilValue(isLastChooseState);

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
    const emitChoose = (eventName: string) => {
      socket.emit(eventName, {
        sender: myName?.textContent,
        receiver: currentNickname?.textContent,
      })
    }
    if (isChosen) {
      containerRef.current!.classList.remove("chosen-stream");
      videoRef.current!.classList.remove("opacity");
      setIsChosen(false);
      return;
    }
    containerRef.current!.classList.add("chosen-stream");
    videoRef.current!.classList.add("opacity");
    if(!isLastChoose){
      emitChoose("choose");
    }
    else {
      emitChoose("lastChoose");
    }
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

export default React.memo(OpenViduVideoComponent);
