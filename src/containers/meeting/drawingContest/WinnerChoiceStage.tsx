import React from "react";
import RenderWinnerChoiceOptions from "./RenderWinnerChoiceOptions";

interface WinnerChoiceStageProps {
  testName: string;
  voteResults: string | null;
  drawings: Record<string, string>;
  capturedPhoto: Record<string, string>;
  selectedUser: string | null;
  handleWinnerPrizeSubmit: (user: string, otherUsers: string[]) => void;
  timeLeft: number;
}

const WinnerChoiceStage: React.FC<WinnerChoiceStageProps> = ({
  testName,
  voteResults,
  drawings,
  capturedPhoto,
  selectedUser,
  handleWinnerPrizeSubmit,
  timeLeft,
}) => {
  return (
    <>
      {testName !== voteResults && (
        <div>
          <div className="flex flex-col items-center">
            <div className="mb-4 text-2xl font-bold ">1등 {voteResults}</div>
            <div>
              <img
                src={drawings[voteResults!]}
                className="w-[365px] h-[324px] object-cover rounded-2xl"
                alt={`Drawing by ${voteResults}`}
              />
            </div>
          </div>
        </div>
      )}

      {testName === voteResults && (
        <div className="flex flex-col items-center">
          <h3 className="text-lg font-semibold mb-2">
            누구와 대화하고 싶나요?
          </h3>
          <div className="flex flex-col items-end">
            <span>남은 시간: {timeLeft}초</span>
            <div className="flex gap-2 mb-5 w-full">
              <RenderWinnerChoiceOptions
                capturedPhoto={capturedPhoto}
                voteResults={voteResults}
                selectedUser={selectedUser}
                handleWinnerPrizeSubmit={handleWinnerPrizeSubmit}
                winnerName={testName}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WinnerChoiceStage;
