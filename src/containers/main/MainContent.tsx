"use client";

import React, { useRef, useState, useEffect } from "react";
import FriendList from "./chat/FriendList";
import Notifications from "./Notifications";
import io from "socket.io-client";
import { useRouter } from "next/navigation";
import { useRecoilState } from "recoil";
import { meetingSocketState } from "@/app/store/socket";
import { userState } from "@/app/store/userInfo";
import { logoutUser } from "@/services/auth";
import { useCommonSocket } from "@/contexts/CommonSocketContext";

interface Friend {
  friend: string;
  chatRoomId: string;
  newMessage: boolean;
}

interface MainContentProps {
  // userId: string;
  nickname: string;
}

const MainContent = ({nickname}: MainContentProps) => {
  const [avatarOn, setAvatarOn] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFriendListVisible, setIsFriendListVisible] =
    useState<boolean>(false);
  const [isNotiVisible, setIsNotiVisible] = useState<boolean>(false);
  const startButton = useRef<HTMLButtonElement>(null);
  const socket = io("http://localhost:5002/meeting", {
    transports: ["websocket"],
  });
  // const [OVInfo, setOVInfo] = useState<OVInfo>({
  //   sessionId: "",
  //   token: "",
  //   participantName: "",
  // });

  const [socket, setSocket] = useRecoilState(meetingSocketState);
  const [, setCurrentUser] = useRecoilState(userState);
  setCurrentUser(userInfo);
  const enterBtnRef = useRef<HTMLParagraphElement>(null);
  const [isEnterLoading, setIsEnterLoading] = useState<boolean>(false);
  const [newMessage, setNewMessage] = useState<boolean>(false);
  const [newMessageSenders, setNewMessageSenders] = useState<string[]>([]);

  useEffect(() => {
    if (!socket) {
      const newSocket = io(`${url}/meeting`, {
        transports: ["websocket"],
      });
      setSocket(newSocket);
    }
  }, [socket, setSocket]);

  const toggleCamera = () => {
    const canvas = document.querySelector("canvas");
    console.log(canvas);
    if (canvas && avatarOn) {
      canvas.style.display = "none";
      setAvatarOn(false);
      return;
    }
    if (canvas) {
      canvas.style.display = "block";
      setAvatarOn(true);
    }
  };

  const randomNum = Math.floor(Math.random() * 1000).toString(); // 테스트용 익명 닉네임 부여
  const handleLoadingOn: React.MouseEventHandler<HTMLButtonElement> = () => {
    socket?.emit("ready", {
      participantName: `${userInfo.nickname}-${randomNum}`,
    });
    if (startButton.current) startButton.current.disabled = true;
    setIsLoading(true);
    socket.on("startCall", async ovInfo => {
      console.log(ovInfo);
      // setOVInfo(ovInfo);
      sessionStorage.setItem('ovInfo', JSON.stringify(ovInfo)); // 세션 스토리지에 저장
      // sessionStorage.setItem('session', JSON.stringify(socket));
      setIsLoading(false);
      router.push(`/meeting/${ovInfo.sessionId}`);
    });
  };

  const handleLoadingCancel = () => {
    socket?.emit("cancel", {
      participantName: `${userInfo.nickname}-${randomNum}`,
    }); // 테스트용 익명 닉네임 부여
    if (startButton.current) startButton.current.disabled = false;
    setIsLoading(false);
    // todo: 매칭 취소 api 요청
  };

  const toggleFriendList = () => {
    setIsFriendListVisible(prev => !prev);
  };

  const toggleNotiList = () => {
    setIsNotiVisible(prev => !prev);
  };

  const startWebCam = async () => {
    try {
      const constraints = {
        video: true,
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const video = document.getElementById("myCam");
      if (video && video instanceof HTMLVideoElement) {
        video.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing the webcam: ", error);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      router.push("/login");
    } catch (error) {
      console.error("Log out Error: ", error);
    }
  };

  useEffect(() => {
    startWebCam();
  }, []);

  useEffect(() => {
    if (isEnterLoading && enterBtnRef.current) {
      enterBtnRef.current.innerText = "입장 중입니다.";
    }
  }, [isEnterLoading]);

  useEffect(() => {
    if (commonSocket) {
      commonSocket.on("newMessageNotification", res => {
        console.log(res);
        setNewMessageSenders(prev => [...prev, res]);
        setNewMessage(true);
      });
    }
  }, [commonSocket]);

  // return avatar == null ? (
  //   <AvatarCollection />
  // ) :
  return (
    <div>
      <button
        className="fixed top-4 right-4 z-10 border-b border-gray-500 text-gray-500"
        onClick={handleLogout}
      >
        Log out
      </button>
      <div className="grid grid-rows-3 justify-center px-6 py-8 md:h-screen">
        <div className="w-full flex items-end justify-end gap-[10px] mb-5">
          <div className="w-10 h-10 flex items-center justify-center text-xl bg-white rounded-2xl shadow">
            <button>🚨</button>
          </div>
          <div className="w-10 h-10 relative flex items-center justify-center text-xl bg-white rounded-2xl shadow">
            <button onClick={toggleNotiList}>🔔</button>
            {isNotiVisible && (
              <div className="w-[340px] h-[500px] absolute top-0 left-[50px] bg-zinc-200 shadow-md rounded-lg p-4 z-10">
                <Notifications onClose={() => setIsNotiVisible(false)} />
              </div>
            )}
          </div>
        </div>
        <video
          id="myCam"
          className="mx-auto w-[320px] h-[240px]"
          autoPlay
          playsInline
        ></video>
        <div className="grid grid-rows-2">
          <div>
            <button
              className="w-full h-12 bg-amber-400 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center mb-1 z-10 relative"
              ref={startButton}
              onClick={handleLoadingOn}
            >
              {isLoading ? (
                <svg
                  className="animate-spin h-5 w-5 mr-3 text-white inline-block"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 2.42.936 4.635 2.464 6.291l1.536-1.536z"
                  ></path>
                </svg>
              ) : (
                <p className="w-full text-2xl font-bold" ref={enterBtnRef}>
                  입장하기
                </p>
              )}
            </button>
            {isLoading && (
              <div className="flex justify-end underline text-sm text-gray-900">
                <button onClick={handleLoadingCancel}>매칭 취소</button>
              </div>
            )}
          </div>
        </div>
        <div className="z-10 absolute bottom-10 right-10">
          <button
            className="relative w-48 h-10 flex items-center justify-center bg-amber-100 rounded-2xl shadow"
            onClick={toggleFriendList}
          >
            {newMessage && (
              <div className="absolute left-[-5px] top-[-5px] w-5 h-5 rounded-full bg-red-600" />
            )}
            <p className="text-xl font-bold">친구</p>
          </button>
          {isFriendListVisible && (
            <div className="absolute bottom-[50px] right-1 bg-white shadow-md rounded-lg p-4 z-10">
              <FriendList
                onClose={() => setIsFriendListVisible(false)}
                newMessageSenders={newMessageSenders}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainContent;
