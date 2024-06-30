import { CommonSocketProvider } from "@/contexts/CommonSocketContext";

const MeetingLayout: React.FC = ({ children }) => {
  return <CommonSocketProvider>{children}</CommonSocketProvider>;
};

export default MeetingLayout;
