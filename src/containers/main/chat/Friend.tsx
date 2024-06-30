import React from "react";

interface Props {
  key: number;
  friend: {
    friend: string;
  };
  onChat: () => void;
}

const Friend: React.FC<Props> = ({ friend, onChat }) => {
  return (
    <div className="flex justify-between items-center mb-3" onClick={onChat}>
      <span>{friend.friend}</span>
      <div className="w-4 h-4 rounded-full inline-block mr-2 bg-slate-300" />
    </div>
  );
};

export default Friend;
