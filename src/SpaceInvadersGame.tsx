import React, { useState, useEffect } from 'react';
import { View, Card, Heading, Text, Flex, Button } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';

// Create a typed client instance to interact with the Amplify Data (GraphQL API)
const client = generateClient<Schema>();

/*SpaceInvadersGame component
  Wraps the canvas game with React and provides UI for leaderboard/stats
 */
const SpaceInvadersGame: React.FC<{ username?: string; signOut?: () => void }> = ({ username, signOut }) => {
  const [highScores, setHighScores] = useState<Array<Schema["HighScore"]["type"]>>([]);

  const saveHighScore = async (username: string, score: number) => {
    await client.models.HighScore.create({
      username,
      score,
      timestamp: Date.now()
    })
  }

useEffect(() => {
  const highScoreSubscription = client.models.HighScore.observeQuery().subscribe({
    next: (data) => { setHighScores([...data.items]) },
  });

  return () => {
    highScoreSubscription.unsubscribe();
  };
}, []);

useEffect(() => {
  const handleGameMessage = (event: MessageEvent) => {
    if (event.data.type === 'GAME_OVER' && username) {
      saveHighScore(username || 'Anonymous', event.data.score);
    }
  };
  
  window.addEventListener('message', handleGameMessage);
  return () => {
    window.removeEventListener('message', handleGameMessage);
  };
}, [username]);

  // Compute global leaderboard: one entry per user (their best score), top 5
  const leaderboard = React.useMemo(() => {
    const bestByUser = highScores.reduce((acc, entry) => {
      const ownerId = ((entry as any).owner as string) || entry.username;
      const existing = acc[ownerId];
      if (!existing || entry.score > existing.score) {
        acc[ownerId] = entry;
      }
      return acc;
    }, {} as Record<string, Schema["HighScore"]["type"]>);

    return Object.values(bestByUser)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [highScores]);

  return (
    <View>
      <Flex direction="row" gap="1rem" wrap="nowrap" justifyContent="space-between" alignItems="flex-start">
        {/* Left Column: Account + Leaderboard (stacked) */}
        <Flex direction="column" gap="1rem" style={{ width: '400px', alignItems: 'stretch' }}>
          <Card
            className="themed-card"
            variation="outlined"
            width="100%"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(250,250,255,0.9))',
              borderRadius: '6px',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 6px 18px rgba(16,24,40,0.06)',
              backdropFilter: 'blur(6px) saturate(120%)',
              WebkitBackdropFilter: 'blur(6px) saturate(120%)'
            }}
          >
            <Heading level={4}>Player</Heading>
            <Text fontSize="0.9rem" marginBottom="0.5rem">
              Signed in as {username}. Click the game, then use the arrow keys (or A/D) to move and Enter to confirm.
            </Text>
            {signOut && (
              <Button onClick={signOut} variation="primary" width="100%" marginBottom="0.5rem">
                Sign out
              </Button>
            )}
          </Card>

          <Card
            className="themed-card"
            variation="outlined"
            width="100%"
            height="500px"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(250,250,255,0.9))',
              borderRadius: '6px',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 6px 18px rgba(16,24,40,0.06)',
              backdropFilter: 'blur(6px) saturate(120%)',
              WebkitBackdropFilter: 'blur(6px) saturate(120%)'
            }}
          >
            <Heading level={4} style={{ marginBottom: '0.5rem' }}>
              <i className="fa-solid fa-crown icon icon-leaderboard" aria-hidden></i>
              Leaderboard
            </Heading>
            {leaderboard.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {leaderboard.map((entry, index) => {
                  const isTopThree = index < 3;
                  let medal = '';
                  let bgColor = 'transparent';
                  let borderColor = '#e0e0e0';

                  if (index === 0) {
                    medal = '🥇';
                    bgColor = 'rgba(255, 215, 0, 0.2)';
                    borderColor = '#ffd700';
                  } else if (index === 1) {
                    medal = '🥈';
                    bgColor = 'rgba(192, 192, 192, 0.2)';
                    borderColor = '#c0c0c0';
                  } else if (index === 2) {
                    medal = '🥉';
                    bgColor = 'rgba(205, 127, 50, 0.2)';
                    borderColor = '#cd7f32';
                  }

                  const isCurrentUser = entry.username === username;

                  return (
                    <div
                      key={entry.id}
                      style={{
                        backgroundColor: isCurrentUser ? 'rgba(100, 108, 255, 0.1)' : bgColor,
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: `2px solid ${isCurrentUser ? '#646cff' : borderColor}`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        fontSize: '0.9rem',
                        fontWeight: isTopThree ? '600' : '400',
                        boxShadow: isTopThree ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
                        gap: '6px'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                        <span style={{ 
                          minWidth: '28px', 
                          fontSize: '1.1rem',
                          color: isTopThree ? borderColor : '#666',
                          fontWeight: '700'
                        }}>
                          {medal || `#${index + 1}`}
                        </span>
                        <span style={{ 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap',
                          flex: 1,
                          color: isCurrentUser ? '#646cff' : '#333'
                        }}>
                          {entry.username}
                        </span>
                      </span>
                      <span style={{ 
                        fontWeight: '700', 
                        color: isTopThree ? borderColor : '#333',
                        fontSize: isTopThree ? '1.05rem' : '0.95rem'
                      }}>
                        {entry.score.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Text fontSize="0.9rem" style={{ color: '#999', fontStyle: 'italic' }}>
                No players yet
              </Text>
            )}
          </Card>
        </Flex>

        
        {/* Game in iframe - Center */}
        <View>
          <iframe
            src="/game/index.html"
            title="Space Invaders Game"
            width="800"
            height="940"
            style={{ border: 'none', display: 'block' }}
          />
        </View>

        {/* Highscores Card - Far Right (personal view, original styling) */}
        <Card
          className="themed-card"
          variation="outlined"
          width="330px"
          height="940px"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(250,250,255,0.9))',
            borderRadius: '6px',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 6px 18px rgba(16,24,40,0.06)',
            backdropFilter: 'blur(6px) saturate(120%)',
            WebkitBackdropFilter: 'blur(6px) saturate(120%)'
          }}
        >
          <Heading level={4} style={{ marginBottom: '0.5rem' }}>
            <i className="fa-solid fa-trophy icon icon-highscore" aria-hidden></i>
            Top Highscores
          </Heading>
          {highScores.length > 0 && username ? (
            (() => {
              const myScores = highScores
                .filter(entry => ((entry as any).owner === username) || entry.username === username)
                .sort((a, b) => b.score - a.score)
                .slice(0, 20);

              return myScores.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {myScores.map((entry, index) => {
                    const ageInSeconds = (Date.now() - entry.timestamp) / 1000;
                    const isNew = ageInSeconds < 10;
                    const isTopThree = index < 3;
                    
                    let medal = '';
                    let bgColor = 'transparent';
                    let borderColor = '#e0e0e0';
                    
                    if (isNew) {
                      bgColor = 'rgba(255, 0, 0, 0.15)';
                      borderColor = '#ff6b6b';
                    } else if (isTopThree) {
                      if (index === 0) {
                        medal = '🥇';
                        bgColor = 'rgba(255, 215, 0, 0.15)';
                        borderColor = '#ffd700';
                      } else if (index === 1) {
                        medal = '🥈';
                        bgColor = 'rgba(192, 192, 192, 0.15)';
                        borderColor = '#c0c0c0';
                      } else {
                        medal = '🥉';
                        bgColor = 'rgba(205, 127, 50, 0.15)';
                        borderColor = '#cd7f32';
                      }
                    }

                    return (
                      <div
                        key={entry.id}
                        style={{
                          backgroundColor: bgColor,
                          padding: '6px 10px',
                          borderRadius: '4px',
                          border: `1px solid ${borderColor}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.85rem',
                          fontWeight: isTopThree ? '600' : '400',
                          boxShadow: isNew ? '0 2px 4px rgba(255,0,0,0.2)' : isTopThree ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                          <span style={{ 
                            minWidth: '32px', 
                            color: isTopThree ? borderColor : '#666',
                            fontWeight: '600'
                          }}>
                            {medal || `#${index + 1}`}
                          </span>
                          <span style={{ 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap',
                            flex: 1
                          }}>
                            {entry.username}
                          </span>
                        </span>
                        <span style={{ 
                          fontWeight: '700', 
                          color: isTopThree ? borderColor : '#333',
                          marginLeft: '12px',
                          fontSize: isTopThree ? '1rem' : '0.9rem'
                        }}>
                          {entry.score.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Text fontSize="0.9rem" style={{ color: '#999', fontStyle: 'italic' }}>
                  You don't have any scores yet
                </Text>
              );
            })()
          ) : (
            null
          )}
        </Card>
      </Flex>
    </View>
  );
};

export default SpaceInvadersGame;
