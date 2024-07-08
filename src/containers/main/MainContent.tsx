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
import {
  chatRoomState,
  newMessageSenderState,
  messageAlarmState,
} from "@/app/store/chat";
// import { logoutUser } from "@/services/auth";
import { Socket } from "socket.io-client";
import { testState } from "@/app/store/userInfo"; // FIXME 테스트용 랜덤 닉네임 저장, 배포 전에 삭제해야함
import { getUserInfo } from "@/services/users";
import { defaultSessionState } from "@/app/store/ovInfo";
import MainChat from "./chat/MainChat";

import Tutorial from "./tutorial/Tutorial";

// interface Friend {
//   friend: string;
//   chatRoomId: string;
//   newMessage: boolean;
// }

// interface MainContentProps {
//   userInfo: {
//     id: string;
//     nickname: string;
//     gender: "MALE" | "FEMALE";
//     newNotification: boolean;
//     notifications: string[];
//     friends: Friend[];
//   };
// }

// interface UserInfo {
//   id: string;
//   nickname: string;
//   gender: "MALE" | "FEMALE";
//   newNotification: boolean;
//   notifications: string[];
//   friends: Friend[];
// }

interface Notification {
  _id: string;
  from: string;
}

const MainContent = () => {
  const [, setTestName] = useRecoilState(testState); // FIXME 테스트용 랜덤 닉네임 저장, 배포 전에 삭제해야함

  const router = useRouter();
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
  const [messageAlarm, setMessageAlarm] = useRecoilState(messageAlarmState);
  const [openedChatRoomId, setOpenedChatRoomId] = useRecoilState(chatRoomState);
  const [, setOnlineList] = useRecoilState(onlineListState);
  const [notiList, setNotiList] = useRecoilState(notiListState);

  const [, setDefaultUserInfo] = useRecoilState(defaultSessionState);

  const checkOnlineFriends = () => {
    const onlineList = sessionStorage.getItem("onlineFriends");
    if (!onlineList || onlineList.length === 0) {
      return;
    }
    setOnlineList(JSON.parse(onlineList));
  };

  const updateUserInfo = async () => {
    console.log("updateUserInfo");
    const response = await getUserInfo(
      JSON.parse(localStorage.getItem("token")!),
    );
    const currentUser = {
      id: response.data.id,
      nickname: response.data.nickname,
      gender: response.data.gender,
      newNotification: response.data.newNotification,
      notifications: response.data.notifications,
      friends: response.data.friends,
    };
    setCurrentUser(currentUser);
  };

  // 새로고침 했을 때 메시지 알람 유지
  const checkNewMessage = () => {
    const messageSenders = sessionStorage.getItem("messageSenders");
    if (!messageSenders || messageSenders.length === 0) {
      return;
    }
    setNewMessageSenders(JSON.parse(messageSenders));
  };

  // 접속 안 한 동안 나한테 온 메시지가 있는지 확인
  const checkNewMessageAfterLogin = () => {
    const newSenders: string[] = [];
    currentUser.friends.map(friend => {
      if (friend.newMessage) {
        newSenders.push(friend.chatRoomId);
      }
    });
    if (newSenders.length !== 0) {
      sessionStorage.setItem("messageSenders", JSON.stringify(newSenders));
      setMessageAlarm(true);
    }
  };

  useEffect(() => {
    checkNewMessageAfterLogin();
    checkNewMessage();
  }, [currentUser]);

  useEffect(() => {
    console.log("MainContent useEffect");
    updateUserInfo();

    const newCommonSocket = io(`${url}/common`, {
      transports: ["websocket"],
      auth: { token: JSON.parse(localStorage.getItem("token")!) },
      // withCredentials: true,
    });
    setCommonSocket(newCommonSocket);

    newCommonSocket.on("connect", () => {
      console.log("common connected");
    });

    newCommonSocket.emit("serverCertificate");
    newCommonSocket.emit("friendStat");

    newCommonSocket.on("newMessageNotification", (res: string) => {
      console.log(res, "이가 나한테 메시지 보냄");
      const messageSenders = sessionStorage.getItem("messageSenders");
      if (!messageSenders || messageSenders.length === 0) {
        sessionStorage.setItem("messageSenders", JSON.stringify([res]));
      } else {
        const prevList = JSON.parse(messageSenders);
        prevList.push(res);
        const newList = Array.from(new Set(prevList)) as string[]; // 동일한 알람 제거
        sessionStorage.setItem("messageSenders", JSON.stringify(newList));
      }
      setNewMessageSenders(prev => [...prev, res]);
    });

    newCommonSocket.on("friendOnline", (res: string) => {
      console.log("온라인 유저: ", res);
      const onlineList = sessionStorage.getItem("onlineFriends");
      if (!onlineList || onlineList.length === 0) {
        sessionStorage.setItem("onlineFriends", JSON.stringify([res]));
      } else {
        const prevList = JSON.parse(onlineList);
        prevList.push(res);
        const newList = Array.from(new Set(prevList)) as string[];
        console.log(newList);
        sessionStorage.setItem("onlineFriends", JSON.stringify(newList));
        setOnlineList(newList);
      }
    });

    newCommonSocket.on("friendOffline", (res: string) => {
      console.log(res, "접속 종료");
      const onlineList = sessionStorage.getItem("onlineFriends");
      if (onlineList) {
        const prevList = JSON.parse(onlineList);
        const newList = prevList.filter((el: string) => el !== res);
        console.log(newList);
        sessionStorage.setItem("onlineFriends", JSON.stringify(newList));
        setOnlineList(newList);
      }
    });

    newCommonSocket.emit("reqGetNotifications");

    newCommonSocket.on("resGetNotifications", (res: Notification[]) => {
      console.log("내 알람?", res);
      const newNotiList = res.map((r: Notification) => {
        return {
          _id: r._id,
          from: r.from,
        };
      });
      setNotiList(newNotiList);
    });

    newCommonSocket.on("newFriendRequest", res => {
      console.log("새로운 친구 요청", res);
      const newNoti = { _id: res._id, from: res.userNickname }; // 나한테 요청 보낸 친구
      setNotiList(prev => [...prev, newNoti]);
    });

    newCommonSocket.on("resAcceptFriend", res => {
      console.log("내가 상대방 요청 수락!! ", res);
      updateUserInfo();
      // const updateCurrentUser = {
      //   id: res.id,
      //   nickname: res.nickname,
      //   gender: res.gender,
      //   newNotification: res.newNotification,
      //   notifications: res.notifications,
      //   friends: res.friends,
      // };
      // console.log(updateCurrentUser);
      // setCurrentUser(updateCurrentUser);
      // window.location.reload();
    });

    newCommonSocket.on("friendRequestAccepted", res => {
      console.log("상대방이 내 요청 수락!! ", res);
      updateUserInfo();
      // setCurrentUser(prevState => ({
      //   ...prevState,
      //   friends: [...prevState.friends, ...res.friends],
      // }));
    });

    // 내가 접속하기 전부터 접속한 친구 확인용
    newCommonSocket.on("friendStat", res => {
      const onlineList = sessionStorage.getItem("onlineFriends");
      if (!onlineList || onlineList.length === 0) {
        const newList: string[] = [];
        res.forEach((el: any) => {
          const key = Object.keys(el)[0];
          if (el[key]) {
            newList.push(key);
          }
        });
        console.log("friend state new List!!", newList);
        setOnlineList(newList);
        sessionStorage.setItem("onlineFriends", JSON.stringify(newList));
      } else {
        const prevList = JSON.parse(onlineList);
        res.forEach((el: any) => {
          const key = Object.keys(el)[0];
          if (el[key]) {
            prevList.push(key);
          }
        });
        const newList = Array.from(new Set(prevList)) as string[];
        console.log("update online list: ", newList);
        sessionStorage.setItem("onlineFriends", JSON.stringify(newList));
        setOnlineList(newList);
      }
    });
  }, []);

  const connectSocket = async () => {
    return new Promise(resolve => {
      const newSocket = io(`${url}/meeting`, {
        transports: ["websocket"],
        // withCredentials: true,
        auth: { token: JSON.parse(localStorage.getItem("token")!) },
      });
      newSocket.on("connect", () => {
        setSocket(newSocket);
        resolve(newSocket);
      });
    });
  };

  type ovInfo = {
    sessionId: string;
    token: string;
    participantName: string;
  };

  const randomNum = Math.floor(Math.random() * 1000).toString(); // 테스트용 익명 닉네임 부여
  const handleLoadingOn: React.MouseEventHandler<
    HTMLButtonElement
  > = async () => {
    const meetingSocket = (await connectSocket()) as Socket | null;
    console.log("socket: ", meetingSocket);
    console.log("currentUser: ", currentUser);
    console.log("testName", currentUser.nickname + "-" + randomNum);
    meetingSocket?.emit("ready", {
      participantName: `${currentUser.nickname}-${randomNum}`,
      gender: currentUser.gender,
    });
    if (startButton.current) startButton.current.disabled = true;
    setIsLoading(true);
    meetingSocket?.on("startCall", async (ovInfo: ovInfo) => {
      console.log(ovInfo);
      setTestName(ovInfo.participantName); // FIXME 테스트용 랜덤 닉네임 저장, 배포 전에 삭제해야함
      setDefaultUserInfo({
        sessionId: ovInfo.sessionId,
        token: ovInfo.token,
        participantName: ovInfo.participantName,
      }); // FIXME 배포용은 participantName 삭제해야함;
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
      participantName: `${currentUser.nickname}-${randomNum}`,
      gender: currentUser.gender,
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
      // await logoutUser();
      localStorage.removeItem("token");
      sessionStorage.removeItem("onlineFriends");
      commonSocket?.disconnect();
      window.location.reload();
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

  return (
    <div>
      <button
        className="fixed top-4 right-4 z-10 border-b border-gray-500 text-gray-500"
        onClick={handleLogout}
      >
        Log out
      </button>
      <div className="grid grid-cols-3 md:h-screen">
        <div className="flex justify-center items-center">
          <Tutorial />
          <MainChat />
        </div>
        <div className="grid grid-rows-3 justify-center md:h-screen">
          <div className="w-full flex items-end justify-end gap-[10px] mb-5">
            <div className="w-10 h-10 relative flex items-center justify-center text-xl bg-white rounded-2xl shadow">
              {notiList.length !== 0 && (
                <div className="absolute left-[-5px] top-[-5px] w-4 h-4 rounded-full bg-rose-500" />
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
        </div>
      </div>
      <div className="z-10 absolute bottom-10 right-10">
        <button
          className="relative w-48 h-10 flex items-center justify-center bg-amber-100 rounded-2xl shadow"
          onClick={toggleFriendList}
        >
          {(messageAlarm ||
            (newMessageSenders && newMessageSenders.length !== 0)) && (
            <div className="absolute left-[-5px] top-[-5px] w-4 h-4 rounded-full bg-rose-500" />
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
  );
};

export default MainContent;
