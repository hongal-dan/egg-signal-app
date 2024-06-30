"use client";
import React, { useState, useEffect, useRef } from "react";

interface Props {
  friend: {
    friend: string;
  };
  onClose: () => void;
}

const Chat: React.FC<Props> = ({ friend, onClose }) => {
  const [chat, setChat] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chat]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() === "") return;
    setChat(prevChat => [...prevChat, message]);
    setMessage("");
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
              <div key={index} className="flex justify-end">
                <span className="border border-gray-400 p-2 rounded-lg">
                  {msg}
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
