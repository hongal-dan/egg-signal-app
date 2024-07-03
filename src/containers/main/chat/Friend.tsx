import React from "react";

interface Props {
  friend: {
    friend: string;
    chatRoomId: string;
  };
  onChat: () => void;
  isOnline: boolean;
}

const Friend: React.FC<Props> = ({ friend, onChat, isOnline }) => {
  console.log(friend.friend, ": ", isOnline ? "온라인" : "오프라인");
  return (
    <div
      className="flex justify-between items-center mb-1 mt-1 text-lg p-2 border-b border-gray-300"
      onClick={onChat}
    >
      <span>{friend.friend}</span>
      {isOnline ? (
        <div className="w-5 h-5 rounded-full bg-green-300" />
      ) : (
        <div className="w-5 h-5 rounded-full bg-slate-300" />
      )}
    </div>
  );
};

export default Friend;
