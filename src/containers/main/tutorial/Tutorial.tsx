"use client";
import React, { useState } from "react";
import { GrFormPreviousLink, GrFormNextLink } from "react-icons/gr";
import { IoRemoveOutline } from "react-icons/io5";
import { GoChevronDown } from "react-icons/go";
import Steps from "./Steps";

const Tutorial = () => {
  const [showTutorial, setShowTutorial] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  const handlePrev = () => {
    setCurrentStep(prevStep => (prevStep - 1 + Steps.length) % Steps.length);
  };

  const handleNext = () => {
    setCurrentStep(prevStep => (prevStep + 1) % Steps.length);
  };
  return (
    <div className="fixed top-10 left-10 w-[400px] bg-amber-100 rounded-3xl">
      <p className="font-bold text-2xl text-center my-5">
        에그팅 사용 방법
        <button
          className="absolute right-3 top-6"
          onClick={() => setShowTutorial(prev => !prev)}
        >
          {showTutorial ? <IoRemoveOutline /> : <GoChevronDown />}
        </button>
      </p>
      <div className={`${!showTutorial && "hidden"}`}>
        <div className="h-[550px] p-5">{Steps[currentStep]}</div>
        <div className="absolute bottom-0 w-full flex justify-center">
          <button onClick={handlePrev}>
            <GrFormPreviousLink className="w-[50px] h-[50px]" />
          </button>
          <button onClick={handleNext}>
            <GrFormNextLink className="w-[50px] h-[50px]" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;
