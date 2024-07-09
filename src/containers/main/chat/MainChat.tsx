"use client";
import { commonSocketState } from "@/app/store/commonSocket";
import { useRecoilValue } from "recoil";
import { useState, useEffect, useRef } from "react";

interface MainChatProps {
  chatExpanded: boolean;
  setChatExpanded: (expanded: boolean) => void;
}

const MainChat: React.FC<MainChatProps> = ({
  chatExpanded,
  setChatExpanded,
}) => {
  const [messageInput, setMessageInput] = useState("");
  const commonSocket = useRecoilValue(commonSocketState);
  const [messages, setMessages] = useState<
    { message: string; nickname: string }[]
  >([]);
  const messagesEndRef = useRef<HTMLUListElement>(null);
  const [, setIsSending] = useState(false); // 메시지 전송 상태 추가

  useEffect(() => {
    const handleHomeChat = (data: { message: string; nickname: string }) => {
      setMessages(prevMessages => [...prevMessages, data]);
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

  const handleSendMessage = (e: any) => {
    e.preventDefault();
    if (messageInput.trim() === "") {
      return;
    } // isSending 확인 추가
    // isSending 확인 추가
    setIsSending(true);
    console.log(messageInput);
    commonSocket?.emit("homeChat", { message: messageInput });
    setMessageInput("");
    setIsSending(false); // 메시지 전송 후 상태 초기화
  };

  const handleChatHeaderClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setChatExpanded(!chatExpanded);
  };

  return (
    <div className="fixed bottom-10 left-10 z-20 w-[400px] bg-white border rounded-md shadow-md">
      {/* 채팅창 높이 조절 */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          chatExpanded ? "h-96" : "h-16" // 축소 시 높이 조절
        }`}
      >
        {/* 채팅창 헤더 (클릭 시 채팅창 확장/축소) */}
        <div
          className="flex items-center justify-between p-4 cursor-pointer"
          onClick={handleChatHeaderClick}
        >
          <h3 className="text-lg font-bold">전체 채팅</h3>
          <button
            className={`transform transition-transform duration-300 ${
              chatExpanded ? "rotate-180" : ""
            }`}
          >
            ▲
          </button>
        </div>

        {/* 채팅 메시지 목록 (축소 시에도 일부 표시) */}
        <ul
          className={`overflow-y-auto p-4 transition-all duration-300 ease-in-out ${
            chatExpanded ? "h-4/5" : "hidden" // 축소 시 최대 높이 제한
          } ${messages.length > 0 ? "scrollbar-custom" : "scrollbar-hide"}`}
          ref={messagesEndRef}
        >
          {/* 최근 메시지 3개만 표시 (축소된 경우) */}
          {!chatExpanded && messages.length > 3 && (
            <>
              {messages.slice(-3).map((msg, index) => (
                <li key={index} className="mb-2">
                  <span className="font-bold">{msg.nickname}: </span>
                  {msg.message}
                </li>
              ))}
              <li className="text-center text-gray-500">...</li>{" "}
              {/* 이전 메시지 표시 */}
            </>
          )}

          {/* 전체 메시지 표시 (확장된 경우) */}
          {chatExpanded &&
            messages.map((msg, index) => (
              <li key={index} className="mb-2">
                <span className="font-bold">{msg.nickname}: </span>
                {msg.message}
              </li>
            ))}
        </ul>
      </div>

      {/* 메시지 입력 (채팅창 확장 시에만 표시) */}
      {chatExpanded && (
        <div className="p-4">
          <form onSubmit={handleSendMessage}>
            <input
              type="text"
              className="w-full border rounded-md p-2"
              placeholder="메시지를 입력하세요"
              value={messageInput}
              onChange={e => setMessageInput(e.target.value)}
            />
          </form>
        </div>
      )}
    </div>
  );
};

export default MainChat;
