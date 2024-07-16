import { Socket } from "socket.io-client";
import { Session, Publisher, StreamManager } from "openvidu-browser";
import {
  captureVideoFrame,
  changeLoveStickMode,
  changePresentationMode,
  oneToOneParams,
  randomKeywordEvent,
  removeChooseSign,
  undoChooseMode,
  undoLoveStickMode,
} from "./meetingUtils";
import { openCam, toggleLoverAudio } from "./openviduUtils";
import { createRoot } from "react-dom/client";
import Image from "next/image";

type lastCupidResult = {
  lover: string;
};

type chooseResult = {
  sender: string;
  receiver: string;
};

type meetingEventParams = {
  sessionRef: React.MutableRefObject<HTMLDivElement | null>;
  pubRef: React.MutableRefObject<HTMLDivElement | null>;
  subRef: React.MutableRefObject<(HTMLDivElement)[]>;
  keywordRef: React.MutableRefObject<HTMLParagraphElement | null>;
  videoContainerRef: React.MutableRefObject<HTMLDivElement | null>;
  session: Session | undefined;
  setIsFinish(isFinish: boolean): void;
  setSession(session: Session | undefined): void;
  leaveSession(isSucceedFlag: boolean): void;
  setSessionInfo(sessionInfo: { sessionId: string; token: string }): void;
  setLover(lover: string): void;
  setCapturedImage(capturedImage: string): void;
  setIsMatched(isMatched: boolean): void;
  setChoiceState(choiceState: string): void;
  setIsCanvasModalOpen(isOpen: boolean): void;
  setKeywordsIndex(index: number): void;
  setIsChosen(isChosen: boolean): void;
};

type cupidParams = {
  keywordRef: React.MutableRefObject<HTMLParagraphElement | null>;
  videoContainerRef: React.MutableRefObject<HTMLDivElement | null>;
  subscribers: StreamManager[];
  setOneToOneMode: (loverElement: HTMLDivElement, videoContainerRef: React.MutableRefObject<HTMLDivElement | null>) => void;
  toggleLoserAudio: (
    subscribers: StreamManager[],
    lover: string,
    isMute: boolean,
  ) => void;
  undoOneToOneMode: (loverElement: HTMLDivElement, params: oneToOneParams) => void;
  setIsChosen(isChosen: boolean): void;
};

type camEventParams = {
  keywordRef: React.MutableRefObject<HTMLParagraphElement | null>;
  publisher: Publisher | null;
  setIsOpenCam: React.Dispatch<React.SetStateAction<boolean>>;
};

type cupidResult = {
  lover: string;
  loser: Array<string>;
};

