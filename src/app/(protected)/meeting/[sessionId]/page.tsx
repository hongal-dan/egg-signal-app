"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import UserVideoComponent from "@/containers/meeting/UserVideoComponent";
import UserVideoComponent2 from "@/containers/main/UserVideo";
import {
  OpenVidu,
  Session,
  Publisher,
  StreamManager,
  PublisherSpeakingEvent,
  Subscriber,
} from "openvidu-browser";
import { useRouter } from "next/navigation";
import { useRecoilValue, useRecoilState } from "recoil";
import {
  isLastChooseState,
  meetingSocketState,
  isChosenState,
} from "@/app/store/socket";
import { avatarState } from "@/app/store/avatar";
import { keywords } from "../../../../../public/data/keywords.js";
import AvatarCollection from "@/containers/main/AvatarCollection";
import { userState } from "@/app/store/userInfo";
import CanvasModal from "@/containers/meeting/CanvasModal";
import { defaultSessionState, winnerSessionState } from "@/app/store/ovInfo";
import MatchingResult from "@/containers/meeting/MatchingResult";
import EggTimer from "@/containers/meeting/EggTimer";
import "animate.css";
import Emoji from "@/containers/meeting/emoji";
import { createRoot } from "react-dom/client";
import Swal from "sweetalert2";
import {
  showArrow,
  hideArrow,
  captureVideoFrame,
  captureCanvas,
  captureCamInit,
} from "@/utils/meeting/meetingUtils";

type chooseResult = {
  sender: string;
  receiver: string;
};

