"use client";
import React, { useEffect } from "react";
import { userState } from "@/app/store/userInfo";
import { commonSocketState, notiListState } from "@/app/store/commonSocket";
import { useRecoilValue } from "recoil";

interface Notification {
  _id: string;
  from: string;
}

interface NotificationProps {
  noti: Notification;
}

const Notification: React.FC<NotificationProps> = ({ noti }) => {
  const currentUser = useRecoilValue(userState);
  const commonSocket = useRecoilValue(commonSocketState);

  const acceptRequest = () => {
    if (commonSocket && currentUser) {
      console.log("친구 수락");
      commonSocket.emit("reqAcceptFriend", {
        _id: noti._id,
        userNickname: currentUser.nickname,
        friendNickname: noti.from,
      });
    }
  };

  return (
    <div className="flex gap-[10px] border border-slate-500 bg-white rounded-2xl p-5">
      <div className="w-full flex justify-between">
        <div className="text-center">{noti.from}</div>
        <div className="flex justify-center gap-2">
          <button
            className="bg-green-500 text-white rounded-lg text-m px-3"
            onClick={acceptRequest}
          >
            수락
          </button>
        </div>
      </div>
    </div>
  );
};

const Notifications: React.FC = () => {
  const notiList = useRecoilValue(notiListState);
  useEffect(() => console.log(notiList));

  return (
    <div>
      <p>친구 요청</p>
      <div>
        {notiList.map((noti, i) => (
          <div key={i}>
            <Notification noti={noti} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;
