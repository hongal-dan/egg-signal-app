"use client";

import React, { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useRecoilValue, useRecoilState } from "recoil";
import { Session, Publisher, StreamManager } from "openvidu-browser";
import "animate.css";
import {
  chooseState,
  meetingSocketState,
  isChosenState,
} from "@/app/store/socket";
import { avatarState } from "@/app/store/avatar";
import { userState } from "@/app/store/userInfo";
import { defaultSessionState, winnerSessionState } from "@/app/store/ovInfo";
import UserVideoComponent from "@/containers/meeting/UserVideoComponent";
import ARComponent from "@/containers/main/UserVideo";
import {
  captureCamInit,
  setChooseMode,
  setOneToOneMode,
  speakingStyle,
  undoOneToOneMode,
} from "@/utils/meeting/meetingUtils";
import {
  joinSession,
  toggleLoserAudio,
  getUserID,
  getUserGender,
  sortSubscribers,
  leaveHandler,
  getNetworkInfo,
  getVideoConstraints,
  updatePublisherStream,
  getSystemPerformance,
} from "@/utils/meeting/openviduUtils";
import { meetingCamEvent, meetingCupidResultEvent, meetingEvent, OffSocketEvent } from "@/utils/meeting/meetingSocketEvent";
import MikeMuteButton from "@/containers/meeting/MikeMuteButton";

const DynamicAvatarCollection = dynamic(
  () => import("@/containers/main/AvatarCollection"),
  { ssr: false },
);

const DynamicCanvasModal = dynamic(
  () => import("@/containers/meeting/CanvasModal"),
  { ssr: false },
);

const DynamicMatchingResult = dynamic(
  () => import("@/containers/meeting/MatchingResult"),
  { ssr: false },
);

const DynamicEggTimer = dynamic(() => import("@/containers/meeting/EggTimer"), {
  ssr: false,
});

const DynamicMeetingLoading = dynamic(
  () => import("@/containers/meeting/MeetingLoading"),
  { ssr: false },
);

const DynamicEmoji = dynamic(() => import("@/containers/meeting/emoji"), {
  ssr: false,
});

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
  const subRef = useRef<Array<HTMLDivElement>>([]);
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
  const [choiceState, setChoiceState] = useRecoilState(chooseState);
  const [lover, setLover] = useState<string>("");

  const { sessionId, token } =
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

    const preventGoBack = () => {
      history.pushState(null, "", location.href);
      leaveHandler(leaveSession);
      setSubscribers([]); // 리렌더링용
    };
    history.pushState(null, "", location.href);
    window.addEventListener("popstate", preventGoBack);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", preventGoBack);
      console.log("메인이 종료되었습니다.");
    };
  }, []);

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
    setChoiceState("");
    setIsChosen(false);
    OffSocketEvent(socket);

    if (!isSucceedFlag) {
      router.push("/main");
      return;
    } else {
      router.push("/meeting/matching");
      return;
    }
  };

  useEffect(() => {
    if (!choiceState) {
      return;
    }
    const chooseModeParams = {
      socket,
      nickname: userInfo.nickname,
      subRef,
      keywordRef,
      setIsChosen,
      choiceState,
      chooseTimerRef,
    };
    setChooseMode(chooseModeParams);
  }, [choiceState]);

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
    const updateNetwork = setInterval(() => {
      const networkInfo = getNetworkInfo();
      const systemInfo = getSystemPerformance();
      if (networkInfo) {
        const newConstraints = getVideoConstraints(networkInfo, systemInfo);
        updatePublisherStream(publisher, newConstraints);
      }
    }, 5000);

    const camEventParams = {
      keywordRef,
      publisher,
      setIsOpenCam,
    }
    meetingCamEvent(socket, camEventParams);

    return () => clearInterval(updateNetwork);
  }, [publisher]);

  useEffect(() => {
    console.log("subscribers", subscribers);
    if (!subscribers) {
      return;
    }
    const cupidParams = {
      keywordRef,
      videoContainerRef,
      subscribers,
      setOneToOneMode,
      toggleLoserAudio,
      undoOneToOneMode,
      setIsChosen,
    }

    if (subscribers.length === 5) {
      if (getUserGender(publisher!) === "MALE") {
        sortSubscribers("MALE", subscribers, setSortedSubscribers);
      } else {
        sortSubscribers("FEMALE", subscribers, setSortedSubscribers);
      }
      setIsFull(true);
      socket?.emit("startTimer", { sessionId: sessionId });
      meetingCupidResultEvent(socket, cupidParams);
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
    joinSession({
      token,
      userInfo,
      captureRef: captureRef.current!,
      sessionId,
      setSession,
      setPublisher,
      setSubscribers,
      setSpeakingPublisherIds,
    });

    const meetingEventParams = {
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
    };

    meetingEvent(socket, meetingEventParams);

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

  return !avatar ? (
    <DynamicAvatarCollection />
  ) : !isFinish ? (
    <>
      {!isFull ? (
        <DynamicMeetingLoading ref={loadingRef} />
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
                onClick={() => leaveHandler(leaveSession)}
                value="종료하기"
              />
            </div>
            <DynamicEggTimer setTime={5} />
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
            <div
              className="relative col-md-6 video-container"
              ref={videoContainerRef}
            >
              {publisher !== undefined ? (
                <div
                  className={`stream-container col-md-6 col-xs-6 pub custom-shadow ${getUserGender(publisher)}`}
                  id={getUserID(publisher)}
                  ref={pubRef}
                  style={speakingStyle(publisher, speakingPublisherIds)}
                >
                  <UserVideoComponent
                    streamManager={publisher}
                  />
                </div>
              ) : null}
              {sortedSubscribers.map((sub, idx) => (
                <div
                  key={sub.stream.streamId}
                  data-key={sub.stream.streamId}
                  className={`stream-container col-md-6 col-xs-6 sub custom-shadow ${getUserGender(sub)}`}
                  id={getUserID(sub)}
                  ref={el => {
                    (subRef.current as (HTMLDivElement | null)[])[idx] = el;
                  }}
                  style={speakingStyle(sub, speakingPublisherIds)}
                >
                  <UserVideoComponent
                    key={sub.stream.streamId}
                    streamManager={sub}
                  />
                </div>
              ))}
            </div>
            <div className="fixed bottom-3 left-0 right-0 flex justify-center">
              <div className="relative bg-white p-2 rounded-lg shadow-md">
                <DynamicEmoji />
                <MikeMuteButton publisher={publisher} />
              </div>
            </div>
          </div>
        </div>
      )}
      {isCanvasModalOpen && (
        <DynamicCanvasModal
          onClose={() => setIsCanvasModalOpen(false)}
          keywordsIndex={keywordsIndex}
        />
      )}
      {!isOpenCam ? (
        <div ref={captureRef} className="hidden">
          <ARComponent />
        </div>
      ) : null}
    </>
  ) : (
    <>
      {isFinish ? (
        <DynamicMatchingResult
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
