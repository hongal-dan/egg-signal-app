"use client";

import React from "react";
import { useRecoilState } from "recoil";
import { avatarState } from "@/app/store/avatar";

const AvatarCollection = () => {
  const [, setAvatar] = useRecoilState(avatarState);
  const avatarList = [
    ["곰", "bear"],
    ["둘리", "dooly"],
    ["남자", "man"],
    ["노인", "oldman"],
    ["판다", "panda"],
    ["돼지", "pig"],
    ["북극곰", "polarbear"],
    ["토끼", "rabbit"],
    ["라쿤", "raccon"],
    ["토마스", "thomas"],
  ];

  const chooseAvatar = (avatarName: string) => {
    console.log(avatarName);
    setAvatar(avatarName);
  };

  return (
    <div className="mx-auto my-0 p-4 w-[50vw] h-[100vh] flex flex-col gap-4 items-center justify-center">
      <h1 className="text-[50px]">당신의 아바타를 선택해 주세요</h1>
      <div className="flex gap-4">
        {avatarList.map((avatar, idx) => {
          return <button className="p-2 rounded-md bg-[#F8B85F] hover:bg-[#fac883]" onClick={()=> chooseAvatar(avatar[1])} key={idx}>{avatar[0]}</button>;
        })}
      </div>
    </div>
  );
};

export default AvatarCollection;
