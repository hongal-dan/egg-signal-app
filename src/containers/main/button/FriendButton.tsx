import React, { useEffect } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import {
  newMessageSenderState,
  messageAlarmState,
  chatRoomState,
} from "@/app/store/chat";
import { commonSocketState } from "@/app/store/commonSocket";
import { userState } from "@/app/store/userInfo";
import FriendList from "../chat/FriendList";

interface FriendButtonProps {
  isFriendListVisible: boolean;
  toggleFriendList: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const FriendButton: React.FC<FriendButtonProps> = ({
  isFriendListVisible,
  toggleFriendList,
}) => {
  const currentUser = useRecoilValue(userState);
  const commonSocket = useRecoilValue(commonSocketState);
  const messageAlarm = useRecoilValue(messageAlarmState);
  const newMessageSenders = useRecoilValue(newMessageSenderState);
  const [openedChatRoomId, setOpenedChatRoomId] = useRecoilState(chatRoomState);

  useEffect(() => {
    if (!isFriendListVisible) {
      if (openedChatRoomId !== null) {
        commonSocket?.emit("closeChat", { chatRoomId: openedChatRoomId });
        setOpenedChatRoomId(null);
      }
    }
  }, [isFriendListVisible, openedChatRoomId, commonSocket]);

  return (
    <div className="z-10 absolute bottom-10 right-10">
      <button
        className="relative w-48 h-10 flex items-center justify-center bg-amber-100 rounded-2xl shadow-md"
        onClick={toggleFriendList}
      >
        {(messageAlarm ||
          (newMessageSenders && newMessageSenders.length !== 0)) && (
          <div className="absolute left-[-5px] top-[-5px] w-4 h-4 rounded-full bg-rose-500 shadow-md" />
        )}
        <p className="text-xl font-bold">친구</p>
      </button>
      {isFriendListVisible && (
        <div
          onClick={e => e.stopPropagation()}
          className="absolute bottom-[50px] right-1 bg-white shadow-md rounded-lg p-4 z-10 custom-shadow"
        >
          <FriendList friendsList={currentUser.friends} />
        </div>
      )}
    </div>
  );
};

export default FriendButton;
