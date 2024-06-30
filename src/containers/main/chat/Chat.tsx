"use client";
import React, { useState, useEffect, useRef } from "react";
import { useCommonSocket } from "@/contexts/CommonSocketContext";
import { userState } from "@/app/store/userInfo";
import { useRecoilValue } from "recoil";

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
  const { commonSocket, isConnected } = useCommonSocket();
  const currentUser = useRecoilValue(userState);
  const [chat, setChat] = useState<Chat[]>([]);
  const [message, setMessage] = useState("");
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chat]);

  useEffect(() => {
    console.log("joinChat emit: ", friend.chatRoomId);
    if (commonSocket) {
      const newChatRoomId = friend.chatRoomId;
      commonSocket.emit("joinchat", { newChatRoomId: newChatRoomId });
      commonSocket.on("chatHistory", res => {
        console.log("chat histroy: ", res);
        const chatHistory = res.map(msg => ({
          sender: msg.sender,
          message: msg.message,
        }));
        // todo: message에 chat history 넣기
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
  }, []);

  useEffect(() => {
    console.log(chat);
    chat.map(msg => console.log(msg));
  }, [chat]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() === "") return;
    if (currentUser) {
      const newChat: Chat = {
        sender: currentUser?.nickname,
        message: message,
      };
      setChat(prevChat => [...prevChat, newChat]);
      // sendMessage emit -message 전송
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
            className="w-full h-[30px] bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:outline-none p-2"
          />
          <button className="ml-1">✉️</button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
