import React from "react";
import Image from "next/image";

const data = [
  {
    title: "1. 아바타 선택",
    imgUrl: "avatar_choice",
    description: "미팅에 입장하면 사용하고 싶은 가면을 선택합니다.",
  },
  {
    title: "2. 자기소개",
    imgUrl: "introduce",
    description:
      "모든 참여자들이 돌아가며 자기소개를 합니다. 본인의 취향이나 MBTI, 취미 등을 소개하며 자신을 표현해보세요!",
  },
  {
    title: "3. 랜덤 질문",
    imgUrl: "random_question",
    description:
      "랜덤으로 한 명의 참여자가 선택됩니다. 선택된 사람은 질문에 답해주세요.",
  },
  {
    title: "4. 1차 선택과 1:1 대화",
    imgUrl: "cupid",
    description:
      "더 알아가고 싶은 사람을 선택하세요. 서로 선택한 경우, 잠시 둘만의 대화를 나눌 수 있어요.",
  },
  {
    title: "5. 얼굴 공개",
    imgUrl: "open_cam",
    description: "가면으로 가려져 있던 서로의 얼굴이 공개됩니다.",
  },
  {
    title: "6. 사생대회",
    imgUrl: "drawing",
    description:
      "주어진 키워드에 대한 그림을 그리고 마음에 드는 그림을 투표하세요. 가장 많은 표를 받은 참여자는 1:1로 대화하고 싶은 참여자를 선택할 수 있어요.",
  },
  {
    title: "7. 최종 선택",
    imgUrl: "matcing",
    description:
      "마지막 선택입니다. 마음에 드는 참여자를 선택하세요. 서로 선택한 경우, 1:1 개인 대화방으로 이동하거나 친구 신청을 할 수 있습니다.❗친구 신청은 최종 매칭된 경우에만 가능해요!",
  },
];

interface StepProps {
  title: string;
  imgUrl: string;
  description: string;
}

const Step: React.FC<StepProps> = ({ title, imgUrl, description }) => {
  return (
    <div>
      <p className="font-bold text-2xl mb-3">{title}</p>
      <div className="flex justify-center">
        <Image
          src={`/img/tutorial/${imgUrl}.png`}
          alt={`${imgUrl}`}
          width={400}
          height={200}
          className="rounded-2xl"
        />
      </div>
      <p className="text-xl text-gray-700 mt-5">{description}</p>
    </div>
  );
};

const Steps = [
  <Step
    key={data[0].title}
    title={data[0].title}
    imgUrl={data[0].imgUrl}
    description={data[0].description}
  />,
  <Step
    key={data[1].title}
    title={data[1].title}
    imgUrl={data[1].imgUrl}
    description={data[1].description}
  />,
  <Step
    key={data[2].title}
    title={data[2].title}
    imgUrl={data[2].imgUrl}
    description={data[2].description}
  />,
  <Step
    key={data[3].title}
    title={data[3].title}
    imgUrl={data[3].imgUrl}
    description={data[3].description}
  />,
  <Step
    key={data[4].title}
    title={data[4].title}
    imgUrl={data[4].imgUrl}
    description={data[4].description}
  />,
  <Step
    key={data[5].title}
    title={data[5].title}
    imgUrl={data[5].imgUrl}
    description={data[5].description}
  />,
  <Step
    key={data[6].title}
    title={data[6].title}
    imgUrl={data[6].imgUrl}
    description={data[6].description}
  />,
];

export default Steps;
