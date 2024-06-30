"use client";
import React, { useState } from "react";
import Friend from "./Friend";
import Chat from "./Chat";
import { userState } from "@/app/store/userInfo";
import { useRecoilValue } from "recoil";

interface FriendListProps {
  onClose: () => void;
}

interface Friend {
  friend: string;
}

const FriendList: React.FC<FriendListProps> = ({ onClose }) => {
  const currentUser = useRecoilValue(userState);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [isChatVisible, setIsChatVisible] = useState<boolean>(false);

  const toggleChat = (friend: Friend) => {
    setSelectedFriend(friend);
    setIsChatVisible(prev => !prev);
  };

  const closeChat = () => {
    setSelectedFriend(null);
    setIsChatVisible(false);
  };

  return (
    <div className="w-72 h-[700px] overflow-auto">
      <div className="text-end">
        <button onClick={onClose} className="font-bold">
          ✕
        </button>
      </div>
      {currentUser?.friends.map((friend, index) => (
        <Friend key={index} friend={friend} onChat={() => toggleChat(friend)} />
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
