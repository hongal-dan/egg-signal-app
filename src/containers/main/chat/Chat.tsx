"use client";
import React, { useState, useEffect, useRef } from "react";
import { userState } from "@/app/store/userInfo";
import { commonSocketState } from "@/app/store/commonSocket";
import { chatRoomState } from "@/app/store/chat";
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

  // chat history를 한 번만 받아오도록 설정
  const handleChatHistory = (res: Chat[]) => {
    const chatHistory = res.map((msg: Chat) => ({
      sender: msg.sender,
      message: msg.message,
    }));
    setChat(chatHistory);
    // chat history를 받았으면 이벤트 핸들러 등록 해제
    commonSocket!.off("chatHistory", handleChatHistory);
  };

  useEffect(() => {
    console.log("joinChat emit: ", friend.chatRoomId);
    if (commonSocket) {
      commonSocket.emit("joinchat", {
        newChatRoomId: friend.chatRoomId,
        friendName: friend.friend,
      });
      setChatRoomId(friend.chatRoomId);

      commonSocket.on("chatHistory", handleChatHistory);

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
    <div className="h-full custom-shadow">
      <div className="flex justify-between p-4 border-b border-gray-300">
        <span>{friend.friend}</span>
        <button onClick={onClose} className="font-bold">
          ✕
        </button>
      </div>
      <div className="h-full">
        <div
          className={`overflow-y-scroll p-4 h-[75%] ${chat.length > 0 ? "scrollbar-custom" : "scrollbar-hide"}`}
          ref={chatContainerRef}
        >
          <div className="space-y-4">
            {chat.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender === currentUser?.nickname ? "justify-end" : "justify-start"}`}
              >
                <span className="border border-gray-400 p-2 rounded-lg shadow-sm">
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
            className="w-full h-[30px] relative bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:outline-black p-2"
          />
          <FaCircleArrowUp onClick={handleSubmit} className="h-[20px] absolute flex right-[25px] mt-1 cursor-pointer" />
        </form>
      </div>
    </div>
  );
};

export default Chat;
