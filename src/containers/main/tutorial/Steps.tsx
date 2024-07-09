import React from "react";
import Image from "next/image";

const StepOne = () => (
  <div>
    <p className="font-bold text-2xl mb-3">1. 아바타 선택</p>
    <div className="flex justify-center">
      <Image
        src="/img/tutorial/avatar_choice.png"
        alt="avatar_choice"
        width={400}
        height={200}
        className="rounded-2xl"
      />
    </div>
    <p className="text-xl text-gray-700 mt-5">
      미팅에 입장하면 사용하고 싶은 가면을 선택합니다.
    </p>
  </div>
);

const StepTwo = () => (
  <div>
    <p className="font-bold text-2xl mb-3">2. 자기소개</p>
    <div className="flex justify-center">
      <Image
        src="/img/tutorial/introduce.png"
        alt="introduce"
        width={400}
        height={200}
        className="rounded-2xl"
      />
    </div>
    <p className="text-xl text-gray-700 mt-5">
      모든 참여자들이 돌아가며 자기소개를 합니다. 본인의 취향이나 MBTI, 취미
      등을 소개하며 자신을 표현해보세요!
    </p>
  </div>
);

const StepThree = () => (
  <div>
    <p className="font-bold text-2xl mb-3">3. 랜덤 질문</p>
    <div className="flex justify-center">
      <Image
        src="/img/tutorial/random_question.png"
        alt="random_question"
        width={400}
        height={200}
        className="rounded-2xl"
      />
    </div>
    <p className="text-xl text-gray-700 mt-5">
      랜덤으로 한 명의 참여자가 선택됩니다. 선택된 사람은 질문에 답해주세요
    </p>
  </div>
);

const StepFour = () => (
  <div>
    <p className="font-bold text-2xl mb-3">4. 1차 선택과 1:1 대화</p>
    <div className="flex justify-center">
      <Image
        src="/img/tutorial/cupid01.png"
        alt="cupid01"
        width={400}
        height={200}
        className="rounded-2xl"
      />
    </div>
    <p className="text-xl text-gray-700 mt-5">
      더 알아가고 싶은 사람을 선택하세요. 서로 선택한 경우, 잠시 둘만의 대화를
      나눌 수 있어요.
    </p>
  </div>
);

const StepFive = () => (
  <div>
    <p className="font-bold text-2xl mb-3">5. 얼굴 공개</p>
    <div className="flex justify-center">
      <Image
        src="/img/tutorial/open_cam.png"
        alt="open_cam"
        width={400}
        height={200}
        className="rounded-2xl"
      />
    </div>
    <p className="text-xl text-gray-700 mt-5">
      가면으로 가려져 있던 서로의 얼굴이 공개됩니다.
    </p>
  </div>
);

const StepSix = () => (
  <div>
    <p className="font-bold text-2xl mb-3">6. 사생대회</p>
    <div className="flex justify-center">
      <Image
        src="/img/tutorial/drawing.png"
        alt="drawing"
        width={400}
        height={200}
        className="rounded-2xl"
      />
    </div>
    <p className="text-xl text-gray-700 mt-5">
      주어진 키워드에 대한 그림을 그리고 마음에 드는 그림을 투표하세요. 가장
      많은 표를 받은 참여자는 1:1로 대화하고 싶은 참여자를 선택할 수 있어요.
    </p>
  </div>
);

const StepSeven = () => (
  <div>
    <p className="font-bold text-2xl mb-3">7. 최종 선택</p>
    <div className="flex justify-center">
      <Image
        src="/img/tutorial/matcing.png"
        alt="matcing"
        width={400}
        height={200}
        className="rounded-2xl"
      />
    </div>
    <p className="text-xl text-gray-700 mt-5">
      마지막 선택입니다. 마음에 드는 참여자를 선택하세요. 서로 선택한 경우, 1:1
      개인 대화방으로 이동하거나 친구 신청을 할 수 있습니다.
    </p>
    <p className="text-lg text-gray-700 mt-5">
      ❗친구 신청은 최종 매칭된 경우에만 가능해요!
    </p>
  </div>
);

const Steps = [
  <StepOne key="step1" />,
  <StepTwo key="step2" />,
  <StepThree key="step3" />,
  <StepFour key="step4" />,
  <StepFive key="step5" />,
  <StepSix key="step6" />,
  <StepSeven key="step7" />,
];

export default Steps;
