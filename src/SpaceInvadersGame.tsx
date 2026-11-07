import { useEffect } from 'react';
import { AccountMenu } from './app/AccountMenu';
import { GameStage } from './app/GameStage';
import { HowToPlayPanel, LeaderboardPanel, StatsPanel } from './app/Panels';
import { useHighScores } from './app/useHighScores';
import { APP_NAME, CREDITS, LOGO_SRC, SOURCE_URL } from './auth/content';
import { GitHubIcon } from './auth/icons';
import './app/app.css';

type Props = { username: string; signOut: () => void };

/** Signed-in page: top bar, the game in the middle, leaderboard and stats around it. */
export default function SpaceInvadersGame({ username, signOut }: Props) {
  const { loaded, saveScore, ranking, myScores, myBest, myRank, players } = useHighScores(username);

  // The game posts { type: 'GAME_OVER', score } to this window when a round ends.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'GAME_OVER' && typeof event.data.score === 'number') {
        saveScore(event.data.score);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [saveScore]);

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__inner">
          <div className="brand">
            <img src={LOGO_SRC} alt="" width={32} height={32} className="brand__logo" />
            <span>{APP_NAME}</span>
          </div>
          <AccountMenu username={username} onSignOut={signOut} />
        </div>
      </header>

      <main className="layout">
        <div className="layout__game">
          <GameStage />
        </div>
        <div className="layout__left">
          <LeaderboardPanel loaded={loaded} ranking={ranking} />
          <HowToPlayPanel />
        </div>
        <div className="layout__right">
          <StatsPanel loaded={loaded} myScores={myScores} myBest={myBest} myRank={myRank} players={players} />
        </div>
      </main>

      <footer className="app-footer">
        <span>{CREDITS}</span>
        <span aria-hidden="true">·</span>
        <a href={SOURCE_URL} target="_blank" rel="noreferrer">
          <GitHubIcon width={16} height={16} />
          View the source on GitHub
        </a>
      </footer>
    </div>
  );
}
