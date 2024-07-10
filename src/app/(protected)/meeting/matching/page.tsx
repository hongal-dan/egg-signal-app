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
import Swal from "sweetalert2";

const Matching = () => {
  const [session, setSession] = useState<Session | undefined>(undefined);
  const [publisher, setPublisher] = useState<Publisher | undefined>(undefined);
  const [subscriber, setSubscriber] = useState<StreamManager | undefined>(
    undefined,
  );
  const [, setMainStreamManager] = useState<StreamManager>();
  const [, setCurrentVideoDevice] = useState<Device | null>(null);
  const ovInfo = useRecoilValue(winnerSessionState);
  const userInfo = useRecoilValue(userState);
  const testName = useRecoilValue(testState);
  const router = useRouter();
  const [speakingPublisherIds, setSpeakingPublisherIds] = useState<string[]>(
    [],
  );

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
    }).then((result) => {
      if (result.isConfirmed) {
        leaveSession();
      }
    });
   };

  const joinSession = () => {
    const OV = new OpenVidu();
    console.log("새 세션 조인중", userInfo);
    OV.setAdvancedConfiguration({
      publisherSpeakingEventsOptions: {
        interval: 100, // Frequency of the polling of audio streams in ms (default 100)
        threshold: -50, // Threshold volume in dB (default -50)
      },
    });

    const newSession = OV.initSession();
    setSession(newSession);
    // Connect to the session
    newSession
      .connect(ovInfo.token, {
        // clientData: userInfo.nickname, // FIXME 이놈으로 바꿔야합니다. .. 테스트네임말고
        clientData: testName,
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

        console.log("Publisher created:", publisher, ovInfo.sessionId);
        publisher.updatePublisherSpeakingEventsOptions({
          interval: 100, // 발화자 이벤트 감지 주기 (밀리초)
          threshold: -50, // 발화자 이벤트 발생 임계값 (데시벨)
        });
        newSession.publish(publisher);

        const devices = await OV.getDevices();
        const videoDevices = devices.filter(
          device => device.kind === "videoinput",
        );
        const currentVideoDeviceId = publisher.stream
          .getMediaStream()
          .getVideoTracks()[0]
          .getSettings().deviceId;
        const currentVideoDevice = videoDevices.find(
          device => device.deviceId === currentVideoDeviceId,
        );

        if (currentVideoDevice) {
          setCurrentVideoDevice(currentVideoDevice);
        }
        setMainStreamManager(publisher);
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

    // 세션에서 발화자 이벤트 리스너 추가
    newSession.on("publisherStartSpeaking", (event: PublisherSpeakingEvent) => {
      // console.log("Publisher started speaking:", event.connection);
      const streamId = event.connection.stream?.streamId;
      if (streamId !== undefined) {
        setSpeakingPublisherIds(prevIds => [...prevIds, streamId]);
      } else {
        console.log("streamId undefined");
      }
    });

    newSession.on("publisherStopSpeaking", (event: PublisherSpeakingEvent) => {
      const streamId = event.connection.stream?.streamId;
      if (streamId !== undefined) {
        setSpeakingPublisherIds(prevIds =>
          prevIds.filter(id => id !== streamId),
        );
      }
      // console.log("Publisher stopped speaking:", event.connection);
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
          <div className={`stream-container col-md-6 col-xs-6`}>
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
          <div className={`stream-container col-md-6 col-xs-6`}>
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
