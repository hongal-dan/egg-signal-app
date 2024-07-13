"use client";

import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { useRecoilState } from "recoil";
import {
  commonSocketState,
  notiListState,
  onlineListState,
} from "@/app/store/commonSocket";
import { isChosenState } from "@/app/store/socket";
import { userState } from "@/app/store/userInfo";
import { newMessageSenderState, messageAlarmState } from "@/app/store/chat";
import { getUserInfo } from "@/services/users";
import MainChat from "./chat/MainChat";
import Tutorial from "./tutorial/Tutorial";
import Logout from "./button/Logout";
import WebcamDisplay from "./WebcamDisplay";
import EnterButton from "./button/EnterButton";
import FriendButton from "./button/FriendButton";
import NotificationButton from "./button/NotificationsButton";

interface Notification {
  _id: string;
  from: string;
}

const MainContent = () => {
  const [isFriendListVisible, setIsFriendListVisible] =
    useState<boolean>(false);
  const [isNotiVisible, setIsNotiVisible] = useState<boolean>(false);
  const [commonSocket, setCommonSocket] = useRecoilState(commonSocketState);
  const [currentUser, setCurrentUser] = useRecoilState(userState);
  const [, setNewMessageSenders] = useRecoilState(newMessageSenderState);
  const [, setMessageAlarm] = useRecoilState(messageAlarmState);
  const [, setOnlineList] = useRecoilState(onlineListState);
  const [notiList, setNotiList] = useRecoilState(notiListState);
  const [chatExpanded, setChatExpanded] = useState(false);
  const [, setIsChosen] = useRecoilState(isChosenState);

  const checkOnlineFriends = () => {
    const onlineList = sessionStorage.getItem("onlineFriends");
    if (!onlineList || onlineList.length === 0) {
      return;
    }
    setOnlineList(JSON.parse(onlineList));
  };

  const updateUserInfo = async () => {
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

  const toggleFriendList = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsFriendListVisible(prev => !prev);
    if (isNotiVisible) {
      setIsNotiVisible(false);
    }
  };

  const toggleNotiList = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsNotiVisible(prev => !prev);
    if (isFriendListVisible) {
      setIsFriendListVisible(false);
    }
  };

  const handleMainContentClick = () => {
    setIsFriendListVisible(false);
    setIsNotiVisible(false);
    if (chatExpanded) {
      setChatExpanded(false);
    }
  };

  useEffect(() => {
    checkNewMessageAfterLogin();
    checkNewMessage();
  }, [currentUser]);

  useEffect(() => {
    setIsChosen(false); // cupid 선택 여부 false 초기화
    updateUserInfo();
    checkOnlineFriends();

    const newCommonSocket = io(`${process.env.NEXT_PUBLIC_API_SERVER}/common`, {
      transports: ["websocket"],
      auth: { token: JSON.parse(localStorage.getItem("token")!) },
    });
    setCommonSocket(newCommonSocket);

    newCommonSocket.on("connect", () => {
      console.log("common connected");
    });

    newCommonSocket.emit("serverCertificate");
    newCommonSocket.emit("friendStat");

    newCommonSocket.on("newMessageNotification", (res: string) => {
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
      const onlineList = sessionStorage.getItem("onlineFriends");
      if (!onlineList || onlineList.length === 0) {
        sessionStorage.setItem("onlineFriends", JSON.stringify([res]));
      } else {
        const prevList = JSON.parse(onlineList);
        prevList.push(res);
        const newList = Array.from(new Set(prevList)) as string[];
        sessionStorage.setItem("onlineFriends", JSON.stringify(newList));
        setOnlineList(newList);
      }
    });

    newCommonSocket.on("friendOffline", (res: string) => {
      const onlineList = sessionStorage.getItem("onlineFriends");
      if (onlineList) {
        const prevList = JSON.parse(onlineList);
        const newList = prevList.filter((el: string) => el !== res);
        sessionStorage.setItem("onlineFriends", JSON.stringify(newList));
        setOnlineList(newList);
      }
    });

    newCommonSocket.emit("reqGetNotifications");

    newCommonSocket.on("resGetNotifications", (res: Notification[]) => {
      const newNotiList = res.map((r: Notification) => {
        return {
          _id: r._id,
          from: r.from,
        };
      });
      setNotiList(newNotiList);
    });

    newCommonSocket.on("newFriendRequest", res => {
      const newNoti = { _id: res._id, from: res.userNickname }; // 나한테 요청 보낸 친구
      setNotiList(prev => [...prev, newNoti]);
    });

    newCommonSocket.on("resAcceptFriend", res => {
      updateUserInfo();
    });

    newCommonSocket.on("friendRequestAccepted", res => {
      updateUserInfo();
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
        sessionStorage.setItem("onlineFriends", JSON.stringify(newList));
        setOnlineList(newList);
      }
    });
  }, []);

  return (
    <>
      <Tutorial />
      <MainChat chatExpanded={chatExpanded} setChatExpanded={setChatExpanded} />
      <Logout commonSocket={commonSocket} />
      <div
        onClick={handleMainContentClick}
        className="h-full flex items-center justify-center min-w-[368px]"
      >
        <div className="w-full flex justify-center items-center">
          <div className="flex flex-col items-center">
            <div className="flex justify-end w-full mb-2">
              <NotificationButton
                isNotiVisible={isNotiVisible}
                notiList={notiList}
                toggleNotiList={toggleNotiList}
              />
            </div>
            <WebcamDisplay />
            <EnterButton />
          </div>
        </div>
        <FriendButton
          isFriendListVisible={isFriendListVisible}
          toggleFriendList={toggleFriendList}
        />
      </div>
    </>
  );
};

export default MainContent;
