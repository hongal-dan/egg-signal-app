import React from "react";
import { StreamManager } from "openvidu-browser";
import { useEffect } from "react";
import "../../styles/App.css";

type Props = {
  streamManager: StreamManager;
};

const OpenViduVideoComponent = (props: Props) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const btnRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (props.streamManager && videoRef.current) {
      console.log("Adding video element to stream manager:", videoRef.current);
      props.streamManager.addVideoElement(videoRef.current);
    }
  }, [videoRef, props.streamManager]);

  return (
    <>
      <div className="cam-wrapper" ref={containerRef}>
        <video autoPlay={true} ref={videoRef}></video>
        <div
          className="choose-btn hidden"
          onClick={() => {}}
          ref={btnRef}
        ></div>
      </div>
    </>
  );
};

export default OpenViduVideoComponent;
