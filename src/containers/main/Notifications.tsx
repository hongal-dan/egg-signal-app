import Image from "next/image";
import React from "react";

interface NotificationsProps {
  onClose: () => void;
}

const Notification: React.FC = () => {
  return (
    // 테스트용 데이터
    <div className="flex gap-[10px] border border-slate-500 bg-white rounded-2xl p-5">
      <Image
        src="/img/profile_sample.png"
        alt="profile"
        width={70}
        height={70}
        className="rounded-xl"
      />
      <div className="w-full">
        <p className="text-center">이름</p>
        <div className="w-[100%] flex justify-center gap-2">
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
