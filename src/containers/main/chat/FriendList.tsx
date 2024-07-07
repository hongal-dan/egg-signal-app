"use client";
import React, { useState } from "react";
import Friend from "./Friend";
import Chat from "./Chat";
import { commonSocketState, onlineListState } from "@/app/store/commonSocket";
import { newMessageSenderState, messageAlarmState } from "@/app/store/chat";
import { useRecoilState, useRecoilValue } from "recoil";

interface Friend {
  friend: string;
  chatRoomId: string;
}

interface FriendListPros {
  friendsList: Friend[];
}

const FriendList: React.FC<FriendListPros> = ({ friendsList }) => {
  const commonSocket = useRecoilValue(commonSocketState);
  const onlineList = useRecoilValue(onlineListState);
  const [newMessageSenders, setNewMessageSenders] = useRecoilState(
    newMessageSenderState,
  );
  const [, setmessageAlarm] = useRecoilState(messageAlarmState);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [isChatVisible, setIsChatVisible] = useState<boolean>(false);

  const toggleChat = (friend: Friend) => {
    if (!isChatVisible) {
      const updateSenders = newMessageSenders.filter(
        p => p !== friend.chatRoomId,
      );
      if (updateSenders.length === 0) {
        setmessageAlarm(false);
      }
      sessionStorage.setItem("messageSenders", JSON.stringify(updateSenders));
      setNewMessageSenders(updateSenders);
    }

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

  const isNewMessageSender = (friend: Friend) => {
    if (newMessageSenders.find(el => el === friend.chatRoomId)) {
      console.log(friend.friend, " 알람 보냄");
      return true;
    }
    return false;
  };

  return (
    <div
      className={`w-72 h-[700px] overflow-auto ${friendsList && friendsList.length > 0 ? "scrollbar-custom" : "scrollbar-hide"}`}
    >
      {friendsList.map((friend, index) => (
        <div key={index} className="relative">
          <Friend
            friend={friend}
            onChat={() => toggleChat(friend)}
            isOnline={checkFriendOnline(friend.friend)}
            isNewMessageSender={isNewMessageSender(friend)}
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
