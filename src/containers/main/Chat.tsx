import React from "react";

interface Props {
  friend: {
    img: string;
    friendName: string;
    isOnline: boolean;
    isMeeting: boolean;
  };
  onClose: () => void;
}

const Chat: React.FC<Props> = ({ friend, onClose }) => {
  return (
    <div>
      <div className="text-end">
        <button onClick={onClose} className="font-bold">
          ✕
        </button>
      </div>
      <div>{friend.friendName}님과의 채팅</div>
    </div>
  );
};

export default Chat;
