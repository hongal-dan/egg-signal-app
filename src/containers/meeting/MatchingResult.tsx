import React from "react";

type MatchingResultProps = {
  capturedImage: string;
};

const MatchingResult: React.FC<MatchingResultProps> = ({ capturedImage }) => {
  return (
    <div className="relative w-[600px] h-[700px] bg-white rounded-3xl">
      <p className="text-end text-3xl pt-5 pr-5">
        <button>✕</button>
      </p>
      <p className="text-center text-3xl font-bold">통화가 종료되었습니다.</p>
      <div className="p-5">
        {capturedImage && (
          <div className="relative">
            <p className="absolute w-full top-[-1px] h-[40px] pt-1 rounded-t-3xl bg-slate-300 text-center font-bold text-2xl">
              닉네임
            </p>
            <img src={capturedImage} alt="Captured" className="rounded-3xl" />
          </div>
        )}
      </div>
      <div className="bottom-0 absolute w-full">
        <div className="flex justify-center">
          <button className="bg-amber-300 w-3/5 h-[70px] text-4xl font-bold shadow-md rounded-3xl">
            1:1 대화로 이동
          </button>
        </div>
        <div className="flex justify-center gap-10 my-4">
          <button className="p-4 px-6 border border-green-700 rounded-3xl text-green-700 font-bold hover:bg-green-700 hover:text-white">
            친구 추가
          </button>
          <button className="p-4 px-6 border border-red-500 rounded-3xl text-red-500 font-bold hover:bg-red-500 hover:text-white">
            홈으로
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchingResult;
