"use client";
import React, { useEffect, useState } from "react";
import Friend from "./Friend";
import Chat from "./Chat";
import { userState } from "@/app/store/userInfo";
import { useRecoilValue } from "recoil";
import { useCommonSocket } from "@/contexts/CommonSocketContext";

interface FriendListProps {
  onClose: () => void;
  newMessageSenders: string[];
}

interface Friend {
  friend: string;
  chatRoomId: string;
}

const FriendList: React.FC<FriendListProps> = ({
  newMessageSenders,
  onClose,
}) => {
  const currentUser = useRecoilValue(userState);
  const { commonSocket } = useCommonSocket();
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [isChatVisible, setIsChatVisible] = useState<boolean>(false);

  const toggleChat = (friend: Friend) => {
    setSelectedFriend(friend);
    setIsChatVisible(prev => !prev);
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

  useEffect(() => {
    console.log(newMessageSenders);
  });

  return (
    <div className="w-72 h-[700px] overflow-auto">
      <div className="text-end">
        <button onClick={onClose} className="font-bold">
          ✕
        </button>
      </div>
      {currentUser?.friends.map((friend, index) => (
        <div key={index} className="relative">
          {newMessageSenders &&
            newMessageSenders.find(el => el === friend.chatRoomId) && (
              <div className="absolute left-0 top-0 w-3 h-3 rounded-full bg-red-600" />
            )}
          <Friend friend={friend} onChat={() => toggleChat(friend)} />
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
