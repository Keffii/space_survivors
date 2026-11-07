import { useCallback, useEffect, useMemo, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export type Score = Schema['HighScore']['type'];

/** Every HighScore row has an implicit `owner` ("<sub>::<username>") from owner auth. */
function playerKey(s: Score): string {
  return (s as Score & { owner?: string | null }).owner || s.username;
}

export type LeaderboardEntry = { rank: number; key: string; username: string; score: number; isMe: boolean };

export function useHighScores(username: string) {
  const [scores, setScores] = useState<Score[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Missing when amplify_outputs.json has no data models (e.g. a stale local config).
    if (!client.models?.HighScore) {
      setLoaded(true);
      return;
    }
    const sub = client.models.HighScore.observeQuery().subscribe({
      next: ({ items, isSynced }) => {
        setScores([...items]);
        if (isSynced || items.length > 0) setLoaded(true);
      },
      error: () => setLoaded(true),
    });
    return () => sub.unsubscribe();
  }, []);

  const saveScore = useCallback(
    (score: number) => client.models.HighScore.create({ username, score, timestamp: Date.now() }),
    [username],
  );

  const derived = useMemo(() => {
    const me = username.toLowerCase();
    const isMine = (s: Score) => s.username.toLowerCase() === me;

    // One entry per player: their best score.
    const best = new Map<string, Score>();
    for (const s of scores) {
      const key = playerKey(s);
      const current = best.get(key);
      if (!current || s.score > current.score) best.set(key, s);
    }
    const ranking: LeaderboardEntry[] = [...best.entries()]
      .sort(([, a], [, b]) => b.score - a.score)
      .map(([key, s], i) => ({ rank: i + 1, key, username: s.username, score: s.score, isMe: isMine(s) }));

    const mine = scores.filter(isMine).sort((a, b) => b.score - a.score);

    return {
      ranking,
      myScores: mine,
      myBest: mine[0]?.score ?? null,
      myRank: ranking.find((e) => e.isMe)?.rank ?? null,
      players: ranking.length,
    };
  }, [scores, username]);

  return { loaded, saveScore, ...derived };
}
