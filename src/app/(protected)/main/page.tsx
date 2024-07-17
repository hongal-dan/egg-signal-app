import { Suspense } from "react";
import MainContent from "@/containers/main/MainContent";
import Loading from "@/containers/main/Loading";

const Main = () => {

  return (
    <Suspense fallback={<Loading />}>
      <MainContent />
    </Suspense>
  );
};

export default Main;
