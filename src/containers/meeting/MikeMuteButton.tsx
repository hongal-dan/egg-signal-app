"use client";

import { Publisher } from "openvidu-browser";
import React, { useState } from "react";
import { TbMicrophoneFilled, TbMicrophoneOff } from "react-icons/tb";

type Props = {
  publisher: Publisher | undefined;
};

const MikeMuteButton = (props: Props) => {
  const [isMuted, setIsMuted] = useState(false);

  const toggleAudio = () => {
    if (props.publisher) {
      props.publisher.publishAudio(isMuted);
      setIsMuted(!isMuted);
    }
    else {
      console.error("Publisher is not defined")
    }
  };

  return (
    <button className= "text-[4rem] w-[4rem] h-[4rem] absolute z-10 bottom-[0.2rem] right-[-7rem] transition-transform duration-200 ease-in-out hover:translate-y-[-0.25rem]" onClick={toggleAudio}>
      {!isMuted ? <TbMicrophoneFilled className=" text-gray-500" /> : <TbMicrophoneOff className=" text-red-600"/>}
    </button>
  );
};

export default MikeMuteButton;
