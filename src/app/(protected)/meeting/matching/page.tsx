"use client";

import React, { useEffect, useState } from "react";
import UserVideoComponent from "@/containers/meeting/UserVideoComponent";
import {
  OpenVidu,
  Session,
  Publisher,
  StreamManager,
} from "openvidu-browser";
import { useRecoilValue } from "recoil";
import { winnerSessionState } from "@/app/store/ovInfo";
import { userState } from "@/app/store/userInfo";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import MikeMuteButton from "@/containers/meeting/MikeMuteButton";

const Matching = () => {
  const [session, setSession] = useState<Session | undefined>(undefined);
  const [publisher, setPublisher] = useState<Publisher | undefined>(undefined);
  const [subscriber, setSubscriber] = useState<StreamManager | undefined>(
    undefined,
  );
  const ovInfo = useRecoilValue(winnerSessionState);
  const userInfo = useRecoilValue(userState);
  const router = useRouter();

  const leaveSession = () => {
    if (session) {
      session.disconnect();
    }
    setSession(undefined);
    setSubscriber(undefined);
    setPublisher(undefined);
    router.push("/main");
  };

  const leaveHandler = () => {
    Swal.fire({
      title: "정말 통화를 종료하시겠습니까?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "종료할게요",
      cancelButtonText: "취소",
    }).then(result => {
      if (result.isConfirmed) {
        leaveSession();
      }
    });
  };

  const joinSession = () => {
    const OV = new OpenVidu();

    const newSession = OV.initSession();
    setSession(newSession);
    // Connect to the session
    newSession
      .connect(ovInfo.token, {
        clientData: userInfo.nickname, 
      })
      .then(async () => {
        const publisher = await OV.initPublisherAsync(undefined, {
          audioSource: undefined,
          videoSource: undefined,
          publishAudio: true,
          publishVideo: true,
          resolution: "640x480",
          frameRate: 30,
          insertMode: "APPEND",
          mirror: false,
        });

        newSession.publish(publisher);
        setPublisher(publisher);
      })
      .catch(error => {
        console.log(
          "There was an error connecting to the session:",
          error.code,
          error.message,
        );
      });

    newSession.on("streamCreated", event => {
      const subscriber = newSession.subscribe(event.stream, undefined);
      setSubscriber(subscriber);
    });

    newSession.on("streamDestroyed", () => {
      setSubscriber(undefined);
    });

    newSession.on("exception", exception => {
      console.warn(exception);
    });
  };

  useEffect(() => {
    console.log("메인이 실행되었습니다.");
    const handleBeforeUnload = () => leaveSession();
    window.addEventListener("beforeunload", handleBeforeUnload);
    joinSession();
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      console.log("메인이 종료되었습니다.");
    };
  }, []);

  return (
    <div className="flex flex-col h-[100vh] justify-center items-center gap-20">
      <div className="col-md-6 flex w-[60vw] gap-20">
        {publisher !== undefined ? (
          <div className="stream-container col-md-6 col-xs-6">
            <UserVideoComponent
              streamManager={publisher}
            />
          </div>
        ) : null}
        {subscriber !== undefined ? (
          <div className="stream-container col-md-6 col-xs-6">
            <UserVideoComponent
              streamManager={subscriber!}
            />
          </div>
        ) : null}
      </div>
      <div className="flex justify-center py-10 relative">
        <div className="relative bottom-16">
        <MikeMuteButton publisher={publisher} />
        </div>
        <button
          onClick={leaveHandler}
          className="bg-red-500 text-white rounded-xl font-bold py-2 px-5 text-3xl"
        >
          통화 종료
        </button>
      </div>
    </div>
  );
};

export default Matching;