const Meeting = () => {
  const [session, setSession] = useState<Session | undefined>(undefined);
  const [publisher, setPublisher] = useState<Publisher | undefined>(undefined);
  const [subscribers, setSubscribers] = useState<StreamManager[]>([]);
  const [sortedSubscribers, setSortedSubscribers] = useState<StreamManager[]>(
    [],
  );
  const [speakingPublisherIds, setSpeakingPublisherIds] = useState<string[]>(
    [],
  );
  const [isCanvasModalOpen, setIsCanvasModalOpen] = useState<boolean>(false);
  const [keywordsIndex, setKeywordsIndex] = useState(0);
  const [isChosen, setIsChosen] = useRecoilState(isChosenState);

  const captureRef = useRef<HTMLDivElement>(null);
  const keywordRef = useRef<HTMLParagraphElement>(null);
  const pubRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<Array<HTMLDivElement | null>>([]);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<HTMLDivElement>(null);

  const [avatar, setAvatar] = useRecoilState(avatarState);
  const [isOpenCam, setIsOpenCam] = useState<boolean>(false);
  const [socket, setSocket] = useRecoilState(meetingSocketState);
  const [isFull, setIsFull] = useState<boolean>(false);
  const userInfo = useRecoilValue(userState);
  const isFullRef = useRef(isFull);
  const [isMatched, setIsMatched] = useState<boolean>(false); // 매칭이 되었는지 여부
  const [, setIsLastChoose] = useRecoilState(isLastChooseState);
  const [lover, setLover] = useState<string>("");
  const isLastChoose = useRecoilValue(isLastChooseState);

  const { sessionId, token, participantName } =
    useRecoilValue(defaultSessionState);
  const [, setSessionInfo] = useRecoilState(winnerSessionState);

  const router = useRouter();

  const [capturedImage, setCapturedImage] = useState<string>("");
  const [isFinish, setIsFinish] = useState(false);

  const chooseTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // 오디오 차단 관련
  const getKeyById = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      return element.getAttribute("data-key");
    } else {
      console.error("Element with id", id, "not found.");
      return null;
    }
  };

  // 내가 매칭 된 경우, 매칭 안 된 참여자들 소리 안 듣기
  const toggleLoserAudio = (partnerName: string, flag: boolean) => {
    const partnerStreamId = getKeyById(partnerName);

    subscribers.forEach(sub => {
      if (
        sub instanceof Subscriber &&
        sub.stream.streamId !== partnerStreamId
      ) {
        sub?.subscribeToAudio(flag);
      }
    });
  };

  // 내가 매칭 안 된 경우, 매칭 된 참여자들 소리 안 듣기
  const toggleLoverAudio = (loser: string[], flag: boolean) => {
    const loserStreamIds = loser
      .map(loserName => getKeyById(loserName))
      .filter(id => id !== null);

    if (loserStreamIds.length > 0) {
      subscribers.forEach(sub => {
        if (
          sub instanceof Subscriber &&
          !loserStreamIds.includes(sub.stream.streamId)
        ) {
          sub?.subscribeToAudio(flag);
        }
      });
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
    // Connect to the session
    newSession
      .connect(token, {
        clientData: userInfo?.nickname as string, // FIXME 배포시엔 저를 써주세요.
        // clientData: participantName, // FIXME 배포 시 랜덤닉네임 말고 유저 아이디로
        gender: userInfo?.gender as string,
      })
      .then(async () => {
        const arStream = captureCanvas(captureRef.current!);
        const publisher = await OV.initPublisherAsync(undefined, {
          audioSource: undefined,
          // videoSource: undefined, // todo : 테스트용이라 다시 arStream으로 변경
          videoSource: arStream,
          publishAudio: true,
          publishVideo: true,
          resolution: "640x480",
          frameRate: 30,
          insertMode: "APPEND",
          mirror: false,
        });

        console.log("Publisher created:", publisher, sessionId);
        publisher.updatePublisherSpeakingEventsOptions({
          interval: 100, // 발화자 이벤트 감지 주기 (밀리초)
          threshold: -50, // 발화자 이벤트 발생 임계값 (데시벨)
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
      // 새로운 스트림이 생성될 때, 해당 스트림을 구독
      const subscriber = newSession.subscribe(event.stream, undefined);
      // 구독한 스트림을 구독자 목록에 추가
      console.log("지금 들어온 사람", subscriber.stream.connection.data);
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
    });
  };

  // 선택된 표시 제거
  const removeChooseSign = () => {
    const chosenElements = document.getElementsByClassName("chosen-stream");
    const opacityElements = document.getElementsByClassName("opacity");
    Array.from(chosenElements).forEach(chosenElement => {
      chosenElement.classList.remove("chosen-stream");
    });
    Array.from(opacityElements).forEach(opacityElement => {
      opacityElement.classList.remove("opacity");
    });
  };

  const leaveSession = (isSucceedFlag = false) => {
    if (session) {
      session.disconnect();
    }
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    setSession(undefined);
    setSubscribers([]);
    setPublisher(undefined);
    setSortedSubscribers([]);
    setIsFull(false);
    setIsLastChoose(false);
    setIsChosen(false);
    OffSocketEvent();

    if (!isSucceedFlag) {
      router.push("/main");
      return;
    } else {
      router.push("/meeting/matching");
      return;
    }
  };

  // // 화살표 출발 도착 좌표 계산
  // const findPosition = (
  //   fromElement: HTMLDivElement,
  //   toElement: HTMLDivElement,
  // ): Array<number> => {
  //   const rect1 = fromElement.getBoundingClientRect();
  //   const rect2 = toElement.getBoundingClientRect();
  //   let acc = 0;
  //   if (fromElement.classList.contains("MALE")) {
  //     acc = 10;
  //   } else {
  //     acc = -10;
  //   }

  //   if (
  //     fromElement.classList.contains("a") ||
  //     fromElement.classList.contains("b") ||
  //     fromElement.classList.contains("c")
  //   ) {
  //     const startX1 = rect1.right;
  //     const startY1 = rect1.top + rect1.height / 2;
  //     const endX2 = rect2.left;
  //     const endY2 = rect2.top + rect2.height / 2;
  //     return [startX1, startY1 + acc, endX2, endY2 - acc];
  //   } else {
  //     const startX1 = rect1.left;
  //     const startY1 = rect1.top + rect1.height / 2;
  //     const endX2 = rect2.right;
  //     const endY2 = rect2.top + rect2.height / 2;
  //     return [startX1, startY1 + acc, endX2, endY2 - acc];
  //   }
  // };

  // // 성별에 따라 화살표 색 변경
  // const setArrowColor = (
  //   fromElement: HTMLDivElement,
  //   arrow: Array<HTMLDivElement>,
  // ) => {
  //   const [Head, Body] = arrow;
  //   if (fromElement.classList.contains("MALE")) {
  //     Head.style.borderBottom = "20px solid #33C4D7";
  //     Body.style.backgroundColor = "#33C4D7";
  //     return;
  //   }
  //   Head.style.borderBottom = "20px solid #fa3689";
  //   Body.style.backgroundColor = "#fa3689";
  // };

  // const showArrow = (datas: Array<chooseResult>) => {
  //   datas.forEach(({ sender, receiver }) => {
  //     const fromUser = document.getElementById(sender) as HTMLDivElement;
  //     const toUser = document.getElementById(receiver) as HTMLDivElement;
  //     const arrowContainer = fromUser?.querySelector(
  //       ".arrow-container",
  //     ) as HTMLDivElement;
  //     const arrowBody = arrowContainer?.querySelector(
  //       ".arrow-body",
  //     ) as HTMLDivElement;
  //     const arrowHead = arrowBody?.querySelector(
  //       ".arrow-head",
  //     ) as HTMLDivElement;

  //     const rect1 = fromUser.getBoundingClientRect();
  //     const [startX1, startY1, endX2, endY2] = findPosition(fromUser, toUser);

  //     const deltaX = endX2 - startX1;
  //     const deltaY = endY2 - startY1;
  //     const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  //     setArrowColor(fromUser, [arrowHead, arrowBody]);
  //     arrowContainer.style.paddingTop = "1rem";
  //     // arrowBody.style.width = distance - 20 + "px";
  //     arrowContainer.style.top = startY1 - rect1.top + "px";
  //     arrowContainer.style.left = startX1 - rect1.left + "px";

  //     arrowBody.style.setProperty('--arrow-width', `${distance - 20}px`);

  //     arrowContainer.style.transform = `rotate(${
  //       (Math.atan2(deltaY, deltaX) * 180) / Math.PI
  //     }deg)`;

  //     if(fromUser.classList.contains("a") || fromUser.classList.contains("b") || fromUser.classList.contains("c")) {
  //       arrowContainer.classList.remove("hidden");
  //       arrowBody.style.animation = 'none';
  //       arrowBody.offsetHeight;
  //       arrowBody.style.animation = 'growArrow 2s ease-out forwards';
  //       return;
  //     }
  //     setTimeout(() => {
  //       arrowContainer.classList.remove("hidden");
  //       arrowBody.style.animation = 'none';
  //       arrowBody.offsetHeight;
  //       arrowBody.style.animation = 'growArrow 2s ease-out forwards';
  //     }, 3000);
  //   });
  // };

  // const hideArrow = () => {
  //   const arrowContainers = document.querySelectorAll(".arrow-container");
  //   arrowContainers.forEach(arrowContainer => {
  //     arrowContainer.classList.add("hidden");
  //   });
  // };

  const changeLoveStickMode = (datas: Array<chooseResult>) => {
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

    const videoArray = Array.from(subRef.current);
    videoArray.unshift(pubRef.current);
    videoArray.forEach((video, idx) => {
      video?.classList.add(String.fromCharCode(97 + idx));
    });

    videoContainerRef.current?.classList.add("love-stick");
    showArrow(datas);
    return;
  };

  const undoLoveStickMode = () => {
    console.log("사랑의 작대기 모드 해제");
    const videoArray = Array.from(subRef.current);
    videoArray.unshift(pubRef.current);
    videoArray.forEach((video, idx) => {
      video?.classList.remove(String.fromCharCode(97 + idx));
    });
    videoContainerRef.current?.classList.remove("love-stick");
    hideArrow();
  };
  // time 초 동안 발표 모드 (presenter: 발표자, time: 발표 시간(초), mention: 발표 주제)
  const changePresentationMode = (
    presenter: HTMLDivElement,
    time: number,
    mention: string = "",
  ) => {
    if (keywordRef.current) {
      keywordRef.current.innerText = mention;
    }
    const videoSet = new Set<HTMLDivElement | null>();
    videoSet.add(presenter); // 발표자 추가
    videoSet.add(pubRef.current); // 다음으로 퍼블리셔 추가
    subRef.current.forEach(sub => {
      videoSet.add(sub); // 나머지 사람들 다 추가
    });
    const videoArray = Array.from(videoSet); // 중복 제거된 순서대로 발표자 > 나 > 나머지 순서대로 정렬
    videoContainerRef.current?.classList.add("presentation-mode");
    // 비디오 그리드 a: main , bcdef
    videoArray.forEach((video, idx) => {
      video?.classList.add(String.fromCharCode(97 + idx));
    });

    // time 초 후 원래대로
    setTimeout(() => {
      videoArray.forEach((video, idx) => {
        video?.classList.remove(String.fromCharCode(97 + idx));
      });
      videoContainerRef.current?.classList.remove("presentation-mode");
      if (keywordRef.current) {
        keywordRef.current.innerText = "";
      }
    }, time * 1000);
  };

  const openKeyword = (random: number) => {
    return keywords[random];
  };

  const undoChooseMode = () => {
    setIsChosen(false);
    // 선택 모드 일 때는 마우스 하버시에 선택 가능한 상태로 변경
    // 클릭 시에 선택된 상태로 변경
    if (keywordRef.current) {
      keywordRef.current.innerText = "";
      console.log("선택모드 p태그 삭제");
    }

    const oppositeRef = subRef.current.slice(2);

    oppositeRef.forEach(subContainer => {
      const chooseBtn = subContainer!.getElementsByClassName("choose-btn")[0];
      chooseBtn.classList.add("hidden");
    });
  };

  const setChooseMode = () => {
    // 선택 모드 일 때는 마우스 하버시에 선택 가능한 상태로 변경
    // 클릭 시에 선택된 상태로 변경
    if (keywordRef.current) {
      keywordRef.current.innerText = "대화해보고 싶은 사람을 선택해주세요";
    }
    // 이성만 선택 버튼 활성화
    const oppositeRef = subRef.current.slice(2);

    oppositeRef.forEach(subContainer => {
      const chooseBtn = subContainer!.getElementsByClassName("choose-btn")[0];
      chooseBtn.classList.remove("hidden");
    });
    setIsChosen(false);
    chooseTimerRef.current = setTimeout(() => {
      const emitChoose = (eventName: string) => {
        socket?.emit(eventName, {
          sender: userInfo?.nickname,
          receiver: subRef.current[subRef.current.length - 1]?.id,
        });
      };
      if (!isLastChoose) {
        emitChoose("choose");
      } else {
        emitChoose("lastChoose");
      }
    }, 5000);
  };

  const setOneToOneMode = (loverElement: HTMLDivElement) => {
    console.log("1:1 모드로 시작");
    const videoElements = document.querySelectorAll("video");
    const canvasElements = document.querySelectorAll("canvas");
    const streamElements = document.getElementsByClassName(
      "stream-container",
    ) as HTMLCollectionOf<HTMLDivElement>;
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
    videoContainerRef.current?.classList.add("one-one-four");
    streamElements[0].classList.add("a");
    if (!loverElement) {
      console.log("상대방이 없습니다.");
    }
    loverElement?.classList.add("b");
    console.log("컨테이너", videoContainerRef.current);
    console.log("나자신", streamElements[0]);
    console.log("상대방: ", loverElement);
    let acc = 2;
    for (let i = 1; i < streamElements.length; i++) {
      if (streamElements[i].classList.contains("b")) {
        continue;
      }
      const className = String.fromCharCode(97 + acc);
      streamElements[i].classList.add(className);
      acc += 1;
    }
  };

  const undoOneToOneMode = (loverElement: HTMLDivElement) => {
    console.log("1:1 모드 해제");
    setIsChosen(false);
    const streamElements = document.getElementsByClassName("stream-container");
    videoContainerRef.current?.classList.remove("one-one-four");
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
    console.log("나자신", streamElements[0]);
    console.log("상대방: ", loverElement);
  };

  //FIXME 시연용 룰렛 함수
  const randomUser = (keywordIdx: number, pickUser: string) => {
    const streamElements = document.getElementsByClassName("stream-container");
    const streamArray = Array.from(streamElements);
    const tickSound = document.getElementById("tickSound") as HTMLAudioElement;

    const rouletteElements = streamArray
      .slice(0, streamArray.length / 2)
      .concat(
        streamArray.slice(streamArray.length / 2).reverse(),
      ) as HTMLDivElement[];

    const totalIterations = 36; // 원하는 총 반복 횟수
    const minDuration = 10; // 초기 강조 시간 간격
    const maxDuration = 200; // 마지막 강조 시간 간격

    let currentIndex = 0;
    let iteration = 0;
    const isAnimating = true;

    for (let i = 0; i < rouletteElements.length; i++) {
      rouletteElements[i].classList.remove("speaking");
      if (rouletteElements[i].id === pickUser) {
        currentIndex += i % 6;
      }
    }

    const highlightUser = () => {
      if (!isAnimating || iteration >= totalIterations) {
        clearInterval(intervalId);
        rouletteElements[currentIndex].classList.add("highlighted");
        tickSound.currentTime = 0;
        tickSound.play();
        const randomKeyword = openKeyword(keywordIdx);
        if (pubRef.current?.id === pickUser) {
          changePresentationMode(pubRef.current, 11, randomKeyword);
        } else {
          const presenterElement = subRef.current?.filter(
            sub => sub?.id === pickUser,
          )[0];
          if (presenterElement) {
            changePresentationMode(presenterElement, 11, randomKeyword);
          }
        }
        setTimeout(() => {
          for (let i = 0; i < rouletteElements.length; i++) {
            rouletteElements[i].classList.remove("highlighted");
          }
          rouletteElements.forEach(element => {
            element.classList.remove("bright-5");
            element.classList.add("bright-100");
          });
        }, 3000);
        return;
      }

      rouletteElements[currentIndex].classList.remove("highlighted");
      rouletteElements[currentIndex].classList.add("bright-5");
      currentIndex = (currentIndex + 1) % rouletteElements.length;
      rouletteElements[currentIndex].classList.add("highlighted");
      rouletteElements[currentIndex].classList.remove("bright-5");

      tickSound.currentTime = 0;
      tickSound.play();

      iteration++;

      // 비선형적으로 증가하는 시간 간격 계산 (제곱 함수 사용)
      const progress = iteration / totalIterations;
      const duration =
        minDuration * Math.pow(maxDuration / minDuration, progress * 1.5);
      clearInterval(intervalId);
      intervalId = setInterval(highlightUser, duration);
    };

    let intervalId = setInterval(highlightUser, minDuration);
  };

  const meetingEvent = () => {
    socket?.on("keyword", message => {
      try {
        console.log("keyword Event: ", message);
        console.log("random user: ", message.getRandomParticipant);

        if (sessionRef.current) {
          sessionRef.current.classList.add("bg-black");
        }
        pubRef.current?.classList.add("bright-5");
        subRef.current.forEach(sub => {
          sub?.classList.add("bright-5");
        });
        setTimeout(() => {
          if (keywordRef.current) {
            keywordRef.current.classList.add("text-white");
            keywordRef.current.innerText =
              "곧 한 참가자가 선택됩니다. 선택된 사람은 질문에 답변해주세요";
          }
        }, 2000);
        setTimeout(() => {
          randomUser(parseInt(message.message), message.getRandomParticipant);
          setTimeout(() => {
            if (sessionRef.current) {
              sessionRef.current.classList.remove("bg-black");
            }
            pubRef.current?.classList.remove("bright-5");
            subRef.current.forEach(sub => {
              sub?.classList.remove("bright-5");
            });
            if (keywordRef.current) {
              keywordRef.current.classList.remove("text-white");
            }
          }, 22000);
        }, 5000);
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
              keywordRef.current.innerText = `${countdown}초 뒤 미팅이 종료됩니다.`;
            }
            countdown -= 1;
          } else {
            clearInterval(intervalId);
            if (keywordRef.current) {
              keywordRef.current.innerText = "";
            }
            setIsFinish(true);
            if (session) {
              session.disconnect();
              setSession(undefined);
            }
            // leaveSession();
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
          console.log("원 위치로 변경");
          undoLoveStickMode();
          if (keywordRef.current) {
            console.log("잠시 후 1:1대화가 시작된다는 멘트 ");
            keywordRef.current.innerText =
              "잠시 후 매칭된 사람과의 1:1 대화가 시작됩니다.";
          }
        }, 10000); // 5초 후 원 위치
      } catch (e: any) {
        console.error(e);
      }
    });

    // 선택시간 신호 받고 선택 모드로 변경
    socket?.on("cupidTime", (response: string) => {
      try {
        console.log("cupidTime 도착", response);
        setChooseMode();
      } catch (e: any) {
        console.error(e);
      }
    });

    socket?.on("lastCupidTime", (response: any) => {
      try {
        console.log("lastCupidTime 도착", response);
        setIsLastChoose(true);
        setChooseMode();
      } catch (e: any) {
        console.error(e);
      }
    });

    socket?.on("lastChooseResult", response => {
      try {
        console.log("lastChooseResult 도착");
        console.log("lastChooseResult = ", response);
        undoChooseMode(); // 선택모드 해제
        removeChooseSign(); // 선택된 사람 표시 제거
        changeLoveStickMode(response as Array<chooseResult>);
        setTimeout(() => {
          console.log("원 위치로 변경");
          undoLoveStickMode();
          if (keywordRef.current) {
            keywordRef.current.innerText = "잠시 후 미팅이 종료됩니다";
          }
        }, 5000); // 5초 후 원 위치 (시연용)
      } catch (e: any) {
        console.error(e);
      }
    });

    type lastCupidResult = {
      lover: string;
    };

    socket?.on("matching", (response: lastCupidResult) => {
      try {
        console.log("matching도착", response);
        const { lover } = response;
        if (lover != "0") {
          // 러버 저장하고 넘겨야해요. 모달로 띄워야되니까
          console.log("제게는 사랑하는 짝이 있어요. 그게 누구냐면..", lover);
          setLover(lover);
          setCapturedImage(captureVideoFrame(lover) as string);
          setIsMatched(true); // 이게 성공 모달
        }
      } catch (e: any) {
        console.error(e);
      }
    });

    socket?.on("choice", response => {
      console.log("choice 도착!~~~~~~~~~~~~~~", response);
      const { sessionId, token } = response;
      setSessionInfo({ sessionId: sessionId, token: token });
      leaveSession(true);
    });

    /**그림대회 모달 */
    socket?.on("drawingContest", response => {
      console.log("drawingContest 도착", response);
      const index = response.keywordsIndex;
      setKeywordsIndex(index);
      if (keywordRef.current)
        keywordRef.current.innerText = "잠시 후 그림 대회가 시작됩니다";

      setTimeout(() => {
        if (keywordRef.current)
          keywordRef.current.innerText =
            "1등은 원하는사람과 1:1 대화를 할 수 있어요";
      }, 4500);

      setTimeout(() => {
        setIsCanvasModalOpen(true);
        if (keywordRef.current) {
          keywordRef.current!.innerText = "주제에 맞는 그림을 그려보세요";
        }
      }, 8000);

      setTimeout(() => {
        if (keywordRef.current) {
          keywordRef.current!.innerText = "";
        }
      }, 20000);
    });

    /**이모티콘 */
    socket?.on("emojiBroadcast", ({ nickname, emojiIndex }) => {
      const targetVideo = document.getElementById(nickname);
      const emojiContainer = targetVideo?.querySelector(".emoji-container");

      if (emojiContainer) {
        const emojiElement = document.createElement("div");
        emojiElement.className =
          "emoji absolute text-5xl animate__animated animate__bounceInUp";
        const emojiImage = (
          <Image src={emojiIndex} alt="" width={56} height={56} />
        );
        createRoot(emojiElement).render(emojiImage);

        emojiContainer.appendChild(emojiElement);

        emojiElement.onanimationend = () => {
          emojiElement.classList.replace(
            "animate__bounceInUp",
            "animate__bounceOutUp",
          );
          emojiElement.onanimationend = () =>
            emojiContainer.removeChild(emojiElement);
        };
      }
    });

    // 자기소개 시간
    socket?.on("introduce", response => {
      try {
        if (keywordRef.current) {
          keywordRef.current.innerText =
            "잠시 후 화면에 표시된 사람은 자기소개를 시작해주세요";
        }
        console.log(response);

        setTimeout(() => {
          // const participantsArray: Array<string> = response;
          const participantsArray: string = response;
          console.log("Introduce 도착", participantsArray);
          // let idx = 0;
          const participantElement = document.getElementById(
            // participantsArray[idx],
            participantsArray, //FIXME 시연용
          ) as HTMLDivElement;
          changePresentationMode(
            participantElement,
            // 10,
            // "20초간 자기소개 해주세요",
            5, //FIXME 시연용
            "자기소개 해주세요", //FIXME 시연용
          ); // FIXME 테스트용 10초 나중에 원래대로 돌리기
          // const timeInterval = setInterval(() => {
          //   idx += 1;
          //   const participantElement = document.getElementById(
          //     participantsArray[idx],
          //   ) as HTMLDivElement;
          //   changePresentationMode(
          //     participantElement,
          //     10,
          //     "20초간 자기소개 해주세요",
          //   ); // FIXME 테스트용 10초 나중에 원래대로 돌리기
          //   if (idx == 5) {
          //     clearInterval(timeInterval);
          //   }
          // }, 10100); // FIXME 테스트용 10초 나중에 원래대로 돌리기
        }, 5000);
      } catch (e: any) {
        console.error(e);
      }
    });
  };

  const meetingCupidResultEvent = () => {
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
          if (lover != "0") {
            console.log("이거도 없니?", keywordRef.current);
            if (keywordRef.current) {
              console.log("즐거운 시간 보내라고 p 태그 변경");
              keywordRef.current.innerText =
                "즐거운 시간 보내세요~ 1:1 대화 소리는 다른 참여자들이 들을 수 없어요.";
            }
            const loverElement = document
              .getElementById(lover)
              ?.closest(".stream-container") as HTMLDivElement;

            loser.forEach(loser => {
              const loserElementContainer = document.getElementById(
                loser,
              ) as HTMLDivElement;
              const loserElement = loserElementContainer.querySelector(
                ".stream-wrapper",
              ) as HTMLDivElement;
              loserElement.classList.add("black-white");
            });

            setOneToOneMode(loverElement);
            toggleLoserAudio(lover, false); // 나머지 오디오 차단
            setTimeout(() => {
              // console.log("1:1 모드 해제")
              if (keywordRef.current) {
                keywordRef.current.innerText = "";
                console.log("즐거운시간 삭제");
              }
              undoOneToOneMode(loverElement);
              toggleLoserAudio(lover, true); // 나머지 오디오 재개
              loser.forEach(loser => {
                const loserElementContainer = document.getElementById(
                  loser,
                ) as HTMLDivElement;
                const loserElement = loserElementContainer.querySelector(
                  ".stream-wrapper",
                ) as HTMLDivElement;
                loserElement.classList.remove("black-white");
              });
              // }, 60000); // 1분 후 원 위치
            }, 20000); //FIXME 시연용 20초 후 원 위치
          }
          // 매칭 안된 사람들의 경우
          else {
            // const pubElement = document.getElementsByClassName("pub")[0] as HTMLDivElement;
            // pubElement.classList.toggle("black-white");
            if (loser.length === 6) {
              if (keywordRef.current) {
                keywordRef.current.innerText =
                  "매칭 된 사람이 없습니다. 사이좋게 대화하세요";
              }
              return;
            }
            if (keywordRef.current) {
              keywordRef.current.innerText =
                "당신은 선택받지 못했습니다. 1:1 대화 중인 참여자들의 소리를 들을 수 없어요.";
            }
            toggleLoverAudio(loser, false); // 매칭된 사람들 오디오 차단
            loser.forEach(loser => {
              const loserElementContainer = document.getElementById(
                loser,
              ) as HTMLDivElement;
              const loserElement = loserElementContainer.querySelector(
                ".stream-wrapper",
              ) as HTMLDivElement;
              loserElement.classList.add("black-white");
              setTimeout(() => {
                // pubElement.classList.toggle("black-white");
                loserElement.classList.remove("black-white");
                // }, 60000); // 1분 후 흑백 해제
              }, 20000); //FIXME 시연용 20초 후 원 위치
            });
            // muteAudio();
            setTimeout(() => {
              if (keywordRef.current) {
                keywordRef.current.innerText = "";
              }
              // unMuteAudio();
              toggleLoverAudio(loser, true); // 오디오 재개
              // }, 60000); // 1분 후 음소거 해제
            }, 20000); //FIXME 시연용 20초 후 원 위치
          }
        }, 13000); // 결과 도착 후 13초뒤에 1:1 대화 진행
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

  // const captureVideoFrame = (lover: string) => {
  //   const loverVideoContainer = document.getElementById(
  //     lover,
  //   ) as HTMLDivElement;
  //   const loverVideoElement = loverVideoContainer.querySelector(
  //     "video",
  //   ) as HTMLVideoElement;
  //   const canvas = document.createElement("canvas");
  //   if (loverVideoElement) {
  //     canvas.width = loverVideoElement.videoWidth;
  //     canvas.height = loverVideoElement.videoHeight;
  //     const context = canvas.getContext("2d");
  //     if (context) {
  //       context.drawImage(loverVideoElement, 0, 0, canvas.width, canvas.height);
  //       const dataUrl = canvas.toDataURL("image/png");
  //       setCapturedImage(dataUrl);
  //     }
  //   }
  // };

  const OffSocketEvent = () => {
    if (socket) {
      socket.off("keyword");
      socket.off("finish");
      socket.off("chooseResult");
      socket.off("cupidTime");
      socket.off("lastCupidTime");
      socket.off("lastChooseResult");
      socket.off("matching");
      socket.off("choice");
      socket.off("drawingContest");
      socket.off("introduce");
      socket.off("cupidResult");
      socket.off("cam");
    }
  };

  useEffect(() => {
    const timeOut = setTimeout(() => {
      if (!isFullRef.current) {
        if (loadingRef.current) {
          loadingRef.current.innerHTML =
            "<p>누군가 연결을 해제하여 메인화면으로 이동합니다.</p>";
        }
        setTimeout(() => {
          leaveSession();
        }, 5000);
      }
    }, 60000); // 60초 동안 6명 안들어 오면 나가기

    return () => {
      clearTimeout(timeOut);
    };
  }, []);

  useEffect(() => {
    isFullRef.current = isFull;
  }, [isFull]);

  useEffect(() => {
    if (!publisher) {
      return;
    }
    meetingCamEvent();
  }, [publisher]);

  const getUserID = (person: StreamManager): string => {
    const idMatch = person?.stream.connection.data.match(
      /"clientData":"([a-zA-Z0-9-\uAC00-\uD7A3]+)"/,
    );
    const id = idMatch ? idMatch[1] : "";
    return id;
  };

  const getUserGender = (person: StreamManager): string => {
    const genderMatch = person?.stream.connection.data.match(
      /"gender":"(MALE|FEMALE)"/,
    );
    const gender = genderMatch ? genderMatch[1] : "";

    return gender;
  };

  // 내 성별 기준으로 서브 정렬
  const sortSubscribers = (myGender: string) => {
    let oppositeGender = "";
    if (myGender === "MALE") {
      oppositeGender = "FEMALE";
    } else {
      oppositeGender = "MALE";
    }

    subscribers.forEach(subscriber => {
      if (getUserGender(subscriber) === myGender)
        setSortedSubscribers(prevSortedSubScribers => [
          ...prevSortedSubScribers,
          subscriber,
        ]);
    });
    subscribers.forEach(subscriber => {
      if (getUserGender(subscriber) === oppositeGender)
        setSortedSubscribers(prevSortedSubScribers => [
          ...prevSortedSubScribers,
          subscriber,
        ]);
    });
  };

  useEffect(() => {
    console.log("subscribers", subscribers);
    if (!subscribers) {
      return;
    }
    meetingCupidResultEvent();

    if (subscribers.length === 5) {
      if (getUserGender(publisher!) === "MALE") {
        sortSubscribers("MALE");
      } else {
        sortSubscribers("FEMALE");
      }
      setIsFull(true);
      socket?.emit("startTimer", { sessionId: sessionId });
    }
    if (isFull && subscribers.length !== 5 && !isFinish) {
      if (keywordRef.current) {
        keywordRef.current.innerText =
          "누군가가 연결을 해제하여 10초 후 메인으로 이동합니다.";
      }
      setTimeout(() => {
        leaveSession();
      }, 10000); // 누군가 탈주하면 10초 뒤에 세션 종료
    }
  }, [subscribers]);

  useEffect(() => {
    if (!avatar) {
      console.log("avatar가 없습니ㅏㄷ!!!!!!!!!!!!!!!!!!");
      return;
    }

    captureCamInit(captureRef.current!); // 캡쳐용 비디오, 캔버스 display none
    joinSession();

    if (publisher) {
      publisher.updatePublisherSpeakingEventsOptions({
        interval: 100, // 발화자 이벤트 감지 주기 (밀리초)
        threshold: -50, // 발화자 이벤트 발생 임계값 (데시벨)
      });
    }

    meetingEvent();

    return () => {
      setAvatar(null);
    };
  }, [avatar]);

  useEffect(() => {
    if (!isChosen) {
      return;
    }
    if (chooseTimerRef.current) {
      clearTimeout(chooseTimerRef.current);
      chooseTimerRef.current = null;
    }
  }, [isChosen]);

  const leaveHandler = () => {
    Swal.fire({
      title: "정말 나가시겠습니까?",
      text: "지금 나가면 현재 미팅 방이 종료됩니다!",
      imageUrl: "/img/500.png",
      imageWidth: 200,
      imageHeight: 200,
      imageAlt: "crying eggs",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "나갈게요",
      cancelButtonText: "취소",
    }).then(result => {
      if (result.isConfirmed) {
        leaveSession();
      }
    });
  };

  return !avatar ? (
    <AvatarCollection />
  ) : !isFinish ? (
    <>
      {!isFull ? (
        <div className="w-[100vw] h-[100vh] flex flex-col justify-center items-center gap-24">
          <div
            className="flex flex-col items-center gap-4 text-3xl"
            ref={loadingRef}
          >
            <p>다른 사람들의 접속을 기다리고 있습니다</p>
            <p>잠시만 기다려주세요</p>
          </div>
          <span className="pan"></span>
        </div>
      ) : (
        <div className="h-full">
          <div
            id="session-header"
            className="fixed flex flex-col justify-center items-center w-full"
          >
            <div className="flex w-full mb-2 px-[10vw]">
              <input
                className="border-b border-gray-500 text-gray-500 cursor-pointer"
                type="button"
                id="buttonLeaveSession"
                onClick={() => leaveHandler()}
                value="종료하기"
              />
            </div>
            <EggTimer setTime={5} />
            <div className="w-full h-6 mt-4">
              <p
                className="flex justify-center items-center font-bold h-full text-3xl"
                ref={keywordRef}
              ></p>
              <audio
                id="tickSound"
                src="/sound/tick.mp3"
                className="hidden"
              ></audio>
            </div>
          </div>
          <div
            id="session"
            className="h-full flex justify-center items-center transition-colors duration-[1500ms] ease-in-out"
            ref={sessionRef}
          >
            {/* <div ref={captureRef} className="hidden">
          <UserVideoComponent2 />
        </div> */}
            <div
              className="relative col-md-6 video-container"
              ref={videoContainerRef}
            >
              {publisher !== undefined ? (
                <div
                  // className={`stream-container col-md-6 col-xs-6 pub ${publisher.stream.streamId === speakingPublisherId ? "speaking" : ""} ${getUserGender(publisher)}`}
                  className={`stream-container col-md-6 col-xs-6 pub custom-shadow ${getUserGender(publisher)}`}
                  // onClick={() => handleMainVideoStream(publisher)}
                  id={getUserID(publisher)}
                  ref={pubRef}
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
              {sortedSubscribers.map((sub, idx) => (
                <div
                  key={sub.stream.streamId}
                  data-key={sub.stream.streamId}
                  // className={`stream-container col-md-6 col-xs-6 sub ${sub.stream.streamId === speakingPublisherId ? "speaking" : ""} ${getUserGender(sub)}`}
                  className={`stream-container col-md-6 col-xs-6 sub custom-shadow ${getUserGender(sub)}`}
                  // onClick={() => handleMainVideoStream(sub)}
                  id={getUserID(sub)}
                  ref={el => {
                    subRef.current[idx] = el;
                  }}
                >
                  <UserVideoComponent
                    key={sub.stream.streamId}
                    streamManager={sub}
                    className={
                      speakingPublisherIds.includes(sub.stream.streamId)
                        ? "speaking"
                        : ""
                    }
                  />
                </div>
              ))}
            </div>
            <Emoji />
          </div>
        </div>
      )}
      {isCanvasModalOpen && (
        <CanvasModal
          onClose={() => setIsCanvasModalOpen(false)}
          keywordsIndex={keywordsIndex}
        />
      )}
      {!isOpenCam ? (
        <div ref={captureRef} className="hidden">
          <UserVideoComponent2 />
        </div>
      ) : null}
    </>
  ) : (
    <>
      {isFinish ? (
        <MatchingResult
          capturedImage={capturedImage}
          lover={lover}
          isMatched={isMatched}
          onClose={leaveSession}
        />
      ) : null}
    </>
  );
};

export default Meeting;
