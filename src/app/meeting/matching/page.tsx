"use client";

import React, { useEffect, useState } from "react";
import UserVideoComponent from "@/containers/meeting/UserVideoComponent";
import {
  OpenVidu,
  Session,
  Publisher,
  StreamManager,
  Device,
  PublisherSpeakingEvent,
} from "openvidu-browser";
import { useRecoilValue } from "recoil";
import { winnerSessionState } from "@/app/store/ovInfo";
import { testState, userState } from "@/app/store/userInfo";
import { useRouter } from "next/navigation";

const Matching = () => {
  const leaveSession = () => {
    if (session) {
      session.disconnect();
    }
    setSession(undefined);
    setSubscriber(undefined);
    setPublisher(undefined);
    router.push("/main");
  };

  return (
    <div className="flex flex-col h-[100vh] justify-center items-center gap-20">
      <div className="col-md-6 flex w-[60vw] gap-20">
        {publisher !== undefined ? (
          <div
            className={`stream-container col-md-6 col-xs-6`}
          >
            <UserVideoComponent
              streamManager={publisher}
              className={
                speakingPublisherIds.includes(publisher.stream.streamId)
                  ? "speaking"
                  : ""
              }
            />
          </div>
        ) : null}
        {subscriber !== undefined ? (
          <div
            className={`stream-container col-md-6 col-xs-6`}
          >
            <UserVideoComponent
              streamManager={subscriber!}
              className={
                speakingPublisherIds.includes(subscriber!.stream.streamId)
                  ? "speaking"
                  : ""
              }
            />
          </div>
        ) : null}
      </div>
      <div className="flex justify-center py-10">
        <button
          onClick={leaveSession}
          className="bg-red-500 text-white rounded-xl font-bold py-2 px-5 text-3xl"
        >
          통화 종료
        </button>
      </div>
    </div>
  );
};

export default Matching;
