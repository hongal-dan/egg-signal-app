"use client";
import React, { useEffect, useState } from "react";
import Friend from "./Friend";
import Chat from "./Chat";
import { commonSocketState, onlineListState } from "@/app/store/commonSocket";
import { newMessageSenderState } from "@/app/store/chat";
import { useRecoilState, useRecoilValue } from "recoil";

interface Friend {
  friend: string;
  chatRoomId: string;
}

interface FriendListPros {
  friendsList: Friend[];
}

interface FriendState {
  [key: string]: boolean;
}

const FriendList: React.FC<FriendListPros> = ({ friendsList }) => {
  const commonSocket = useRecoilValue(commonSocketState);
  const newMessageSenders = useRecoilValue(newMessageSenderState);
  const [onlineList, setOnlineList] = useRecoilState(onlineListState);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [isChatVisible, setIsChatVisible] = useState<boolean>(false);

  const toggleChat = (friend: Friend) => {
    setSelectedFriend(friend);
    setIsChatVisible(prev => {
      if (prev === true) {
        console.log("closeChat: ", selectedFriend?.chatRoomId);
        commonSocket?.emit("closeChat", {
          chatRoomdId: selectedFriend?.chatRoomId,
        });
      }
      return !prev;
    });
  };

  const closeChat = () => {
    if (commonSocket) {
      const chatRoomId = selectedFriend?.chatRoomId;
      console.log(chatRoomId);
      commonSocket.emit("closeChat", { chatRoomdId: chatRoomId });
    }
    setSelectedFriend(null);
    setIsChatVisible(false);
  };

  const checkFriendOnline = (friendNickName: string) => {
    return onlineList.includes(friendNickName);
  };

  useEffect(() => {
    if (commonSocket) {
      // 내가 접속하기 전부터 접속한 친구 확인용
      commonSocket.on("friendStat", res => {
        console.log("friend state: ", res);
        const onlineList = localStorage.getItem("onlineFriends");
        if (!onlineList || onlineList.length === 0) {
          const newList: string[] = [];
          res.forEach((el: FriendState) => {
            const key = Object.keys(el)[0];
            if (el[key]) {
              newList.push(key);
            }
          });
          console.log("friend state new List!!", newList);
          localStorage.setItem("onlineFriends", JSON.stringify(newList));
        } else {
          const prevList = JSON.parse(onlineList);
          res.forEach((el: FriendState) => {
            const key = Object.keys(el)[0];
            if (el[key]) {
              prevList.push(key);
            }
          });
          const newList = Array.from(new Set(prevList)) as string[];
          console.log("update online list: ", newList);
          localStorage.setItem("onlineFriends", JSON.stringify(newList));
          setOnlineList(newList);
        }
      });
    }
  });

  return (
    <div
      className={`w-72 h-[700px] overflow-auto ${friendsList && friendsList.length > 0 ? "scrollbar-custom" : "scrollbar-hide"}`}
    >
      {friendsList.map((friend, index) => (
        <div key={index} className="relative">
          {newMessageSenders &&
            newMessageSenders.find(el => el === friend.chatRoomId) && (
              <div className="absolute left-0 top-0 w-3 h-3 rounded-full bg-red-600" />
            )}
          <Friend
            friend={friend}
            onChat={() => toggleChat(friend)}
            isOnline={checkFriendOnline(friend.friend)}
          />
        </div>
      ))}
      {isChatVisible && selectedFriend && (
        <div className="w-full absolute top-[250px] left-[-330px] bottom-0 bg-white shadow-md rounded-lg z-11">
          <Chat friend={selectedFriend} onClose={closeChat} />
        </div>
      )}
    </div>
  );
};

export default FriendList;
