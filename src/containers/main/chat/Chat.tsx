"use client";
import React, { useState, useEffect, useRef } from "react";
import { userState } from "@/app/store/userInfo";
import { commonSocketState } from "@/app/store/commonSocket";
import { chatRoomState, newMessageSenderState } from "@/app/store/chat";
import { useRecoilValue, useRecoilState } from "recoil";
import { FaCircleArrowUp } from "react-icons/fa6";

interface Props {
  friend: {
    friend: string;
    chatRoomId: string;
  };
  onClose: () => void;
}

interface Chat {
  sender: string;
  message: string;
}

const Chat: React.FC<Props> = ({ friend, onClose }) => {
  const commonSocket = useRecoilValue(commonSocketState);
  const currentUser = useRecoilValue(userState);
  const [newMessageSenders, setNewMessageSenders] = useRecoilState(
    newMessageSenderState,
  );
  const [chat, setChat] = useState<Chat[]>([]);
  const [message, setMessage] = useState("");
  const [chatRoomId, setChatRoomId] = useRecoilState(chatRoomState);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chat]);

  useEffect(() => {
    console.log("joinChat emit: ", friend.chatRoomId);
    if (commonSocket) {
      commonSocket.emit("joinchat", { newChatRoomId: friend.chatRoomId });
      setChatRoomId(friend.chatRoomId);
      commonSocket.on("chatHistory", res => {
        console.log("chat histroy: ", res);
        const chatHistory = res.map((msg: Chat) => ({
          sender: msg.sender,
          message: msg.message,
        }));
        setChat(chatHistory);
      });
      commonSocket.on("message", res => {
        if (res.sender === currentUser?.nickname) {
          return;
        }
        const newChat = {
          sender: res.sender,
          message: res.message,
        };
        setChat(prevChat => [...prevChat, newChat]);
      });
    }

    // 알람 켜져있었으면 알람 끄기
    if (
      newMessageSenders &&
      newMessageSenders.find(el => el === friend.chatRoomId)
    ) {
      const updateSenders = newMessageSenders.filter(
        el => el !== friend.chatRoomId,
      );
      if (updateSenders.length === 0) {
        setNewMessageSenders([]);
      } else {
        setNewMessageSenders(updateSenders);
      }
    }

    return () => {
      commonSocket?.emit("closeChat", { chatRoomdId: chatRoomId });
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() === "") return;
    if (currentUser) {
      const newChat: Chat = {
        sender: currentUser?.nickname,
        message: message,
      };
      setChat(prevChat => [...prevChat, newChat]);
      commonSocket?.emit("sendMessage", {
        userNickname: currentUser.nickname,
        chatRoomId: friend.chatRoomId,
        message: message,
        receiverNickname: friend.friend,
      });
      setMessage("");
    }
  };

  return (
    <div className="h-full">
      <div className="flex justify-between p-4 border-b border-gray-300">
        <span>{friend.friend}</span>
        <button onClick={onClose} className="font-bold">
          ✕
        </button>
      </div>
      <div className="h-full">
        <div
          className={`flex-grow overflow-y-scroll p-4 h-[75%] ${chat.length > 0 ? "scrollbar-custom" : "scrollbar-hide"}`}
          ref={chatContainerRef}
        >
          <div className="space-y-4">
            {chat.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender === currentUser?.nickname ? "justify-end" : "justify-start"}`}
              >
                <span className="border border-gray-400 p-2 rounded-lg">
                  {msg.message}
                </span>
              </div>
            ))}
          </div>
        </div>
        <form
          className="flex p-4 w-full border-t border-gray-300"
          onSubmit={handleSubmit}
        >
          <input
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="w-full h-[30px] relative bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:outline-none p-2"
          />
          <FaCircleArrowUp className="h-[20px] absolute flex right-[25px] mt-1" />
        </form>
      </div>
    </div>
  );
};

export default Chat;
