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
    <div className="mx-auto my-0 p-4 w-[50vw] h-[100vh] flex flex-col gap-4 items-center justify-center min-w-[900px]">
      <h1 className="text-[50px] mb-14">당신의 아바타를 선택해 주세요</h1>
      <div className="grid grid-cols-5 gap-4">
        {avatarList.map((avatar, idx) => {
          return (
            <div className="flex flex-col items-center" key={idx}>
              <div
                style={{
                  backgroundImage: `url(./avatar/${avatar[1]}.png)`,
                }}
                className="custom-shadow bg-cover bg-no-repeat bg-center w-28 h-24 border-4 border-[#F8B85F] rounded-xl cursor-pointer hover:border-[hotpink] transition-all duration-300 ease-in-out p-4  bg-[#F6FDEB]"
                onClick={() => chooseAvatar(avatar[1])}
              ></div>
              <p className="text-[20px] font-bold">{avatar[0]}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AvatarCollection;
