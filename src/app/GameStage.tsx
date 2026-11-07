import { useLayoutEffect, useRef, useState } from 'react';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 940;
/** Same query as the "fit one screen" block in app.css. */
const FIT_QUERY = '(min-width: 900px) and (min-height: 600px)';
/** When the page scrolls (phones): space kept free for the top bar and padding. */
const SCROLL_CHROME = 64 + 48;

/**
 * The game iframe, scaled down proportionally to the space it has (never
 * scaled up). On desktop that's the height left between the top bar and the
 * footer, so the whole page fits one screen. The game itself is unchanged.
 */
export function GameStage() {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const fit = window.matchMedia(FIT_QUERY);

    const update = () => {
      const availableHeight = fit.matches ? box.clientHeight : window.innerHeight - SCROLL_CHROME;
      const byWidth = box.clientWidth / GAME_WIDTH;
      const byHeight = Math.max(availableHeight, 320) / GAME_HEIGHT;
      setScale(Math.min(1, byWidth, byHeight));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(box);
    window.addEventListener('resize', update);
    fit.addEventListener('change', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
      fit.removeEventListener('change', update);
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
