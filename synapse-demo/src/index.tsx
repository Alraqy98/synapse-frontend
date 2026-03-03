import "../../src/index.css";
import "../../src/styles.css";
import React from "react";
import { Composition, registerRoot } from "remotion";
import { Root } from "./Root";
import { DURATION_FRAMES, FPS } from "./brand";

const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SynapseDemo"
        component={Root}
        durationInFrames={DURATION_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
};

registerRoot(RemotionRoot);
