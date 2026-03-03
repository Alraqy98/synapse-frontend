import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { TransitionWipe } from "./TransitionWipe";
import { Scene1Hook } from "./scenes/Scene1Hook";
import { Scene2Intro } from "./scenes/Scene2Intro";
import { Scene3Dashboard } from "./scenes/Scene3Dashboard";
import { Scene4FileViewer } from "./scenes/Scene4FileViewer";
import { Scene5MCQModal } from "./scenes/Scene5MCQModal";
import { Scene6LearningModal } from "./scenes/Scene6LearningModal";
import { Scene7Planner } from "./scenes/Scene7Planner";
import { Scene8Traction } from "./scenes/Scene8Traction";
import { Scene9CTA } from "./scenes/Scene9CTA";

const SCENES = [
  { from: 0, duration: 150, Comp: Scene1Hook },
  { from: 150, duration: 210, Comp: Scene2Intro },
  { from: 360, duration: 210, Comp: Scene3Dashboard },
  { from: 570, duration: 330, Comp: Scene4FileViewer },
  { from: 900, duration: 360, Comp: Scene5MCQModal },
  { from: 1260, duration: 420, Comp: Scene6LearningModal },
  { from: 1680, duration: 120, Comp: Scene7Planner },
  { from: 1800, duration: 300, Comp: Scene8Traction },
  { from: 2100, duration: 600, Comp: Scene9CTA },
];

export const Root: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#0D0F12" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Syne:wght@700&display=swap');
      `}</style>
      {SCENES.map((scene) => {
        const localFrame = frame - scene.from;
        const inRange = localFrame >= 0 && localFrame < scene.duration;
        if (!inRange) return null;
        return (
          <Sequence
            key={scene.from}
            from={scene.from}
            durationInFrames={scene.duration}
            name={`Scene-${scene.from}`}
          >
            <TransitionWipe frame={frame} startFrame={scene.from}>
              <scene.Comp frame={localFrame} />
            </TransitionWipe>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
