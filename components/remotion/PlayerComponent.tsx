"use client";

import { Player } from "@remotion/player";
import { MyComposition } from "./MyComposition";

export const PlayerComponent = ({ videoUrl, captions }: { videoUrl: string, captions: string }) => {
    return (
        <Player
            component={MyComposition}
            inputProps={{ videoUrl, captions }}
            durationInFrames={30 * 30} // 30 seconds
            compositionWidth={1280}
            compositionHeight={720}
            fps={30}
            style={{
                width: '100%',
                aspectRatio: '16/9',
            }}
            controls
        />
    );
};
