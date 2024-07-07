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
  // console.log(rawData)

  return (
    <div>
      {props.streamManager !== undefined ? (
        <div
          className={`streamcomponent ${props.className}`}
          ref={streamComponentRef}
        >
          <div className="arrow-container hidden" id="arrow">
            <div className="arrow-body">
              <div className="arrow-head"></div>
            </div>
          </div>
          <OpenViduVideoComponent
            streamManager={props.streamManager}
          />
          <div>
            <p className="nickname">{nickname}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
