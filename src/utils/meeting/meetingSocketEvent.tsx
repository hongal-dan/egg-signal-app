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

};