export const meetingEvent = (socket: Socket | null, params: meetingEventParams) => {
  const {
    sessionRef,
    pubRef,
    subRef,
    keywordRef,
    videoContainerRef,
    session,
    setIsFinish,
    setSession,
    leaveSession,
    setSessionInfo,
    setLover,
    setCapturedImage,
    setIsMatched,
    setChoiceState,
    setIsCanvasModalOpen,
    setKeywordsIndex,
    setIsChosen,
  } = params;

  const chooseParams = {
    keywordRef,
    subRef,
    setIsChosen,
  }

  socket?.on("keyword", message => {
    try {
      console.log("keyword Event: ", message);
      console.log("random user: ", message.getRandomParticipant);

      if (sessionRef.current) {
        sessionRef.current.classList.add("bg-black");
      }
      setTimeout(() => {
        pubRef.current?.classList.add("bright-5");
        subRef.current.forEach(sub => {
          sub?.classList.add("bright-5");
        });
      }, 500); // 0.5초 후 밝기 하락
      setTimeout(() => {
        if (keywordRef.current) {
          keywordRef.current.classList.add("text-white");
          keywordRef.current.innerText =
            "곧 한 참가자가 선택됩니다. 선택된 사람은 질문에 답변해주세요";
        }
      }, 2000);
      setTimeout(() => {
        randomKeywordEvent(
          parseInt(message.message),
          message.getRandomParticipant,
          pubRef.current as HTMLDivElement,
          subRef.current as HTMLDivElement[],
          {keywordRef, pubRef, subRef, videoContainerRef},
        );
        setTimeout(() => {
          if (sessionRef.current) {
            sessionRef.current.classList.remove("bg-black");
          }
          setTimeout(() => {
            pubRef.current?.classList.remove("bright-5");
            subRef.current.forEach(sub => {
              sub?.classList.remove("bright-5");
            });
            if (keywordRef.current) {
              keywordRef.current.classList.remove("text-white");
            }
          }, 500); // 0.5초 후 밝기 해제
        }, 21000); // 총 발표 시간
      }, 5000); // 어두워 지고 5초 후 이벤트 시작
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
      undoChooseMode(chooseParams); // 선택모드 해제
      removeChooseSign(); // 선택된 사람 표시 제거
      changeLoveStickMode(
        response.message as Array<chooseResult>,
        subRef.current as HTMLDivElement[],
        pubRef.current as HTMLDivElement,
        videoContainerRef.current as HTMLDivElement,
      );
      setTimeout(() => {
        console.log("원 위치로 변경");
        undoLoveStickMode(
          subRef.current as HTMLDivElement[],
          pubRef.current as HTMLDivElement,
          videoContainerRef.current as HTMLDivElement,
        );
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
      setChoiceState("first");
    } catch (e: any) {
      console.error(e);
    }
  });

  socket?.on("lastCupidTime", (response: any) => {
    try {
      console.log("lastCupidTime 도착", response);
      setChoiceState("last");
    } catch (e: any) {
      console.error(e);
    }
  });

  socket?.on("lastChooseResult", response => {
    try {
      console.log("lastChooseResult 도착");
      console.log("lastChooseResult = ", response);

      undoChooseMode(chooseParams); // 선택모드 해제
      removeChooseSign(); // 선택된 사람 표시 제거
      changeLoveStickMode(
        response.message as Array<chooseResult>,
        subRef.current as HTMLDivElement[],
        pubRef.current as HTMLDivElement,
        videoContainerRef.current as HTMLDivElement,
      );
      setTimeout(() => {
        console.log("원 위치로 변경");
        undoLoveStickMode(
          subRef.current as HTMLDivElement[],
          pubRef.current as HTMLDivElement,
          videoContainerRef.current as HTMLDivElement,
        );
        if (keywordRef.current) {
          keywordRef.current.innerText = "잠시 후 미팅이 종료됩니다";
        }
      }, 5000); // 5초 후 원 위치 (시연용)
    } catch (e: any) {
      console.error(e);
    }
  });

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
      const presentRefs = {
        keywordRef,
        pubRef,
        subRef,
        videoContainerRef,
      };

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
          presentRefs
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

export const meetingCupidResultEvent = (socket: Socket | null, refs: cupidParams) => {
  const {
    keywordRef,
    videoContainerRef,
    subscribers,
    setOneToOneMode,
    toggleLoserAudio,
    undoOneToOneMode,
    setIsChosen,
  } = refs;
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

          setOneToOneMode(loverElement, videoContainerRef);
          toggleLoserAudio(subscribers, lover, false); // 나머지 오디오 차단
          setTimeout(() => {
            if (keywordRef.current) {
              keywordRef.current.innerText = "";
              console.log("즐거운시간 삭제");
            }
            const params = {
              videoContainerRef,
              setIsChosen,
            }
            undoOneToOneMode(loverElement, params);
            toggleLoserAudio(subscribers, lover, true); // 나머지 오디오 재개
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
          toggleLoverAudio(subscribers, loser, false); // 매칭된 사람들 오디오 차단
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
          setTimeout(() => {
            if (keywordRef.current) {
              keywordRef.current.innerText = "";
            }
            toggleLoverAudio(subscribers, loser, true); // 오디오 재개
            // }, 60000); // 1분 후 음소거 해제
          }, 20000); //FIXME 시연용 20초 후 원 위치
        }
      }, 13000); // 결과 도착 후 13초뒤에 1:1 대화 진행
    } catch (e: any) {
      console.error(e);
    }
  });
};

export const meetingCamEvent = (socket: Socket | null, refs: camEventParams) => {
  const { keywordRef, publisher, setIsOpenCam } = refs;

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
          openCam(publisher as Publisher, setIsOpenCam);
        }
      }, 1000);
    } catch (e: any) {
      console.error(e);
    }
  });
};
