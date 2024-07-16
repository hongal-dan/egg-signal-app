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

};
