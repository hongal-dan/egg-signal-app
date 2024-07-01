import React from "react";

interface NotificationsProps {}

const Notification: React.FC = () => {
  return (
    <div className="flex gap-[10px] border border-slate-500 bg-white rounded-2xl p-5">
      <div className="w-full flex justify-between">
        <div className="text-center">이름</div>
        <div className="flex justify-center gap-2">
          <button className="bg-green-500 text-white rounded-lg text-m px-3">
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

const Notifications: React.FC<NotificationsProps> = () => {
  return (
    <div>
      <p>친구 요청</p>
      <div>
        <Notification />
      </div>
    </div>
  );
};

export default Notifications;
