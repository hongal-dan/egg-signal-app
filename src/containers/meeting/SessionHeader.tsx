import React, { RefObject } from 'react';
import dynamic from 'next/dynamic';

const DynamicEggTimer = dynamic(() => import("@/containers/meeting/EggTimer"), {
  ssr: false,
});

interface SessionHeaderProps {
  leaveHandler: (leaveSession: () => void) => void;
  leaveSession: () => void;
  keywordRef: RefObject<HTMLParagraphElement>;
  setIsExit: (flag: boolean) => void;
}

const SessionHeader: React.FC<SessionHeaderProps> = ({ leaveHandler, leaveSession, keywordRef, setIsExit }) => {
  const onLeave = () => {
    leaveHandler(leaveSession);
    setIsExit(true);
  };
  return (
    <div
      id="session-header"
      className="fixed flex flex-col justify-center items-center w-full"
    >
      <div className="flex w-full mb-2 px-[10vw]">
        <input
          className="border-b border-gray-500 text-gray-500 cursor-pointer"
          type="button"
          id="buttonLeaveSession"
          onClick={() => onLeave()}
          value="종료하기"
        />
      </div>
      <DynamicEggTimer setTime={5} />
      <div className="w-full h-6 mt-4">
        <p
          className="flex justify-center items-center font-bold h-full text-3xl"
          ref={keywordRef}
        ></p>
        <audio
          id="tickSound"
          src="/sound/tick.mp3"
          className="hidden"
        ></audio>
      </div>
    </div>
  );
};

export default SessionHeader;
