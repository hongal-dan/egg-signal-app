import React from "react";
import RenderDrawings from "@/containers/meeting/drawingContest/RenderDrawings";

interface VotingStageProps {
  drawings: Record<string, string>;
  selectedUser: string | null;
  handleVoteSubmit: (votedUser: string) => void;
  timeLeft: number;
}

const VotingStage: React.FC<VotingStageProps> = ({
  drawings,
  selectedUser,
  handleVoteSubmit,
  timeLeft,
}) => {
  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-4">어떤 그림이 마음에 드나요?</h2>
      <div className="flex flex-col items-end">
        <div className="mb-4 text-l">
          <span>남은 시간: {timeLeft}초</span>
        </div>
        <div className="flex flex-wrap justify-center gap-2 mb-5 w-full rounded-lg">
          <RenderDrawings
            drawings={drawings}
            selectedUser={selectedUser}
            handleVoteSubmit={handleVoteSubmit}
          />
        </div>
      </div>
    </div>
  );
};

export default VotingStage;
