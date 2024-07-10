"use client";

import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { meetingSocketState } from "@/app/store/socket";
import { useRecoilValue } from "recoil";
import { userState, testState } from "@/app/store/userInfo";
import { defaultSessionState } from "@/app/store/ovInfo";
import { commonSocketState } from "@/app/store/commonSocket";

type MatchingResultProps = {
  capturedImage: string;
  lover: string;
  isMatched: boolean;
  onClose: () => void;
};

const MatchingResult: React.FC<MatchingResultProps> = ({
  capturedImage,
  lover,
  isMatched,
  onClose,
}) => {
  const meetingSocket = useRecoilValue(meetingSocketState)!;
  const commonSocket = useRecoilValue(commonSocketState);
  const myInfo = useRecoilValue(userState);
  const sessionInfo = useRecoilValue(defaultSessionState);
  const [isLoading, setIsLoading] = useState(false);
  const leaveSession = () => onClose();
  const [isRequestedFriend, setIsRequestedFriend] = useState(false);
  const requestBtnRef = useRef<HTMLButtonElement>(null);
  const testName = useRecoilValue(testState);

  const moveToPrivateRoom = () => {
    meetingSocket?.emit("moveToPrivateRoom", {
      sessionId: sessionInfo.sessionId,
      myName: myInfo.nickname,
      // myName: testName, // FIXME 배포시엔 위에거로 바꿔야함
      partnerName: lover,
    });
    setIsLoading(true);
  };

  const requestAddFriend = () => {
    if (isRequestedFriend) {
      Swal.fire({
        title: "이미 친구 요청을 보냈습니다.",
        confirmButtonText: "확인",
      });
      return;
    }
    Swal.fire({
      icon: "success",
      title: "친구 요청을 보냈습니다",
      showConfirmButton: false,
      timer: 1500,
    });
    commonSocket?.emit("reqRequestFriend", {
      userNickname: myInfo.nickname,
      // userNickname: testName, // FIXME 배포시엔 위에거로 바꿔야함
      friendNickname: lover.split("-")[0],
    });
    setIsRequestedFriend(true);
  };

  useEffect(() => {
    const timeOut = setTimeout(() => {
      leaveSession(); // 20초 동안 아무것도 안하면 leaveSession
    }, 20000);
    return () => clearTimeout(timeOut);
  }, []);

  return (
    <div className="absolute w-full h-full flex items-center justify-center min-w-[600px]">
      <div className="relative w-[600px] h-[700px] bg-white rounded-3xl custom-shadow">
        <p className="text-end text-3xl pt-5 pr-5">
          <button onClick={leaveSession}>✕</button>
        </p>
        <p className="text-center text-3xl font-bold">통화가 종료되었습니다.</p>
        <div className="p-5">
          {capturedImage && (
            <div className="relative">
              <p className="absolute w-full top-[-1px] h-[40px] pt-1 rounded-t-3xl bg-slate-300 text-center font-bold text-2xl custom-shadow">
                {lover}
              </p>
              <img
                src={capturedImage}
                alt="Captured"
                className="rounded-3xl custom-shadow"
              />
            </div>
          )}
        </div>
        <div className="bottom-0 absolute w-full">
          {isMatched && (
            <div className="flex justify-center">
              <button
                onClick={moveToPrivateRoom}
                className="bg-amber-300 w-3/5 h-[70px] text-4xl font-bold shadow-md rounded-3xl custom-shadow"
              >
                {isLoading ? (
                  <svg
                    className="animate-spin h-5 w-5 mr-3 text-white inline-block"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 2.42.936 4.635 2.464 6.291l1.536-1.536z"
                    ></path>
                  </svg>
                ) : (
                  <p className="w-full text-2xl font-bold">1:1 대화로 이동</p>
                )}
              </button>
            </div>
          )}
          <div className="flex justify-center gap-10 my-4">
            {isMatched && (
              <button
                onClick={requestAddFriend}
                className="p-4 px-6 border border-green-700 rounded-3xl text-green-700 font-bold hover:bg-green-700 hover:text-white custom-shadow"
                ref={requestBtnRef}
              >
                친구 추가
              </button>
            )}
            <button
              onClick={leaveSession}
              className="p-4 px-6 border border-red-500 rounded-3xl text-red-500 font-bold hover:bg-red-500 hover:text-white custom-shadow"
            >
              홈으로
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchingResult;
