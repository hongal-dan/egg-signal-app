"use client";

import React, { useRef, useState, useEffect } from "react";
import FriendList from "./chat/FriendList";
import Notifications from "./Notifications";
import io from "socket.io-client";
import { useRouter } from "next/navigation";
import { useRecoilState } from "recoil";
import { meetingSocketState } from "@/app/store/socket";
import {
  commonSocketState,
  notiListState,
  onlineListState,
} from "@/app/store/commonSocket";
import { userState } from "@/app/store/userInfo";
import { chatRoomState, newMessageSenderState } from "@/app/store/chat";
import { logoutUser } from "@/services/auth";
import { Socket } from "socket.io-client";
import { testState } from "@/app/store/userInfo"; // FIXME 테스트용 랜덤 닉네임 저장, 배포 전에 삭제해야함

interface Friend {
  friend: string;
  chatRoomId: string;
  newMessage: boolean;
}

interface MainContentProps {
  userInfo: {
    id: string;
    nickname: string;
    gender: "MALE" | "FEMALE";
    newNotification: boolean;
    notifications: string[];
    friends: Friend[];
  };
}

interface Notification {
  _id: string;
  from: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

const MainContent = ({ userInfo }: MainContentProps) => {
  const [, setTestName] = useRecoilState(testState); // FIXME 테스트용 랜덤 닉네임 저장, 배포 전에 삭제해야함

  const router = useRouter();
  // const [avatarOn, setAvatarOn] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFriendListVisible, setIsFriendListVisible] =
    useState<boolean>(false);
  const [isNotiVisible, setIsNotiVisible] = useState<boolean>(false);
  const startButton = useRef<HTMLButtonElement>(null);
  const url = process.env.NEXT_PUBLIC_API_SERVER;

  const [socket, setSocket] = useRecoilState(meetingSocketState);
  const [commonSocket, setCommonSocket] = useRecoilState(commonSocketState);
  const [currentUser, setCurrentUser] = useRecoilState(userState);
  const enterBtnRef = useRef<HTMLParagraphElement>(null);
  const [isEnterLoading, setIsEnterLoading] = useState<boolean>(false);
  const [newMessageSenders, setNewMessageSenders] = useRecoilState(
    newMessageSenderState,
  );
  const [openedChatRoomId, setOpenedChatRoomId] = useRecoilState(chatRoomState);
  const [, setOnlineList] = useRecoilState(onlineListState);
  const [notiList, setNotiList] = useRecoilState(notiListState);

  const checkOnlineFriends = () => {
    const onlineList = localStorage.getItem("onlineFriends");
    if (!onlineList || onlineList.length === 0) {
      return;
    }
    setOnlineList(JSON.parse(onlineList));
  };

  // 내가 접속하지 않은 동안 온 메시지가 있으면 알람 표시
  const checkNewMessage = () => {
    if (userInfo.friends) {
      const senders: string[] = [];
      userInfo.friends.map(f => {
        if (f.newMessage) {
          senders.push(f.chatRoomId);
        }
      });
      setNewMessageSenders(senders);
    }
  };

  useEffect(() => {
    setCurrentUser(userInfo);
  }, []);

  useEffect(() => {
    console.log("MainContent: ", currentUser);
    const newCommonSocket = io(`${url}/common`, {
      transports: ["websocket"],
      withCredentials: true,
    });
    setCommonSocket(newCommonSocket);

    newCommonSocket.on("connect", () => {
      newCommonSocket.emit("serverCertificate");
      console.log("common connected");
    });

    checkNewMessage();
    newCommonSocket.on("newMessageNotification", res => {
      console.log(res);
      if (newMessageSenders === null) {
        setNewMessageSenders([res]);
      } else {
        setNewMessageSenders([...res]);
      }
    });

    newCommonSocket.on("friendOnline", (res: string) => {
      console.log("온라인 유저: ", res);
      const onlineList = localStorage.getItem("onlineFriends");
      if (!onlineList || onlineList.length === 0) {
        localStorage.setItem("onlineFriends", JSON.stringify([res]));
      } else {
        const prevList = JSON.parse(onlineList);
        prevList.push(res);
        const newList = Array.from(new Set(prevList)) as string[];
        localStorage.setItem("onlineFriends", JSON.stringify(newList));
        setOnlineList(newList);
      }
    });

    newCommonSocket.on("friendOffline", (res: string) => {
      console.log(res, "접속 종료");
      const onlineList = localStorage.getItem("onlineFriends");
      if (onlineList) {
        const prevList = JSON.parse(onlineList);
        const newList = prevList.filter((el: string) => el !== res);
        console.log(newList);
        localStorage.setItem("onlineFriends", JSON.stringify(newList));
        setOnlineList(newList);
      }
    });

    newCommonSocket.emit("reqGetNotifications");

    newCommonSocket.on("resGetNotifications", (res: Notification) => {
      console.log("내 알람?", res);
      // const newNotiList = res
      // console.log(newNotiList);
      setNotiList([...notiList, res]);
    });

    newCommonSocket.on("newFriendRequest", res => {
      console.log("새로운 친구 요청", res);
      const newNoti = res.userNickname; // 나한테 요청 보낸 친구
      setNotiList(prev => [...prev, newNoti]);
    });

    newCommonSocket.on("resAcceptFriend", res => {
      console.log("내가 상대방 요청 수락!! ", res);
      const updateCurrentUser = {
        id: res.id,
        nickname: res.nickname,
        gender: res.gender,
        newNotification: res.newNotification,
        notifications: res.notifications,
        friends: res.friends,
      };
      console.log(updateCurrentUser);
      setCurrentUser(updateCurrentUser);
      window.location.reload();
    });

    newCommonSocket.on("friendRequestAccepted", res => {
      console.log("상대방이 내 요청 수락!! ", res);
      setCurrentUser(prevState => ({
        ...prevState,
        friends: [...prevState.friends, ...res.friends],
      }));
    });
  }, []);

  const connectSocket = async () => {
    return new Promise((resolve) => {
      const newSocket = io(`${url}/meeting`, {
        transports: ["websocket"],
      });
      newSocket.on("connect", () => {
        setSocket(newSocket);
        resolve(newSocket);
      });
    });
  };

  const randomNum = Math.floor(Math.random() * 1000).toString(); // 테스트용 익명 닉네임 부여
  const handleLoadingOn: React.MouseEventHandler<HTMLButtonElement> = async () => {
    const meetingSocket = await connectSocket() as Socket | null;
    setTestName(`${userInfo.nickname}-${randomNum}`); // FIXME 테스트용 랜덤 닉네임 저장, 배포 전에 삭제해야함
    console.log("socket: ", meetingSocket);
    meetingSocket?.emit("ready", {
      participantName: `${userInfo.nickname}-${randomNum}`,
      gender: userInfo.gender,
    });
    if (startButton.current) startButton.current.disabled = true;
    setIsLoading(true);
    meetingSocket?.on("startCall", async ovInfo => {
      console.log(ovInfo);
      sessionStorage.setItem("ovInfo", JSON.stringify(ovInfo)); // 세션 스토리지에 저장
      setIsLoading(false);
      setIsEnterLoading(true);
      router.push(`/meeting/${ovInfo.sessionId}`);
      setTimeout(() => {
        setIsEnterLoading(false);
      }, 2000);
    });
  };

  const handleLoadingCancel = () => {
    socket?.emit("cancel", {
      participantName: `${userInfo.nickname}-${randomNum}`,
    }); // 테스트용 익명 닉네임 부여
    if (startButton.current) startButton.current.disabled = false;
    setIsLoading(false);
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
      commonSocket?.disconnect();
      router.push("/login");
    } catch (error) {
      console.error("Log out Error: ", error);
    }
  };

