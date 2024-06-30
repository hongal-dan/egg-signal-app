"use client";
import React, { useRef, useState, useEffect } from "react";
import UserVideoComponent from "./UserVideo";
import FriendList from "./FriendList";
import Notifications from "./Notifications";
import io from "socket.io-client";
import { useRouter } from "next/navigation";

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

  const router = useRouter();

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
    socket.emit("cancel", { participantName: nickname });
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

  return (
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
      <UserVideoComponent />
      <div className="grid grid-rows-2">
        <label className="inline-flex items-center justify-center cursor-pointer">
          <input
            type="checkbox"
            value=""
            className="sr-only peer"
            checked={avatarOn}
          />
          <div 
            className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"
            onClick={toggleCamera}
          ></div>
          <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
            {avatarOn ? "아바타 off" : " 아바타 on"}
          </span>
        </label>
        <div>
          <button
            className="w-96 h-12 bg-amber-400 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center mb-1"
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
              <p className="w-full text-2xl font-bold">입장하기</p>
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
          className="w-48 h-10 flex items-center justify-center relative bg-amber-100 rounded-2xl shadow"
          onClick={toggleFriendList}
        >
          <p className="text-xl font-bold">친구</p>
        </button>
        {isFriendListVisible && (
          <div className="absolute bottom-[50px] right-1 bg-white shadow-md rounded-lg p-4 z-10">
            <FriendList onClose={() => setIsFriendListVisible(false)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MainContent;
