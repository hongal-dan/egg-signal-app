"use client";

import React, { useEffect, useState, useRef } from "react";
import UserVideoComponent from "@/containers/meeting/UserVideoComponent";
import UserVideoComponent2 from "@/containers/main/UserVideo";
import {
  OpenVidu,
  Session,
  Publisher,
  StreamManager,
  Device,
  PublisherSpeakingEvent,
} from "openvidu-browser";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useRecoilValue } from "recoil";
import { meetingSocketState } from "@/app/store/socket";
import { keywords } from "../../../../public/data/keywords.js";

// type Props = {
//   sessionId: string;
//   token: string;
//   participantName: string;
// };

type chooseResult = {
  sender: string;
  receiver: string;
};

const Meeting = () => {
  const [session, setSession] = useState<Session | undefined>(undefined);
  const [publisher, setPublisher] = useState<Publisher | undefined>(undefined);
  const [subscribers, setSubscribers] = useState<StreamManager[]>([]);
  const [mainStreamManager, setMainStreamManager] = useState<StreamManager>();
  const [currentVideoDevice, setCurrentVideoDevice] = useState<Device | null>(
    null,
  );
  const [speakingPublisherId, setSpeakingPublisherId] = useState<string | null>(
    null,
  );

  const [isLoveMode, setIsLoveMode] = useState<boolean>(false);
  const [isChooseMode, setIsChooseMode] = useState<boolean>(false);
  const [isOneToOneMode, setIsOneToOneMode] = useState<boolean>(false);
  const captureRef = useRef<HTMLDivElement>(null);
  const keywordRef = useRef<HTMLParagraphElement>(null);

  const socket = useRecoilValue(meetingSocketState);

  // const socket = io(`${url}/meeting`, {
  //   transports: ["websocket"],
  // });

  // const [socket, setSocket] = useState<WebSocket | null>(null);

  // useEffect(() => {
  //   const newSocket = io(`${url}/meeting`, {
  //     transports: ["websocket"],
  //   });
  //   setSocket(newSocket);
  // }, []);

  // console.log(mainStreamManager, currentVideoDevice);
  const router = useRouter();

  // 어떻게든 종료 하면 세션에서 나가게함.
  useEffect(() => {
    console.log("메인이 실행되었습니다.");
    const handleBeforeUnload = () => leaveSession();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      console.log("메인이 종료되었습니다.");
    };
  }, []);

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
    const stream = canvas?.captureStream(15); // 30 FPS로 캡처
    if (!stream) {
      console.error("Stream not found");
    }
    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length === 0) {
      console.error("No video tracks found in the stream");
      return;
    }
    console.log("Captured video track:", stream!.getVideoTracks()[0]);
    canvas!.style.display = "none";
    canvas!.style.backgroundColor = "transparent";
    if (videoTracks.length === 0) {
      console.error("No video tracks found in the stream");
      return;
    }
    return videoTracks[0]; // 비디오 트랙을 반환
  };

  // const startStreamingCanvas = () => {
  //   const videoTrack = captureCanvas();
  //   if (videoTrack && videoRef.current) {
  //     const stream = new MediaStream([videoTrack]);
  //     videoRef.current.srcObject = stream;
  //     videoRef.current.play();
  //   }
  // };
  // useEffect(() => {
  //   startStreamingCanvas();
  // }, []);

  const openCam = () => {
    if (publisher) {
      navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
        const webcamTrack = stream.getVideoTracks()[0];
        publisher
          .replaceTrack(webcamTrack)
          .then(() => {
            console.log("Track replaced with webcam track");
          })
          .catch(error => {
            console.error("Error replacing track:", error);
          });
      });
    }
  };

  const muteAudio = () => {
    if (publisher) {
      // 오디오 트랙 비활성화
      const audioTracks = publisher.stream.getMediaStream().getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = false;
        track.stop();
      });
      console.log("Audio tracks disabled");
    }
  };

  const unMuteAudio = () => {
    if (publisher) {
      const audioTracks = publisher.stream.getMediaStream().getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = true;
      });
      console.log("Audio tracks enabled");
    }
  };

  const joinSession = () => {
    const OV = new OpenVidu();
    OV.setAdvancedConfiguration({
      publisherSpeakingEventsOptions: {
        interval: 100, // Frequency of the polling of audio streams in ms (default 100)
        threshold: -50, // Threshold volume in dB (default -50)
      },
    });

    const newSession = OV.initSession();
    setSession(newSession);
    const { sessionId, token, participantName } = JSON.parse(
      sessionStorage.getItem("ovInfo")!,
    );
    console.log(sessionId);
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
          mirror: false,
        });

        console.log("Publisher created:", publisher);
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

    // 세션에서 발화자 이벤트 리스너 추가
    newSession.on("publisherStartSpeaking", (event: PublisherSpeakingEvent) => {
      console.log("Publisher started speaking:", event.connection);
      const streamId = event.connection.stream?.streamId;
      if (streamId !== undefined) {
        setSpeakingPublisherId(streamId);
      } else {
        console.log("streamId undefined");
      }
    });

    newSession.on("publisherStopSpeaking", (event: PublisherSpeakingEvent) => {
      console.log("Publisher stopped speaking:", event.connection);
      setSpeakingPublisherId(null);
    });

    // 선택 결과 받고 사랑의 작대기 모드로 변경
    socket?.on("chooseResult", message => {
      try {
        console.log("chooseResult = ", message);
        setChooseMode(); // 선택모드 해제
        removeChooseSign(); // 선택된 사람 표시 제거
        changeLoveStickMode(message as Array<chooseResult>);
        setTimeout(() => changeLoveStickMode(message), 10000); // 10초 후 원 위치
      } catch (e: any) {
        console.error(e);
      }
    });

    type cupidResult = {
      lover: string;
      winners: Array<string>;
    };

    // 선택 결과 받고 1:1 모드로 변경
    socket?.on("cupidResult", (message: cupidResult) => {
      try {
        const { lover, winners } = message;
        console.log(lover, winners);

        // 매칭 된 사람의 경우
        if (lover != "0") {
          const loverElement = document.getElementById(lover) as HTMLDivElement;
          const subElements = Array.from(
            document.getElementsByClassName("sub"),
          );
          // sub들 흑백으로 만들기
          subElements.forEach(subElement => {
            if (subElement === loverElement) {
              return;
            }
            subElement.classList.toggle("black-white");
          });

          setOneToOneMode(loverElement);
          setTimeout(() => {
            setOneToOneMode(loverElement);
            subElements.forEach(subElement => {
              if (subElement === loverElement) {
                return;
              }
              subElement.classList.toggle("black-white");
            }, 60000); // 1분 후 원 위치
          });
        }
        // 매칭 안된 사람들의 경우
        // Todo: 매칭 안된 사람들은 누가 매칭되었는 지 알아야되는데 ,, 그래야 흑백 처리를 하는데 ,,,,
        else {
          winners.forEach(winner => {
            const winnerElement = document.getElementById(
              winner,
            ) as HTMLDivElement;
            winnerElement.classList.toggle("black-white");
            setTimeout(
              () => winnerElement.classList.toggle("black-white"),
              60000,
            ); // 1분 후 흑백 해제
          });
          muteAudio();
          setTimeout(() => unMuteAudio(), 60000); // 1분 후 음소거 해제
        }
      } catch (e: any) {
        console.error(e);
      }
    });
  };

  // 선택시간 신호 받고 선택 모드로 변경
  socket?.on("cupidTime", (message: number) => {
    try {
      console.log(message);
      setChooseMode();
    } catch (e: any) {
      console.error(e);
    }
  });

  // 선택된 표시 제거
  const removeChooseSign = () => {
    const chosenElements = document.getElementsByClassName("chosen-stream");
    Array.from(chosenElements).forEach(chosenElement => {
      chosenElement.classList.remove("chosen-stream");
    });
  };

  const leaveSession = () => {
    if (session) {
      session.disconnect();
    }
    if (socket) {
      socket.disconnect();
    }

    setSession(undefined);
    setSubscribers([]);
    setPublisher(undefined);
    router.push("/main");
  };

  // const openReal = () => {
  //   console.log("openReal");
  //   const videoElements = document.querySelectorAll("video");
  //   const canvasElements = document.querySelectorAll("canvas");
  //   if (isAvatar) {
  //     videoElements.forEach(video => {
  //       video.style.display = "block";
  //     });
  //     canvasElements.forEach(canvas => {
  //       canvas.style.display = "none";
  //     });
  //     setIsAvatar(false);
  //     return;
  //   }
  //   videoElements.forEach(video => {
  //     video.style.display = "none";
  //   });
  //   canvasElements.forEach(canvas => {
  //     canvas.style.display = "block";
  //   });
  //   setIsAvatar(true);
  // };

  const showArrow = (datas: Array<chooseResult>) => {
    const acc = [-2, -1, 0, 1, 2, 3];
    datas.forEach(({ sender, receiver }, idx) => {
      const fromUser = document.getElementById(sender) as HTMLDivElement;
      const toUser = document.getElementById(receiver) as HTMLDivElement;
      const arrowContainer = fromUser?.querySelector(
        ".arrow-container",
      ) as HTMLDivElement;
      const arrowBody = arrowContainer?.querySelector(
        ".arrow-body",
      ) as HTMLDivElement;
      console.log(sender, receiver);
      console.log(fromUser, toUser, arrowContainer, arrowBody);

      const rect1 = fromUser.getBoundingClientRect();
      const rect2 = toUser.getBoundingClientRect();
      console.log(rect1, rect2);
      const centerX1 = rect1.left + rect1.width / 2 + acc[idx] * 10;
      const centerY1 = rect1.top + rect1.height / 2 + acc[idx] * 10;
      const centerX2 = rect2.left + rect2.width / 2 + acc[idx] * 10;
      const centerY2 = rect2.top + rect2.height / 2 + acc[idx] * 10;
      // const halfWidth = Math.abs(rect1.right - rect1.left) * (3 / 4);

      const deltaX = centerX2 - centerX1;
      const deltaY = centerY2 - centerY1;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      // const arrowWidth = distance - halfWidth;

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

  const changeLoveStickMode = (datas: Array<chooseResult>) => {
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
      showArrow(datas);
      setIsLoveMode(true);
      return;
    }
    videoContainer.classList.remove("love-stick");
    hideArrow();
    setIsLoveMode(false);
  };

  const captureCamInit = () => {
    const videoElement = captureRef.current?.querySelector(
      "video",
    ) as HTMLVideoElement;
    const canvasElement = captureRef.current?.querySelector(
      "canvas",
    ) as HTMLCanvasElement;
    if (videoElement) {
      videoElement.style.display = "none";
    }
    if (canvasElement) {
      canvasElement.style.display = "none";
    }
  };

  const openKeyword = (random: number) => {
    if (keywordRef.current) {
      keywordRef.current.innerText = keywords[random];
    }
  };

  // Todo: 선택 시간이라고 서버에서 emit해주면 실행(현재 서버에서 신호 안옴)
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

  const setOneToOneMode = (loverElement: HTMLDivElement) => {
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
      streamElements[0].classList.add("a");
      loverElement?.classList.add("b");
      let acc = 2;
      for (let i = 1; i < streamElements.length; i++) {
        if (streamElements[i].classList.contains("b")) {
          continue;
        }
        const className = String.fromCharCode(97 + acc);
        streamElements[i].classList.add(className);
        acc += 1;
      }
      setIsOneToOneMode(true);
      return;
    }
    videoContainer.classList.remove("one-one-four");
    streamElements[0].classList.remove("a");
    let acc = 2;
    for (let i = 1; i < streamElements.length; i++) {
      if (streamElements[i].classList.contains("b")) {
        continue;
      }
      const className = String.fromCharCode(97 + acc);
      streamElements[i].classList.remove(className);
      acc += 1;
    }
    loverElement?.classList.remove("b");
    setIsOneToOneMode(false);
  };

  const randomUser = (keywordIdx: number) => {
    const streamElements = document.getElementsByClassName("stream-container");
    const tickSound = document.getElementById("tickSound") as HTMLAudioElement;

    if (keywordRef.current) {
      keywordRef.current.innerText =
        "곧 한 참가자가 선택됩니다. 선택된 사람은 질문에 답변해주세요";
    }

    const animationDuration = 10000; // 초기 강조 애니메이션 기본 지속 시간
    const currentIndex = 0;
    let currentDuration = 50;
    let isAnimating = true;

    // speaking 클래스 제거
    for (let i = 0; i < streamElements.length; i++) {
      streamElements[i].classList.remove("speaking");
    }

    const highlightUser = (index: number) => {
      if (!isAnimating) return;
      // 현재 인덱스의 참여자를 강조 (빨간색 border 추가)
      streamElements[index].classList.add("highlighted");

      // 룰렛 소리 재생
      tickSound.currentTime = 0; // 오디오를 처음부터 재생
      tickSound.play();

      // 일정 시간 후에 border 초기화 (빨간색 border 제거)
      setTimeout(() => {
        streamElements[index].classList.remove("highlighted");
        streamElements[(index + 1) % streamElements.length].classList.add(
          "highlighted",
        );

        // 다음 참여자 강조 시작 (재귀 호출)
        setTimeout(() => {
          currentDuration += 20;
          highlightUser((index + 1) % streamElements.length);
        }, currentDuration - 20);

        setTimeout(() => {
          isAnimating = false;
          for (let i = 0; i < streamElements.length; i++) {
            streamElements[i].classList.remove("highlighted");
          }
          openKeyword(keywordIdx);
        }, animationDuration);
      }, currentDuration - 20);
    };
    // 초기 강조 시작
    highlightUser(currentIndex);
  };

  const meetingEvent = () => {
    socket?.on("keyword", message => {
      try {
        console.log("keyword Event: ", message);
        randomUser(parseInt(message.message));
      } catch (e: any) {
        console.error(e);
      }
    });

    socket?.on("finish", message => {
      try {
        console.log(message);
        // 1차: 모든 참여자 세션 종료
        let countdown = 5;
        const intervalId = setInterval(() => {
          if (countdown > 0) {
            if (keywordRef.current) {
              keywordRef.current.innerText = `${countdown}초 뒤 세션이 종료됩니다.`;
            }
            countdown -= 1;
          } else {
            clearInterval(intervalId);
            if (keywordRef.current) {
              keywordRef.current.innerText = "";
            }
            leaveSession();
          }
        }, 1000);
      } catch (e: any) {
        console.error(e);
      }
    });
  };

  const meetingCamEvent = () => {
    socket?.on("cam", message => {
      try {
        console.log("cam Event: ", message);
        let countdown = 5;
        const intervalId = setInterval(() => {
          if (countdown > 0) {
            if (keywordRef.current) {
              keywordRef.current.innerText = `${countdown}초 뒤 얼굴이 공개됩니다.`;
            }
            countdown -= 1;
          } else {
            clearInterval(intervalId);
            if (keywordRef.current) {
              keywordRef.current.innerText = "";
            }
            openCam();
          }
        }, 1000);
      } catch (e: any) {
        console.error(e);
      }
    });
  };

  const [min, setMin] = useState(5);
  const [sec, setSec] = useState(0);
  const time = useRef(300);
  const timerId = useRef<null | NodeJS.Timeout>(null);
  const totalTime = 300;
  const [progressWidth, setProgressWidth] = useState("0%");

  useEffect(() => {
    timerId.current = setInterval(() => {
      setMin(Math.floor(time.current / 60));
      setSec(time.current % 60);
      time.current -= 1;
    }, 1000);
    return () => clearInterval(timerId.current!);
  }, []);

  useEffect(() => {
    if (time.current <= 0) {
      console.log("time out");
      clearInterval(timerId.current!);
    }
    setProgressWidth(`${((totalTime - time.current) / totalTime) * 100}%`);
  }, [sec]);

  useEffect(() => {
    joinSession();
    captureCamInit(); // 캡쳐용 비디오, 캔버스 display none

    if (publisher) {
      publisher.updatePublisherSpeakingEventsOptions({
        interval: 100, // 발화자 이벤트 감지 주기 (밀리초)
        threshold: -50, // 발화자 이벤트 발생 임계값 (데시벨)
      });

      // publisher.on("publisherStartSpeaking", event => {
      //   console.log("The local user started speaking", event.connection);
      //   // 발화자가 말하기 시작했을 때 수행할 작업
      // });

      // publisher.on("publisherStopSpeaking", event => {
      //   console.log("The local user stopped speaking", event.connection);
      //   // 발화자가 말하기를 멈췄을 때 수행할 작업
      // });
    }

    if (mainStreamManager) {
      mainStreamManager.updatePublisherSpeakingEventsOptions({
        interval: 100, // 오디오 스트림 폴링 간격 (ms)
        threshold: -50, // 볼륨 임계값 (dB)
      });
    }

    meetingEvent();
  }, []);

  useEffect(() => {
    if (!publisher) {
      return;
    }
    meetingCamEvent();
  }, [publisher]);

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
          <div className="flex items-center">
            <Image src="/img/egg1.png" alt="" width={50} height={50} />
            <p
              style={{
                width: progressWidth,
                backgroundColor: "orange",
                height: "20px",
                borderRadius: "10px",
              }}
            ></p>
            <Image src="/img/egg2.png" alt="" width={50} height={50} />
          </div>
        </div>
        <div className="keyword-wrapper">
          <p className="keyword" ref={keywordRef}></p>
          <audio
            id="tickSound"
            src="/sound/tick.mp3"
            className="hidden"
          ></audio>
        </div>
        <div ref={captureRef} className="hidden">
          <UserVideoComponent2 />
        </div>
        {/* <video ref={videoRef}></video> */}

        <div className="col-md-6 video-container">
          {publisher !== undefined ? (
            <div
              className={`stream-container col-md-6 col-xs-6 pub ${publisher.stream.streamId === speakingPublisherId ? "speaking" : ""}`}
              // onClick={() => handleMainVideoStream(publisher)}
            >
              <UserVideoComponent streamManager={publisher} socket={socket} />
            </div>
          ) : null}
          {subscribers.map(sub => (
            <div
              key={sub.stream.streamId}
              className={`stream-container col-md-6 col-xs-6 sub ${sub.stream.streamId === speakingPublisherId ? "speaking" : ""}`}
              // onClick={() => handleMainVideoStream(sub)}
            >
              <span>{sub.id}</span>
              <UserVideoComponent
                key={sub.stream.streamId}
                streamManager={sub}
                socket={socket}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Meeting;
