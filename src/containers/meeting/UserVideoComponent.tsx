"use client";
import React, { useRef } from "react";
import OpenViduVideoComponent from "./OvVideo";
import { StreamManager } from "openvidu-browser";

export default function UserVideoComponent(props: {
  streamManager: StreamManager;
  className: string;
}) {
  const streamComponentRef = useRef<HTMLDivElement>(null);
  const rawData = props.streamManager.stream.connection.data;

  // 데이터를 구분자로 분리
  const [jsonString] = rawData.split("%/%");

  // JSON 문자열을 파싱
  let nickname = "";
  nickname = JSON.parse(jsonString).clientData;

  // /!--emoji container 추가함--/
  return (
    <div className="stream-wrapper relative w-full h-full">
      {props.streamManager !== undefined ? (
        <div
          className={`relative streamcomponent ${props.className}`}
          ref={streamComponentRef}
        >
          <div className="emoji-container overflow-hidden absolute w-full h-full pointer-events-none flex items-center justify-center">
            {" "}
          </div>
          <div className="arrow-container hidden" id="arrow">
            <div className="arrow-body">
              <div className="arrow-head"></div>
            </div>
          </div>
          <OpenViduVideoComponent streamManager={props.streamManager} />
          <div>
            <p className="nickname">{nickname}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
