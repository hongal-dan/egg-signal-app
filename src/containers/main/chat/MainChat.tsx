"use client";
import { commonSocketState } from "@/app/store/commonSocket";
import { useRecoilValue } from "recoil";
import { useState, useEffect, useRef } from "react";
import ScrollToBottom from 'react-scroll-to-bottom';
const MainChat = () => {
  const [messageInput, setMessageInput] = useState("");
  const commonSocket = useRecoilValue(commonSocketState);
  const [messages, setMessages] = useState<
    { message: string; nickname: string }[]
  >([]);
  const messagesEndRef = useRef<HTMLUListElement>(null);
  const [isSending, setIsSending] = useState(false); // 메시지 전송 상태 추가
  const [isChatExpanded, setIsChatExpanded] = useState(false);

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
    messagesEndRef.current?.scrollTo({
      top: messagesEndRef.current.scrollHeight, // scrollTop 값을 scrollHeight로 설정
      behavior: "smooth",
    });
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
    <div className="fixed bottom-0 left-0 w-full md:w-1/3 bg-white border rounded-md shadow-md">
      {/* 채팅창 높이 조절 */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isChatExpanded ? "h-96" : "h-16" // 축소 시 높이 조절
        }`}
      >
        {/* 채팅창 헤더 (클릭 시 채팅창 확장/축소) */}
        <div
          className="flex items-center justify-between p-4 cursor-pointer"
          onClick={() => setIsChatExpanded(!isChatExpanded)}
        >
          <h3 className="text-lg font-bold">HomeChat</h3>
          <button
            className={`transform transition-transform duration-300 ${
              isChatExpanded ? "rotate-180" : ""
            }`}
          >
            ▲
          </button>
        </div>

        {/* 채팅 메시지 목록 (축소 시에도 일부 표시) */}
        <ul
          className={`overflow-y-auto p-4 transition-all duration-300 ease-in-out ${
            isChatExpanded ? "h-4/5" : "h-fit max-h-32" // 축소 시 최대 높이 제한
          }`}
          ref={messagesEndRef}
        >
          {/* 최근 메시지 3개만 표시 (축소된 경우) */}
          {!isChatExpanded && messages.length > 3 && (
            <>
              {messages.slice(-3).map((msg, index) => (
                <li key={index} className="mb-2">
                  <span className="font-bold">{msg.nickname}: </span>
                  {msg.message}
                </li>
              ))}
              <li className="text-center text-gray-500">...</li> {/* 이전 메시지 표시 */}
            </>
          )}

          {/* 전체 메시지 표시 (확장된 경우) */}
          {isChatExpanded &&
            messages.map((msg, index) => (
              <li key={index} className="mb-2">
                <span className="font-bold">{msg.nickname}: </span>
                {msg.message}
              </li>
            ))}
        </ul>
      </div>

      {/* 메시지 입력 (채팅창 확장 시에만 표시) */}
      {isChatExpanded && (
        <div className="p-4">
          <form onSubmit={handleSendMessage}>
            <input
              type="text"
              className="w-full border rounded-md p-2"
              placeholder="메시지를 입력하세요"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
            />
          </form>
        </div>
      )}
    </div>
  );
};

export default MainChat;
