import dynamic from "next/dynamic";

const VisualizeComponent = dynamic(() => import("../components/visualizecomponent"), {
  ssr: false,
});

export default VisualizeComponent;