"use client";
import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import UserVideoComponent from "@/containers/meeting/UserVideoComponent";
import UserVideoComponent2 from "../../../containers/main/UserVideo";
import {
  OpenVidu,
  Session,
  Publisher,
  StreamManager,
  Device,
  Subscriber,
} from "openvidu-browser";

// import io from "socket.io-client";

type Props = {
  sessionId: string;
  token: string;
  participantName: string;
};

const Meeting = (props: Props) => {
  const [myUserName, setMyUserName] = useState<string>(
    "Participant" + Math.floor(Math.random() * 100),
  );
  const [session, setSession] = useState<Session | undefined>(undefined);
  const [mainStreamManager, setMainStreamManager] = useState<any>(undefined);
  const [publisher, setPublisher] = useState<Publisher | undefined>(undefined);
  const [subscribers, setSubscribers] = useState<StreamManager[]>([]);
  const [currentVideoDevice, setCurrentVideoDevice] = useState<Device | null>(
    null,
  );
  const [isAvatar, setIsAvatar] = useState<boolean>(true);
  const [isLoveMode, setIsLoveMode] = useState<boolean>(false);
  const [isMatched, setIsMatched] = useState<boolean>(true);
  const [isChooseMode, setIsChooseMode] = useState<boolean>(false);
  const [isOneToOneMode, setIsOneToOneMode] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // const socket = io("http://localhost:5002/meeting", {
  //   transports: ["websocket"],
  // });

  // const socket = JSON.parse(sessionStorage.getItem('session')!)

  // 어떻게든 종료 하면 세션에서 나가게함.
  useEffect(() => {
    console.log("메인이 실행되었습니다.");
    const handleBeforeUnload = () => leaveSession();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      console.log("메인이 종료되었습니다.");
    };
  });

  // 메인 비디오 스트림을 변경
  // const handleMainVideoStream = (stream: StreamManager) => {
  //   if (mainStreamManager !== stream) {
  //     setMainStreamManager(stream);
  //   }
  // };

  const deleteSubscriber = (streamManager: StreamManager) => {
    setSubscribers(prevSubscribers =>
      prevSubscribers.filter(sub => sub !== streamManager),
    );
  };

  // const captureCanvas = () => {
  //   const canvas = document.querySelector("canvas");
  //   if (!canvas) {
  //     console.error("Canvas element not found");
  //     return;
  //   }
  //   const stream = canvas.captureStream(30); // 30 FPS로 캡처
  //   if (!stream) {
  //     console.error("Stream not found");
  //   }
  //   const videoTracks = stream.getVideoTracks();
  //   if (videoTracks.length === 0) {
  //     console.error("No video tracks found in the stream");
  //     return;
  //   }
  //   return videoTracks[0]; // 비디오 트랙을 반환
  // };


  const captureCanvas = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) {
      console.error("Canvas element not found");
      return;
    }
    const stream = canvas?.captureStream(30); // 30 FPS로 캡처
    if (!stream) {
      console.error("Stream not found");
    }
    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length === 0) {
      console.error("No video tracks found in the stream");
      return;
    }
    console.log('Captured video track:', stream!.getVideoTracks()[0]);
    canvas!.style.display = "none";
    canvas!.style.backgroundColor = "transparent";
    if (videoTracks.length === 0) {
      console.error("No video tracks found in the stream");
      return;
    }
    return videoTracks[0]; // 비디오 트랙을 반환

  };

  const startStreamingCanvas = () => {
    const videoTrack = captureCanvas();
    if (videoTrack && videoRef.current) {
      const stream = new MediaStream([videoTrack]);
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    }
  };
  useEffect(() => {
    startStreamingCanvas();
  }, []);

  const joinSession = () => {
    const OV = new OpenVidu();

    const newSession = OV.initSession();
    setSession(newSession);
    const { sessionId, token, participantName } = JSON.parse(
      sessionStorage.getItem("ovInfo")!,
    );
    // Connect to the session
    newSession
      .connect(token, { clientData: participantName })
      .then(async () => {
        const arStream = captureCanvas();
        const publisher = await OV.initPublisherAsync(undefined, {
          audioSource: undefined,
          videoSource: arStream,
          publishAudio: true,
          publishVideo: true,
          resolution: "640x480",
          frameRate: 30,
          insertMode: "APPEND",
          mirror: true,
        });

        console.log("Publisher created:", publisher);
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
      // 새로운 스트림이 생성될 때, 해당 스트림을 구독
      const subscriber = newSession.subscribe(event.stream, undefined);
      // 구독한 스트림을 구독자 목록에 추가
      setSubscribers(prevSubscribers => [...prevSubscribers, subscriber]);
    });

    newSession.on("streamDestroyed", event => {
      deleteSubscriber(event.stream.streamManager);
    });

    newSession.on("exception", exception => {
      console.warn(exception);
    });
  };

  const leaveSession = () => {
    if (session) {
      session.disconnect();
    }

    setSession(undefined);
    setSubscribers([]);
    setMyUserName("Participant" + Math.floor(Math.random() * 100));
    // setMainStreamManager(undefined);
    setPublisher(undefined);
  };

  const openReal = () => {
    console.log("openReal");
    const videoElements = document.querySelectorAll("video");
    const canvasElements = document.querySelectorAll("canvas");
    if (isAvatar) {
      videoElements.forEach(video => {
        video.style.display = "block";
      });
      canvasElements.forEach(canvas => {
        canvas.style.display = "none";
      });
      setIsAvatar(false);
      return;
    }
    videoElements.forEach(video => {
      video.style.display = "none";
    });
    canvasElements.forEach(canvas => {
      canvas.style.display = "block";
    });
    setIsAvatar(true);
  };

  type showArrowProps = {
    from: string;
    to: string;
  };

  const datass: Array<showArrowProps> = [
    { from: "a", to: "d" },
    { from: "b", to: "e" },
    { from: "c", to: "f" },
    { from: "d", to: "a" },
    { from: "e", to: "b" },
    { from: "f", to: "c" },
  ];

  const showArrow = (datas: Array<showArrowProps>) => {
    const acc = [-2, -1, 0, 1, 2, 3];
    datas.forEach(({ from, to }, idx) => {
      const fromUser = document.getElementById(from) as HTMLDivElement;
      const toUser = document.getElementById(to) as HTMLDivElement;
      const arrowContainer = fromUser?.querySelector(
        ".arrow-container",
      ) as HTMLDivElement;
      const arrowBody = arrowContainer?.querySelector(
        ".arrow-body",
      ) as HTMLDivElement;
      console.log(from, to);
      console.log(fromUser, toUser, arrowContainer, arrowBody);

      const rect1 = fromUser.getBoundingClientRect();
      const rect2 = toUser.getBoundingClientRect();
      console.log(rect1, rect2);
      const centerX1 = rect1.left + rect1.width / 2 + acc[idx] * 10;
      const centerY1 = rect1.top + rect1.height / 2 + acc[idx] * 10;
      const centerX2 = rect2.left + rect2.width / 2 + acc[idx] * 10;
      const centerY2 = rect2.top + rect2.height / 2 + acc[idx] * 10;
      const halfWidth = Math.abs(rect1.right - rect1.left) * (3 / 4);

      const deltaX = centerX2 - centerX1;
      const deltaY = centerY2 - centerY1;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const arrowWidth = distance - halfWidth;

      if (idx > 2) {
        arrowBody.style.backgroundColor = "#33C4D7";
        const arrowHead = arrowBody.querySelector(
          ".arrow-head",
        ) as HTMLDivElement;
        arrowHead.style.borderBottom = "20px solid #33C4D7";
      }
      arrowBody.style.width = distance + "px";
      arrowContainer.style.top = centerY1 - rect1.top + "px";
      arrowContainer.style.left = centerX1 - rect1.left + "px";
      arrowContainer.style.transform = `rotate(${
        (Math.atan2(deltaY, deltaX) * 180) / Math.PI
      }deg)`;
      arrowContainer.classList.remove("hidden");
    });
  };

  const hideArrow = () => {
    const arrowContainers = document.querySelectorAll(".arrow-container");
    arrowContainers.forEach(arrowContainer => {
      arrowContainer.classList.add("hidden");
    });
  };

  const changeLoveStickMode = () => {
    const videoContainer =
      document.getElementsByClassName("video-container")[0];
    const videoElements = document.querySelectorAll("video");
    const canvasElements = document.querySelectorAll("canvas");
    videoElements.forEach(video => {
      video.style.width = "100%";
      video.style.height = "100%";
    });
    canvasElements.forEach(canvas => {
      canvas.style.width = "100%";
      canvas.style.height = "100%";
    });
    if (!isLoveMode) {
      videoContainer.classList.add("love-stick");
      showArrow(datass);
      setIsLoveMode(true);
      return;
    }
    videoContainer.classList.remove("love-stick");
    hideArrow();
    setIsLoveMode(false);
  };

  const openKeyword = () => {
    const keyword = [
      "사랑",
      "행복",
      "기쁨",
      "슬픔",
      "화남",
      "놀람",
      "두려움",
      "짜증",
      "힘듦",
      "평화",
      "음주",
    ];
    const randomNum = Math.floor(Math.random() * 11);
    const keywordElement = document.getElementsByClassName("keyword")[0];
    keywordElement.innerHTML = keyword[randomNum];
  };

  const setGrayScale = () => {
    const camElement = document.getElementsByClassName("cam-wrapper")[0];
    if (isMatched) {
      camElement.classList.add("black-white");
      setIsMatched(false);
      return;
    }
    camElement.classList.remove("black-white");
    setIsMatched(true);
  };

  const setChooseMode = () => {
    // 선택 모드 일 때는 마우스 하버시에 선택 가능한 상태로 변경
    // 클릭 시에 선택된 상태로 변경
    const chooseBtns = document.getElementsByClassName("choose-btn");
    const btnArray = Array.from(chooseBtns);
    if (isChooseMode) {
      btnArray.forEach(btn => {
        btn.classList.add("hidden");
      });

      setIsChooseMode(false);
      return;
    }
    btnArray.forEach(btn => {
      btn.classList.remove("hidden");
    });
    setIsChooseMode(true);
  };

  const setOneToOneMode = () => {
    const videoContainer =
      document.getElementsByClassName("video-container")[0];
    const videoElements = document.querySelectorAll("video");
    const canvasElements = document.querySelectorAll("canvas");
    const streamElements = document.getElementsByClassName("stream-container");
    videoElements.forEach(video => {
      video.style.width = "100%";
      video.style.height = "100%";
    });
    canvasElements.forEach(canvas => {
      canvas.style.width = "100%";
      canvas.style.height = "100%";
    });
    if (!isOneToOneMode) {
      videoContainer.classList.add("one-one-four");
      for (let i = 0; i < streamElements.length; i++) {
        const className = String.fromCharCode(97 + i);
        streamElements[i].classList.add(className);
      }
      setIsOneToOneMode(true);
      return;
    }
    videoContainer.classList.remove("one-one-four");
    for (let i = 0; i < streamElements.length; i++) {
      const className = String.fromCharCode(97 + i);
      streamElements[i].classList.remove(className);
    }
    setIsOneToOneMode(false);
  };

  useEffect(() => {
    joinSession();
  }, []);

  useEffect(() => {
    console.log("subscribers", subscribers);
  }, [subscribers]);

  return (
    <div className="container">
      <div id="session">
        <div id="session-header">
          <input
            className="btn btn-large btn-danger"
            type="button"
            id="buttonLeaveSession"
            onClick={leaveSession}
            value="Leave session"
          />
          <div className="btn-container">
            <button onClick={openReal}>캠 오픈</button>
            <button onClick={changeLoveStickMode}>사랑의 작대기</button>
            <button onClick={openKeyword}>키워드</button>
            <button onClick={setGrayScale}>흑백으로 만들기</button>
            <button onClick={setChooseMode}>선택모드</button>
            <button onClick={setOneToOneMode}>1:1모드</button>
            <button onClick={() => showArrow(datass)}>그냥 연결</button>
          </div>
        </div>
        <div className="keyword-wrapper">
          <p className="keyword"></p>
        </div>
        <UserVideoComponent2 />
        <video ref={videoRef}></video>

        <div className="col-md-6 video-container">
          {publisher !== undefined ? (
            <div
              className="stream-container col-md-6 col-xs-6 pub"
              // onClick={() => handleMainVideoStream(publisher)}
            >
              <UserVideoComponent streamManager={publisher} />
            </div>
          ) : null}
          {subscribers.map(sub => (
            <div
              key={sub.stream.streamId}
              className="stream-container col-md-6 col-xs-6 sub"
              // onClick={() => handleMainVideoStream(sub)}
            >
              <span>{sub.id}</span>
              <UserVideoComponent
                key={sub.stream.streamId}
                streamManager={sub}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Meeting;
