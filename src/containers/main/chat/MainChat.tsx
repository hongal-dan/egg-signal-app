"use client";

import { commonSocketState } from "@/app/store/commonSocket";
import { useRecoilValue } from "recoil";
import { useState, useEffect, useRef } from "react";

const MainChat = () => {
  const [messageInput, setMessageInput] = useState("");
  const commonSocket = useRecoilValue(commonSocketState);
  const [messages, setMessages] = useState<
    { message: string; nickname: string }[]
  >([]);
  const messagesEndRef = useRef<HTMLUListElement>(null);
  const [isSending, setIsSending] = useState(false); // 메시지 전송 상태 추가

  useEffect(() => {
    const handleHomeChat = (data: { message: string; nickname: string }) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    };

    commonSocket?.on("homeChat", handleHomeChat);

    return () => {
      commonSocket?.off("homeChat", handleHomeChat);
    };
  }, [commonSocket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e:any) => {
    e.preventDefault()
    if (messageInput.trim() === "") { return } // isSending 확인 추가
    // isSending 확인 추가
      setIsSending(true);
      console.log(messageInput);
      commonSocket?.emit("homeChat", { message: messageInput });
      setMessageInput("");
      setIsSending(false); // 메시지 전송 후 상태 초기화
  };

  return (
    <div className="fixed bottom-0 left-0 w-full md:w-1/3 h-96 bg-white border rounded-md shadow-md">
      <ul className="h-4/5 overflow-y-auto p-4" ref={messagesEndRef}>
        {/* JSX 내부에서 messages.map 호출 */}
        {messages.map((msg, index) => (
          <li key={index} className="mb-2">
            <span className="font-bold">{msg.nickname}: </span>
            {msg.message}
          </li>
        ))}
      </ul>

      <div className="p-4">
        <form onSubmit={(e) => {
              handleSendMessage(e);
          }}><input
          type="text"
          className="w-full border rounded-md p-2"
          placeholder="메시지를 입력하세요"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
        /></form>
        {/* button 요소 제거 */}
      </div>
    </div>
  );
};

export default MainChat;
