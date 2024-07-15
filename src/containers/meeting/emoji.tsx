"use client";
import React from "react";
import { useRecoilValue } from "recoil";
import { meetingSocketState } from "@/app/store/socket";
import { userState } from "@/app/store/userInfo";
import { testState } from "@/app/store/userInfo"; //FIXME 테스트용 랜덤 닉네임 저장, 배포 전에 삭제해야함

function Emoji() {
  const socket = useRecoilValue(meetingSocketState);
  const userInfo = useRecoilValue(userState);
  const testName = useRecoilValue(testState); //FIXME 테스트용 랜덤 닉네임 저장, 배포 전에 삭제해야함

  const emojiNames = [
    "/data/emoji/thumbsUp.png",
    "/data/emoji/thumbsDown.png",
    "/data/emoji/smile.png",
    "/data/emoji/loudLaugh.png",
    "/data/emoji/party.png",
    "/data/emoji/scream.png",
    "/data/emoji/sad.png",
    "/data/emoji/cry.png",
  ];

  const handleEmojiClick = (emojiIndex: number) => {
    socket?.emit("emoji", {
      nickname: userInfo.nickname,
      // nickname: testName, //FIXME 테스트용 랜덤 닉네임 배포 시엔 위에 거로
      emojiIndex: emojiNames[emojiIndex],
    });
  };

  return (
      <>
        {emojiNames.map((emoji, index) => (
          <button
            key={index}
            onClick={() => handleEmojiClick(index)}
            className="m-1 p-1"
          >
            <img src={emoji} className="w-8 h-8" />
          </button>
        ))}
      </>
  );
}

export default Emoji;
