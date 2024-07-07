"use client";
import React from "react";
// import UserVideoComponent from "@/containers/meeting/UserVideoComponent";
// import {
//   OpenVidu,
//   Session,
//   Publisher,
//   StreamManager,
//   Device,
// } from "openvidu-browser";

const Matcing = () => {
  //   const [session, setSession] = useState<Session | undefined>(undefined);
  //   const [publisher, setPublisher] = useState<Publisher | undefined>(undefined);
  //   const [subscriber, setSubscriber] = useState<StreamManager | undefined>(
  //     undefined,
  //   );
  //   const [mainStreamManager, setMainStreamManager] = useState<StreamManager>();
  //   const [, setCurrentVideoDevice] = useState<Device | null>(null);

  //   const joinSession = () => {
  //     const OV = new OpenVidu();
  //     OV.setAdvancedConfiguration({
  //       publisherSpeakingEventsOptions: {
  //         interval: 100, // Frequency of the polling of audio streams in ms (default 100)
  //         threshold: -50, // Threshold volume in dB (default -50)
  //       },
  //     });

  //     const newSession = OV.initSession();
  //     setSession(newSession);
  //     const { sessionId, token, participantName } = JSON.parse(
  //       sessionStorage.getItem("ovInfo")!,
  //     );
  //     // Connect to the session
  //     newSession
  //       .connect(token, {
  //         clientData: participantName,
  //       })
  //       .then(async () => {
  //         const publisher = await OV.initPublisherAsync(undefined, {
  //           audioSource: undefined,
  //           videoSource: undefined,
  //           publishAudio: true,
  //           publishVideo: true,
  //           resolution: "640x480",
  //           frameRate: 30,
  //           insertMode: "APPEND",
  //           mirror: false,
  //         });

  //         console.log("Publisher created:", publisher, sessionId);
  //         publisher.updatePublisherSpeakingEventsOptions({
  //           interval: 100, // 발화자 이벤트 감지 주기 (밀리초)
  //           threshold: -50, // 발화자 이벤트 발생 임계값 (데시벨)
  //         });
  //         newSession.publish(publisher);

  //         const devices = await OV.getDevices();
  //         const videoDevices = devices.filter(
  //           device => device.kind === "videoinput",
  //         );
  //         const currentVideoDeviceId = publisher.stream
  //           .getMediaStream()
  //           .getVideoTracks()[0]
  //           .getSettings().deviceId;
  //         const currentVideoDevice = videoDevices.find(
  //           device => device.deviceId === currentVideoDeviceId,
  //         );

  //         if (currentVideoDevice) {
  //           setCurrentVideoDevice(currentVideoDevice);
  //         }
  //         setMainStreamManager(publisher);
  //         setPublisher(publisher);
  //       })
  //       .catch(error => {
  //         console.log(
  //           "There was an error connecting to the session:",
  //           error.code,
  //           error.message,
  //         );
  //       });

  //     newSession.on("streamCreated", event => {
  //       const subscriber = newSession.subscribe(event.stream, undefined);
  //       setSubscriber(subscriber);
  //     });

  //     newSession.on("streamDestroyed", event => {
  //       setSubscriber(undefined);
  //     });

  //     newSession.on("exception", exception => {
  //       console.warn(exception);
  //     });
  //   };

  return (
    <div className="p-5 grid grid-rows-[80%,20%] h-screen">
      <div className="flex justify-center gap-5">
        <div className="w-1/2 border rounded-3xl">d</div>
        <div className="w-1/2 border rounded-3xl">d</div>
      </div>
      <div className="flex justify-center py-10">
        <button className="bg-red-500 text-white rounded-xl font-bold py-2 px-5 text-3xl">
          통화 종료
        </button>
      </div>
    </div>
  );
};

export default Matcing;
