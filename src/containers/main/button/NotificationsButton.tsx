"use client";

import React, { useRef } from "react";
import Notifications from "../Notifications";

interface NotificationButtonProps {
  isNotiVisible: boolean;
  notiList: any[];
  toggleNotiList: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const NotificationButton: React.FC<NotificationButtonProps> = ({
  isNotiVisible,
  notiList,
  toggleNotiList,
}) => {
  const notiRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-10 h-10 relative flex items-center justify-center text-xl bg-white rounded-2xl custom-shadow">
      {notiList.length !== 0 && (
        <div className="absolute left-[-5px] top-[-5px] w-4 h-4 rounded-full bg-rose-500 custom-shadow" />
      )}
      <button onClick={toggleNotiList}>🔔</button>
      {isNotiVisible && (
        <div
          ref={notiRef}
          onClick={e => e.stopPropagation()}
          className="w-[340px] h-[500px] absolute top-0 left-[50px] bg-zinc-200 shadow-md rounded-lg p-4 z-10"
        >
          <Notifications />
        </div>
      )}
    </div>
  );
};

export default NotificationButton;
