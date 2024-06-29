"use client";

import React, { useEffect, useState, useRef } from "react";
import UserVideoComponent from "@/containers/meeting/UserVideoComponent";
import UserVideoComponent2 from "../../../containers/main/UserVideo";
import {
  OpenVidu,
  Session,
  Publisher,
  StreamManager,
  Device,
} from "openvidu-browser";
import { useRouter } from "next/navigation";
import { useRecoilValue } from "recoil";
import { meetingSocketState } from "@/app/store/socket";
import { avatarState } from "@/app/store/avatar";
import AvatarCollection from "@/containers/main/AvatarCollection";

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
  const [, setMainStreamManager] = useState<StreamManager>();
  const [, setCurrentVideoDevice] = useState<Device | null>(
    null,
  );

  // const [isLoveMode, setIsLoveMode] = useState<boolean>(false);
  // const [isChooseMode, setIsChooseMode] = useState<boolean>(false);
  // const [isOneToOneMode, setIsOneToOneMode] = useState<boolean>(false);
  const captureRef = useRef<HTMLDivElement>(null);
  const keywordRef = useRef<HTMLParagraphElement>(null);
  const pubRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<Array<HTMLDivElement | null>>([]);

  const socket = useRecoilValue(meetingSocketState);

  const avatar = useRecoilValue(avatarState);
  const [isOpenCam, setIsOpenCam] = useState<boolean>(false);

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

  const deleteSubscriber = (streamManager: StreamManager) => {
    setSubscribers(prevSubscribers =>
      prevSubscribers.filter(sub => sub !== streamManager),
    );
  };

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
            setIsOpenCam(true);
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
        const arStream = captureCanvas(); // todo: 다시 켜야함
        const publisher = await OV.initPublisherAsync(undefined, {
          audioSource: undefined,
          // videoSource: undefined, // todo : 테스트용이라 다시 arStream으로 변경
          videoSource: arStream, // todo : 테스트용이라 다시 arStream으로 변경
          publishAudio: true,
          publishVideo: true,
          resolution: "640x480",
          frameRate: 30,
          insertMode: "APPEND",
          mirror: false,
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
      // console.log(sender, receiver);
      // console.log(fromUser, toUser, arrowContainer, arrowBody);

      const rect1 = fromUser.getBoundingClientRect();
      const rect2 = toUser.getBoundingClientRect();
      // console.log(rect1, rect2);
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
    // if (!isLoveMode) {
      console.log("사랑의 작대기 모드로 변경");
      videoContainer.classList.add("love-stick");
      showArrow(datas);
      // setIsLoveMode(true);
      return;
    // }
    // console.log("사랑의 작대기 모드 해제")
    // videoContainer.classList.remove("love-stick");
    // hideArrow();
    // setIsLoveMode(false);
  };

  const undoLoveStickMode = () => {
    const videoContainer =
      document.getElementsByClassName("video-container")[0];
    console.log("사랑의 작대기 모드 해제")
    videoContainer.classList.remove("love-stick");
    hideArrow();
  }


  // time 초 동안 발표 모드 (presenter: 발표자, time: 발표 시간(초))
  const changePresentationMode = (presenter: HTMLDivElement, time: number) => {
    const videoSet = new Set<HTMLDivElement | null>();
    videoSet.add(presenter);
    videoSet.add(pubRef.current);
    subRef.current.forEach(sub => {
      videoSet.add(sub);
    });
    const videoArray = Array.from(videoSet);

    // 비디오 그리드 a: main , bcdef
    videoArray.forEach((video, idx) => {
      video?.classList.add(String.fromCharCode(97 + idx));
    });

    // time 초 후 원래대로
    setTimeout(() => {
      videoArray.forEach((video, idx) => {
        video?.classList.remove(String.fromCharCode(97 + idx));
      });
    }, time * 1000);
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
    console.log("videoelement : ", videoElement, "canvaselement : ", canvasElement);
  };

  const openKeyword = (random: number) => {
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
      "이상형",
      "결혼",
      "데이트 장소",
      "연상 연하",
      "MBTI",
      "혈액형",
      "취미",
      "좋아하는 음식",
      "민트초코",
    ];
    if (keywordRef.current) {
      keywordRef.current.innerText = keyword[random];
    }
  };

  // Todo: 선택 시간이라고 서버에서 emit해주면 실행(현재 서버에서 신호 안옴)
  const undoChooseMode = () => {
    // 선택 모드 일 때는 마우스 하버시에 선택 가능한 상태로 변경
    // 클릭 시에 선택된 상태로 변경
    const chooseBtns = document.getElementsByClassName("choose-btn");
    const btnArray = Array.from(chooseBtns);
    // if (isChooseMode) {
      btnArray.forEach(btn => {
        btn.classList.add("hidden");
      });

      // setIsChooseMode(false);
      // return;
    // }
    // btnArray.forEach(btn => {
    //   btn.classList.remove("hidden");
    // });
    // setIsChooseMode(true);
  };

  const setChooseMode = () => {
    const chooseBtns = document.getElementsByClassName("choose-btn");
    const btnArray = Array.from(chooseBtns);
    btnArray.forEach(btn => {
      btn.classList.remove("hidden");
    });
  }


  // loverelement의 stream-container를 줘야함
  const setOneToOneMode = (loverElement: HTMLDivElement) => {
    console.log("1:1 모드로 시작");
    const videoContainer =
      document.getElementsByClassName("video-container")[0] as HTMLDivElement;
    const videoElements = document.querySelectorAll("video");
    const canvasElements = document.querySelectorAll("canvas");
    const streamElements = document.getElementsByClassName("stream-container") as HTMLCollectionOf<HTMLDivElement>;
    videoElements.forEach(video => {
      video.style.width = "100%";
      video.style.height = "100%";
    });
    canvasElements.forEach(canvas => {
      canvas.style.width = "100%";
      canvas.style.height = "100%";
    });
    // if (!isOneToOneMode) {
      console.log("1:1 모드로 변경");
      videoContainer.classList.add("one-one-four");
      videoContainer.offsetHeight;
      streamElements[0].classList.add("a");
      if(!loverElement) {
        console.log("상대방이 없습니다.");
      }
      loverElement?.classList.add("b");
      console.log("컨테이너", videoContainer);
      console.log("나자신", streamElements[0]);
      console.log("상대방: " , loverElement);
      let acc = 2;
      console.log("요소 길이는 6이어야해" , streamElements.length)
      for (let i = 1; i < streamElements.length; i++) {
        if (streamElements[i].classList.contains("b")) {
          continue;
        }
        console.log("추가합니다잇", streamElements[i]);
        const className = String.fromCharCode(97 + acc);
        streamElements[i].classList.add(className);
        acc += 1;
      }
  };

  const undoOneToOneMode = (loverElement: HTMLDivElement) => {
    console.log("1:1 모드 해제");
    const videoContainer =
    document.getElementsByClassName("video-container")[0];
  const videoElements = document.querySelectorAll("video");
  const canvasElements = document.querySelectorAll("canvas");
  const streamElements = document.getElementsByClassName("stream-container");
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
    console.log("나자신", streamElements[0])
    console.log("상대방: " , loverElement)
  };

  const meetingEvent = () => {
    socket?.on("keyword", message => {
      try {
        console.log("keyword Event: ", message);
        openKeyword(parseInt(message.message));
      } catch (e: any) {
        console.error(e);
      }
    });

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

    // 선택 결과 받고 사랑의 작대기 모드로 변경
    socket?.on("chooseResult", response => {
      try {
        console.log("chooseResult 도착");
        console.log("chooseResult = ", response);
        undoChooseMode(); // 선택모드 해제
        removeChooseSign(); // 선택된 사람 표시 제거
        changeLoveStickMode(response.message as Array<chooseResult>);
        setTimeout(() => {
          console.log("원 위치로 변경")
          // undoLoveStickMode(response.messageas as Array<chooseResult>);
          undoLoveStickMode();
        }, 10000); // 10초 후 원 위치
      } catch (e: any) {
        console.error(e);
      }
    });

    type cupidResult = {
      lover: string;
      loser: Array<string>;
    };

    // 선택 결과 받고 1:1 모드로 변경
    socket?.on("cupidResult", response => {
      try {
        console.log("cupidResult 도착", response);
        const { lover, loser } = response as cupidResult;
        console.log(lover, loser);

        // 매칭 된 사람의 경우
        setTimeout(() => {
          console.log("큐피드result로 계산 시작");
          const subElements = Array.from(
            document.getElementsByClassName("sub"),
          );
          if (lover != "0") {
            const loverElement = document.getElementById(lover)?.closest('.stream-container') as HTMLDivElement;
            // sub들 흑백으로 만들기
            subElements.forEach(subElement => {
              if (subElement === loverElement) {
                return;
              }
              subElement.classList.toggle("black-white");
              console.log("나머지 흑백 만들기");
            });
  
            setOneToOneMode(loverElement);
            setTimeout(() => {
              // console.log("1:1 모드 해제")
              undoOneToOneMode(loverElement);
              subElements.forEach(subElement => {
                if (subElement === loverElement) {
                  return;
                }
                subElement.classList.toggle("black-white");
              }); 
            }, 60000); // 1분 후 원 위치
          }
          // 매칭 안된 사람들의 경우
          else {
            // const pubElement = document.getElementsByClassName("pub")[0] as HTMLDivElement;
            // pubElement.classList.toggle("black-white");
            loser.forEach(loser => {
              const loserElement = document.getElementById(loser) as HTMLDivElement;
              console.log("loser:", loser);
              loserElement.classList.toggle("black-white");
              setTimeout(
                () => {
                  // pubElement.classList.toggle("black-white");
                  loserElement.classList.toggle("black-white")},
                60000,
              ); // 1분 후 흑백 해제
            });
            muteAudio();
            setTimeout(() => unMuteAudio(), 60000); // 1분 후 음소거 해제
          }

        }, 10000);
      } catch (e: any) {
        console.error(e);
      }
    });

    // 선택시간 신호 받고 선택 모드로 변경
    socket?.on("cupidTime", (response: number) => {
      try {
        console.log(response);
        setChooseMode();
      } catch (e: any) {
        console.error(e);
      }
    });
  };

  useEffect(() => {
    if(!avatar) {
      console.log("avatar가 없습니ㅏㄷ!!!!!!!!!!!!!!!!!!");
      return;
    }

    console.log("아바타가 있습니다!!!!!!!!!!!!!!!!");
    captureCamInit(); // 캡쳐용 비디오, 캔버스 display none
    joinSession();
    meetingEvent();
  }, [avatar]);

  useEffect(() => {
    console.log("subscribers", subscribers);
  }, [subscribers]);


  return avatar == null ? (
    <AvatarCollection />
  ) :
   (
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
          </div>
        </div>
        <div className="keyword-wrapper">
          <p className="keyword" ref={keywordRef}></p>
        </div>
        {!isOpenCam ? (<div ref={captureRef} className="hidden">
          <UserVideoComponent2 />
        </div>) : (null)}

        <div className="col-md-6 video-container">
          {publisher !== undefined ? (
            <div
              className="stream-container col-md-6 col-xs-6 pub"
              // onClick={() => handleMainVideoStream(publisher)}
              ref={pubRef}
            >
              <UserVideoComponent streamManager={publisher} socket={socket} />
            </div>
          ) : null}
          {subscribers.map((sub, i) => (
            <div
              key={sub.stream.streamId}
              className="stream-container col-md-6 col-xs-6 sub"
              // onClick={() => handleMainVideoStream(sub)}
              ref={(el: HTMLDivElement | null): void => {
                subRef.current[i] = el;
              }}
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
