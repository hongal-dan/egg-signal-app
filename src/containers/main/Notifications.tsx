"use client";
import React from "react";
import { userState } from "@/app/store/userInfo";
import { commonSocketState } from "@/app/store/commonSocket";
import { useRecoilValue } from "recoil";

interface NotificationsProps {
  notiList: string[];
}

interface Sender {
  sender: string;
}

const Notification: React.FC<Sender> = ({ sender }) => {
  const currentUser = useRecoilValue(userState);
  const commonSocket = useRecoilValue(commonSocketState);

  const acceptRequest = () => {
    if (commonSocket && currentUser) {
      commonSocket.emit("reqAcceptFriend", {
        userNickname: currentUser.nickname,
        friendNickname: sender,
      });
    }
  };

  return (
    <div className="flex gap-[10px] border border-slate-500 bg-white rounded-2xl p-5">
      <div className="w-full flex justify-between">
        <div className="text-center">{sender}</div>
        <div className="flex justify-center gap-2">
          <button
            className="bg-green-500 text-white rounded-lg text-m px-3"
            onClick={acceptRequest}
          >
            수락
          </button>
          <button className="bg-red-500 text-white rounded-lg  text-m px-3">
            거절
          </button>
        </div>
      </div>
    </div>
  );
};

const Notifications: React.FC<NotificationsProps> = ({ notiList }) => {
  return (
    <div>
      <p>친구 요청</p>
      <div>
        {notiList.map(sender => (
          <Notification key={sender} sender={sender} />
        ))}
      </div>
    </div>
  );
};

export default Notifications;
