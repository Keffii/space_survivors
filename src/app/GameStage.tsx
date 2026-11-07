import { useLayoutEffect, useRef, useState } from 'react';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 940;
/** Space kept free above and below the game: the top bar plus page padding. */
const VERTICAL_CHROME = 64 + 48;

/**
 * The game iframe, scaled down proportionally so the whole game fits the
 * window (never scaled up). The game itself is unchanged.
 */
export function GameStage() {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const update = () => {
      const byWidth = box.clientWidth / GAME_WIDTH;
      const byHeight = Math.max(window.innerHeight - VERTICAL_CHROME, 360) / GAME_HEIGHT;
      setScale(Math.min(1, byWidth, byHeight));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(box);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div className="game-stage" ref={boxRef}>
      <p className="game-touch-note">SpaceSurvivors is played with a keyboard. Open it on a computer to play.</p>
      <div className="game-frame" style={{ width: GAME_WIDTH * scale, height: GAME_HEIGHT * scale }}>
        <iframe
          src="/game/index.html"
          title="SpaceSurvivors game"
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          style={{ transform: `scale(${scale})` }}
        />
      </div>
    </div>
  );
}
