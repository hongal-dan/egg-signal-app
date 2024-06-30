"use client";
import axios from "axios";
import React, { useEffect, useState } from "react";
import UserVideoComponent from "@/containers/meeting/UserVideoComponent";
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
    console.log("===========세션에 저장된 오픈비두 ===============")
    console.log(sessionId, token, participantName);
    // Connect to the session
    newSession
      .connect(token, { clientData: participantName, gender: userInfo?.gender as string })
      .then(async () => {
        const arStream = captureCanvas();
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
      console.log("setSubscribers", subscribers);
    });

    newSession.on("streamDestroyed", event => {
      deleteSubscriber(event.stream.streamManager);
    });

    newSession.on("exception", exception => {
      console.warn(exception);
    });

    // 세션에서 발화자 이벤트 리스너 추가
    newSession.on("publisherStartSpeaking", (event: PublisherSpeakingEvent) => {
      // console.log("Publisher started speaking:", event.connection);
      const streamId = event.connection.stream?.streamId;
      if (streamId !== undefined) {
        setSpeakingPublisherId(streamId);
      } else {
        console.log("streamId undefined");
      }
    });

    newSession.on("publisherStopSpeaking", (event: PublisherSpeakingEvent) => {
      // console.log("Publisher stopped speaking:", event.connection);
      setSpeakingPublisherId(null);
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
      setSocket(null);
    }

    setSession(undefined);
    setSubscribers([]);
    setPublisher(undefined);
    setSortedSubscribers([]);
    setIsFull(false);
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
          '.arrow-head'
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
    if (keywordRef.current) {
      keywordRef.current.innerText = "에그 시그널 결과";
      console.log("에그시그널 결과라고 p태그 변경했음");
    }
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
    videoContainer.classList.add("love-stick");
    showArrow(datas);
    // setIsLoveMode(true);
    return;
    // }
    // videoContainer.classList.remove("love-stick");
    // hideArrow();
    // setIsLoveMode(false);
  };

  const undoLoveStickMode = () => {
    // if (keywordRef.current) {
    //   keywordRef.current.innerText = '';
    //   console.log("에그시그널 결과라고 p태그 변경한거 삭제함");
    // }
    const videoContainer =
      document.getElementsByClassName("video-container")[0];
    console.log("사랑의 작대기 모드 해제");
    videoContainer.classList.remove("love-stick");
    hideArrow();
  };
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
  };

  const openKeyword = (random: number) => {
    if (keywordRef.current) {
      keywordRef.current.innerText = keywords[random];
    }
  };

  const undoChooseMode = () => {
    // 선택 모드 일 때는 마우스 하버시에 선택 가능한 상태로 변경
    // 클릭 시에 선택된 상태로 변경
    if (keywordRef.current) {
      keywordRef.current.innerText = "";
      console.log("선택모드 p태그 삭제");
    }
    const chooseBtns = document.getElementsByClassName("choose-btn");
    const btnArray = Array.from(chooseBtns);
    btnArray.forEach(btn => {
      btn.classList.add("hidden");
    });
  };

  const setChooseMode = () => {
    // 선택 모드 일 때는 마우스 하버시에 선택 가능한 상태로 변경
    // 클릭 시에 선택된 상태로 변경
    if (keywordRef.current) {
      keywordRef.current.innerText = "대화해보고 싶은 사람을 선택해주세요";
    }
    console.log("선택 모드로 변경");
    const chooseBtns = document.getElementsByClassName("choose-btn");
    const btnArray = Array.from(chooseBtns);
    btnArray.forEach(btn => {
      btn.classList.remove("hidden");
    });
  };

  const setOneToOneMode = (loverElement: HTMLDivElement) => {
    console.log("1:1 모드로 시작");
    const videoContainer = document.getElementsByClassName(
      "video-container",
    )[0] as HTMLDivElement;
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
    videoContainer.classList.add("one-one-four");
    streamElements[0].classList.add("a");
    if (!loverElement) {
      console.log("상대방이 없습니다.");
    }
    loverElement?.classList.add("b");
    console.log("컨테이너", videoContainer);
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
    const videoContainer =
      document.getElementsByClassName("video-container")[0];
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
    console.log("나자신", streamElements[0]);
    console.log("상대방: ", loverElement);
  };

  const randomUser = (keywordIdx: number, pickUser: string) => {
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
          currentDuration += 10;
          highlightUser((index + 1) % streamElements.length);
        }, currentDuration - 10);

        setTimeout(() => {
          isAnimating = false;
          for (let i = 0; i < streamElements.length; i++) {
            streamElements[i].classList.remove("highlighted");
          }
          openKeyword(keywordIdx);
          // todo1: random user nickname(pickUser) 으로 video 찾아서 발표자 화면 출력하기
          const presenterElement = Array.prototype.filter.call(
            streamElements,
            function (element) {
              const nestedDiv = element.querySelector(
                `div > div[id=${pickUser}]`,
              );
              return nestedDiv !== null;
            },
          )[0];
          changePresentationMode(presenterElement, 10);
        }, animationDuration);
      }, currentDuration - 10);
    };
    // 초기 강조 시작
    highlightUser(currentIndex);
  };

  const meetingEvent = () => {
    socket?.on("keyword", message => {
      try {
        time.current = 240; // 1분 지남
        setProgressWidth(`${((totalTime - time.current) / totalTime) * 100}%`);
        console.log("keyword Event: ", message);
        console.log("random user: ", message.getRandomParticipant);
        randomUser(parseInt(message.message), message.getRandomParticipant);
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
          console.log("원 위치로 변경");
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
            console.log("이거도 없니?", keywordRef.current);
            if (keywordRef.current) {
              console.log("즐거운 시간 보내라고 p 태그 변경");
              keywordRef.current.innerText = "즐거운 시간 보내세요~";
            }
            const loverElement = document
              .getElementById(lover)
              ?.closest(".stream-container") as HTMLDivElement;
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
              if (keywordRef.current) {
                keywordRef.current.innerText = "";
                console.log("즐거운시간 삭제");
              }
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
            if (keywordRef.current) {
              keywordRef.current.innerText =
                "당신은 선택받지 못했습니다. 1분 간 오디오가 차단됩니다.";
              console.log("미선택자 p태그 변경", keywordRef.current);
            }
            loser.forEach(loser => {
              const loserElement = document.getElementById(
                loser,
              ) as HTMLDivElement;
              console.log("loser:", loser);
              loserElement.classList.toggle("black-white");
              setTimeout(() => {
                // pubElement.classList.toggle("black-white");
                loserElement.classList.toggle("black-white");
              }, 60000); // 1분 후 흑백 해제
            });
            muteAudio();
            setTimeout(() => {
              if (keywordRef.current) {
                keywordRef.current.innerText = "";
                console.log("미선택자 p태그 초기화", keywordRef.current);
              }
              unMuteAudio();
            }, 60000); // 1분 후 음소거 해제
          }
        }, 10000);
      } catch (e: any) {
        console.error(e);
      }
    });

    // 선택시간 신호 받고 선택 모드로 변경
    socket?.on("cupidTime", (response: number) => {
      try {
        console.log("cupidTime 도착", response);
        setChooseMode();
      } catch (e: any) {
        console.error(e);
      }
    });
  };

  const meetingCamEvent = () => {
    socket?.on("cam", message => {
      try {
        time.current = 120; // 3분 지남 -지금 서버 기준 (나중에 시간 서버 시간 바뀌면 같이 바꿔야 함!)
        setProgressWidth(`${((totalTime - time.current) / totalTime) * 100}%`);
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

  const [min, setMin] = useState(5); // todo: 시작 시간 서버로부터 받기
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
    if (!publisher) {
      return;
    }
    meetingCamEvent();
  }, [publisher]);

  const getUserGender = (person: StreamManager) : string => {
    const genderMatch = person.stream.connection.data.match(/"gender":"(MALE|FEMALE)"/);
    const gender = genderMatch ? genderMatch[1] : "";

    return gender;
  }

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
    if (subscribers.length === 5) {
      if (getUserGender(publisher!) === "MALE") {
        sortSubscribers("MALE");
      } else {
        sortSubscribers("FEMALE");
      }
      setIsFull(true);
    }
  }, [subscribers]);

  useEffect(() => {
    if (!avatar) {
      console.log("avatar가 없습니ㅏㄷ!!!!!!!!!!!!!!!!!!");
      return;
    }

    captureCamInit(); // 캡쳐용 비디오, 캔버스 display none
    joinSession();

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
  }, [avatar]);

  return !avatar ? (
    <AvatarCollection />
  ) : (
    <>
      {!isFull ? (
        <div className="w-[100vw] h-[100vh] flex flex-col justify-center items-center gap-24">
          <div className="flex flex-col items-center gap-4 text-3xl">
            <p>다른 사람들의 접속을 기다리고 있습니다</p>
            <p>잠시만 기다려주세요</p>
          </div>
          <span className="pan"></span>
        </div>
      ) : (
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
                  className="bg-orange-300 h-[20px] rounded-lg"
                  style={{
                    width: progressWidth,
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

            {/* <div ref={captureRef} className="hidden">
          <UserVideoComponent2 />
        </div> */}
            <div className="col-md-6 video-container">
              {publisher !== undefined ? (
                <div
                  className={`stream-container col-md-6 col-xs-6 pub ${publisher.stream.streamId === speakingPublisherId ? "speaking" : ""} ${getUserGender(publisher)}`}
                  // onClick={() => handleMainVideoStream(publisher)}
                >
                  <UserVideoComponent
                    streamManager={publisher}
                    socket={socket}
                  />
                </div>
              ) : null}
              {sortedSubscribers.map(sub => (
                <div
                  key={sub.stream.streamId}
                  className={`stream-container col-md-6 col-xs-6 sub ${sub.stream.streamId === speakingPublisherId ? "speaking" : ""} ${getUserGender(sub)}`}
                  // onClick={() => handleMainVideoStream(sub)}
                >
                  <UserVideoComponent
                    key={sub.stream.streamId}
                    streamManager={sub}
                    socket={socket}
                  />
                  {/* <span>{sub.stream.connection.data}</span> */}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {!isOpenCam ? (
        <div ref={captureRef} className="hidden">
          <UserVideoComponent2 />
        </div>
      ) : null}
    </>
  );
};

export default Meeting;
