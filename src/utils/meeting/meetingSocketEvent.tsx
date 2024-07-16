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
};
