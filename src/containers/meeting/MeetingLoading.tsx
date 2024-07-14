import React, { forwardRef, useImperativeHandle, useRef } from "react";

const MeetingLoading = forwardRef((_, ref) => {
  const innerRef = useRef<HTMLDivElement>(null); // 내부 ref 생성

  // ref를 통해 외부에서 접근 가능한 속성 정의
  useImperativeHandle(ref, () => ({
    get innerHTML() {
      return innerRef.current?.innerHTML;
    },
    set innerHTML(value) {
      if (innerRef.current) {
        innerRef.current.innerHTML = value as string;
      }
    },
  }));

  return (
    <div className="w-[100vw] h-[100vh] flex flex-col justify-center items-center gap-24">
      <div className="flex flex-col items-center gap-4 text-3xl" ref={innerRef}>
        <p>다른 사람들의 접속을 기다리고 있습니다</p>
        <p>잠시만 기다려주세요</p>
      </div>
      <span className="pan"></span>
    </div>
  );
});

MeetingLoading.displayName = "MeetingLoading";

export default MeetingLoading;
