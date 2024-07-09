"use client";
import React, { useState } from "react";
import { GrFormPreviousLink, GrFormNextLink } from "react-icons/gr";
import Steps from "./Steps";

const Tutorial = () => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const handlePrev = () => {
    setCurrentStep(prevStep => (prevStep - 1 + Steps.length) % Steps.length);
  };

  const handleNext = () => {
    setCurrentStep(prevStep => (prevStep + 1) % Steps.length);
  };

  const handleMouseEnter = () => {
    setShowTutorial(true);
  };

  const handleMouseLeave = () => {
    setShowTutorial(false);
  };
  return (
    <div
      className="fixed top-10 left-[-350px] w-[400px] bg-amber-100 rounded-3xl shadow-md transition-all duration-300 hover:left-5"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {!showTutorial && (
        <p className="text-md text-end mr-3 my-2 pr-1">
          가<br />이<br />드
        </p>
      )}
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
