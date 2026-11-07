import type { ReactNode } from 'react';
import { ChartIcon, KeyboardIcon, TrophyIcon } from '../auth/icons';
import type { LeaderboardEntry, Score } from './useHighScores';

const LEADERBOARD_SIZE = 10;
const MY_SCORES_SIZE = 10;
const NEW_SCORE_MS = 15_000;

const numberFormat = new Intl.NumberFormat('en');
const relativeFormat = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

function timeAgo(ms: number): string {
  const seconds = Math.round((ms - Date.now()) / 1000);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return relativeFormat.format(Math.round(seconds / size), unit);
  }
  return 'just now';
}

function PanelHeader({ id, icon, title, meta }: { id: string; icon: ReactNode; title: string; meta?: string }) {
  return (
    <header className="panel__header">
      <span className="panel__icon">{icon}</span>
      <h2 className="panel__title" id={id}>
        {title}
      </h2>
      {meta && <span className="panel__meta">{meta}</span>}
    </header>
  );
}

function SkeletonRows({ count }: { count: number }) {
  return (
    <ul className="rows" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="row row--skeleton">
          <span />
          <span />
        </li>
      ))}
    </ul>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const tier = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : undefined;
  return <span className={`rank${tier ? ` rank--${tier}` : ''}`}>{rank}</span>;
}

export function LeaderboardPanel({ loaded, ranking }: { loaded: boolean; ranking: LeaderboardEntry[] }) {
  const top = ranking.slice(0, LEADERBOARD_SIZE);
  const me = ranking.find((e) => e.isMe);
  const meOutsideTop = me && me.rank > LEADERBOARD_SIZE;

  return (
    <section className="panel" aria-labelledby="leaderboard-title">
      <PanelHeader id="leaderboard-title" icon={<TrophyIcon width={18} height={18} />} title="Leaderboard" meta="Best per player" />
      {!loaded ? (
        <SkeletonRows count={5} />
      ) : top.length === 0 ? (
        <p className="empty">No scores yet. Finish a round to take the top spot.</p>
      ) : (
        <ol className="rows">
          {top.map((e) => (
            <li key={e.key} className={`row${e.isMe ? ' row--me' : ''}`}>
              <RankBadge rank={e.rank} />
              <span className="row__name">
                {e.username}
                {e.isMe && <span className="you">You</span>}
              </span>
              <span className="row__score">{numberFormat.format(e.score)}</span>
            </li>
          ))}
          {meOutsideTop && me && (
            <li className="row row--me row--detached">
              <RankBadge rank={me.rank} />
              <span className="row__name">
                {me.username}
                <span className="you">You</span>
              </span>
              <span className="row__score">{numberFormat.format(me.score)}</span>
            </li>
          )}
        </ol>
      )}
    </section>
  );
}

type StatsProps = {
  loaded: boolean;
  myScores: Score[];
  myBest: number | null;
  myRank: number | null;
  players: number;
};

export function StatsPanel({ loaded, myScores, myBest, myRank, players }: StatsProps) {
  const tiles = [
    { label: 'Best score', value: myBest === null ? '—' : numberFormat.format(myBest) },
    { label: 'Games', value: numberFormat.format(myScores.length) },
    { label: 'Rank', value: myRank === null ? '—' : `#${myRank}`, hint: myRank === null ? undefined : `of ${players}` },
  ];
  const newestTimestamp = myScores.reduce((max, s) => Math.max(max, s.timestamp), 0);

  return (
    <section className="panel" aria-labelledby="stats-title">
      <PanelHeader id="stats-title" icon={<ChartIcon width={18} height={18} />} title="Your stats" />

      <dl className="stats">
        {tiles.map((t) => (
          <div key={t.label} className="stat">
            <dt>{t.label}</dt>
            <dd>
              {loaded ? t.value : <span className="stat__skeleton" />}
              {loaded && t.hint && <span className="stat__hint">{t.hint}</span>}
            </dd>
          </div>
        ))}
      </dl>

      <h3 className="panel__subtitle">Your top scores</h3>
      {!loaded ? (
        <SkeletonRows count={4} />
      ) : myScores.length === 0 ? (
        <p className="empty">Your scores show up here after your first game.</p>
      ) : (
        <ol className="rows">
          {myScores.slice(0, MY_SCORES_SIZE).map((s, i) => {
            const isNew = s.timestamp === newestTimestamp && Date.now() - s.timestamp < NEW_SCORE_MS;
            return (
              <li key={s.id} className={`row${isNew ? ' row--new' : ''}`}>
                <RankBadge rank={i + 1} />
                <span className="row__name row__name--muted">
                  {timeAgo(s.timestamp)}
                  {isNew && <span className="new">New</span>}
                </span>
                <span className="row__score">{numberFormat.format(s.score)}</span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

const CONTROLS: Array<{ keys: string[][]; action: string }> = [
  { keys: [['←', '→'], ['A', 'D']], action: 'Move' },
  { keys: [['↑', '↓'], ['W', 'S']], action: 'Choose an upgrade' },
  { keys: [['Enter'], ['E']], action: 'Confirm' },
  { keys: [['R']], action: 'Restart after game over' },
];

export function HowToPlayPanel() {
  return (
    <section className="panel" aria-labelledby="howto-title">
      <PanelHeader id="howto-title" icon={<KeyboardIcon width={18} height={18} />} title="How to play" />
      <p className="panel__text">Click the game first so it receives your key presses.</p>
      <ul className="controls">
        {CONTROLS.map((c) => (
          <li key={c.action}>
            <span className="controls__keys">
              {c.keys.map((group, gi) => (
                <span key={gi} className="controls__group">
                  {gi > 0 && <span className="controls__or">or</span>}
                  {group.map((k) => (
                    <kbd key={k}>{k}</kbd>
                  ))}
                </span>
              ))}
            </span>
            <span className="controls__action">{c.action}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
