import { CommonSocketProvider } from "@/contexts/CommonSocketContext";

const MainLayout: React.FC = ({ children }) => {
  return <CommonSocketProvider>{children}</CommonSocketProvider>;
};

export default MainLayout;
