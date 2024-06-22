import Image from "next/image";
import React from "react";

interface Props {
  key: number;
  friend: {
    img: string;
    friendName: string;
    isOnline: boolean;
    isMeeting: boolean;
  };
  onChat: () => void;
}

const Friend: React.FC<Props> = ({ friend, onChat }) => {
  let circleColor = "bg-gray-400";
  if (friend.isOnline && friend.isMeeting) {
    circleColor = "bg-red-500";
  } else if (friend.isOnline) {
    circleColor = "bg-green-500";
  }

  return (
    <div className="flex justify-between items-center mb-3" onClick={onChat}>
      <Image
        src={friend.img}
        alt="profile"
        width={50}
        height={50}
        className="rounded-xl"
      />
      <span>{friend.friendName}</span>
      <div
        className={`w-4 h-4 rounded-full ${circleColor} inline-block mr-2`}
      />
    </div>
  );
};

export default Friend;