  useEffect(() => {
    startWebCam();
    checkOnlineFriends();
  }, []);

  useEffect(() => {
    if (isEnterLoading && enterBtnRef.current) {
      enterBtnRef.current.innerText = "입장 중입니다.";
    }
  }, [isEnterLoading]);

  useEffect(() => {
    if (!isFriendListVisible) {
      if (openedChatRoomId !== null) {
        console.log("closeChat: ", openedChatRoomId);
        commonSocket?.emit("closeChat", { chatRoomdId: openedChatRoomId });
        setOpenedChatRoomId(null);
      }
    }
  }, [isFriendListVisible]);

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
            {notiList.length !== 0 && (
              <div className="absolute left-[-5px] top-[-5px] w-4 h-4 rounded-full bg-red-600" />
            )}
            <button onClick={toggleNotiList}>🔔</button>
            {isNotiVisible && (
              <div className="w-[340px] h-[500px] absolute top-0 left-[50px] bg-zinc-200 shadow-md rounded-lg p-4 z-10">
                <Notifications />
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
            {newMessageSenders?.length !== 0 && newMessageSenders && (
              <div className="absolute left-[-5px] top-[-5px] w-5 h-5 rounded-full bg-red-600" />
            )}
            <p className="text-xl font-bold">친구</p>
          </button>
          {isFriendListVisible && (
            <div className="absolute bottom-[50px] right-1 bg-white shadow-md rounded-lg p-4 z-10">
              <FriendList friendsList={currentUser.friends} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainContent;
