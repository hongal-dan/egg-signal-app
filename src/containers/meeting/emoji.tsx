"use client";

function Emoji() {
  const socket = useRecoilValue(meetingSocketState);
  const userInfo = useRecoilValue(userState);
  const testName = useRecoilValue(testState); //FIXME 테스트용 랜덤 닉네임 저장, 배포 전에 삭제해야함

  const handleEmojiClick = (emojiIndex: string) => {
    console.log(testName, emojiIndex, "이모티콘 보냅니다");
    socket?.emit("emoji", {
      nickname: testName,
      emojiIndex: emojiIndex,
    });
  };

  return <div></div>;
}

export default Emoji;
