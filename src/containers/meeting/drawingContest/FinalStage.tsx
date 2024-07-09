import React from "react";
import { PiCrownSimpleDuotone } from "react-icons/pi";

interface FinalResultsStageProps {
  finalResults: {
    winners: string[];
    losers: string[];
  };
  capturedPhoto: Record<string, string>;
}

const FinalResultsStage: React.FC<FinalResultsStageProps> = ({
  finalResults,
  capturedPhoto,
}) => {
  return (
    <div className="flex flex-col items-center">
      <h2 className="text-xl font-bold mb-4">최종 결과</h2>
      <div className="flex flex-col items-center">
        <div className="flex gap-4 mb-4">
          {finalResults.winners.map((winner, index) => (
            <div
              key={index}
              className="w-full relative border rounded-2xl p-1 bg-white shadow-md"
            >
              <img
                src={capturedPhoto[winner]}
                className="w-full h-full object-cover rounded-2xl"
                alt={`Winner ${winner}`}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-center py-1 rounded-b-2xl">
                {winner}
              </div>
              {index === 0 && (
                <div className="absolute top-0 left-0 p-2">
                  <PiCrownSimpleDuotone className="text-yellow-400 text-3xl" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        {finalResults.losers.length === 5
          ? "1등은 아무도 선택하지 않았습니다"
          : "좋은 시간 되세요"}
      </div>
    </div>
  );
};

export default FinalResultsStage;
