"use client";
import React, { useState } from "react";
import Friend from "./Friend";
import Chat from "./Chat";

// 테스트용 더미 데이터
const friends = [
  {
    friendName: "오프라인",
    isOnline: false,
    isMeeting: false,
  },
  {
    friendName: "온라인",
    isOnline: true,
    isMeeting: false,
  },
  {
    friendName: "온라인+미팅 중",
    isOnline: true,
    isMeeting: true,
  },
];

interface FriendListProps {
  onClose: () => void;
}

interface Friend {
  friendName: string;
  isOnline: boolean;
  isMeeting: boolean;
}

const FriendList: React.FC<FriendListProps> = ({ onClose }) => {
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
      {friends.map((friend, index) => (
        <Friend key={index} friend={friend} onChat={() => toggleChat(friend)} />
      ))}
      {isChatVisible && selectedFriend && (
        <div className="w-full absolute top-[400px] left-[-330px] bottom-0 bg-white shadow-md rounded-lg p-4 z-11">
          <Chat friend={selectedFriend} onClose={closeChat} />
        </div>
      )}
    </div>
  );
};

export default FriendList;
