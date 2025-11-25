import React, { useState, useEffect } from 'react';
import { View, Card, Heading, Text, Flex } from '@aws-amplify/ui-react';
// Import the Amplify Gen 2 data client generator for making database requests
import { generateClient } from 'aws-amplify/data';
// Import the TypeScript schema types generated from amplify/data/resource.ts
import type { Schema } from '../amplify/data/resource';

// Create a typed client instance to interact with the Amplify Data (GraphQL API)
const client = generateClient<Schema>();

/*SpaceInvadersGame component
  Wraps the canvas game with React and provides UI for leaderboard/stats
 */
const SpaceInvadersGame: React.FC<{ username?: string }> = ({ username }) => {
  const [highScores, setHighScores] = useState<Array<Schema["HighScore"]["type"]>>([]);

  const saveHighScore = async (username: string, score: number) => {
    await client.models.HighScore.create({
      username,
      score,
      timestamp: Date.now()
    })
  }

useEffect(() => {
  client.models.HighScore.observeQuery().subscribe({
    next: (data) => { setHighScores([...data.items]) },
  });
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

  // TODO: Track active players from database


  // TODO: Fetch leaderboard data from database
  return (
    <View padding="1rem">
      <Flex direction="row" gap="1rem" wrap="nowrap" justifyContent="space-between" alignItems="flex-start">
        {/* Leaderboard Card - Far Left */}
        <Card variation="outlined" width="200px" height="940px">
          <Heading level={4}>Leaderboard</Heading>
          <Text fontSize="0.9rem">#1, User1: 24</Text>
          <Text fontSize="0.9rem">#1, User2: 24</Text>
          <Text fontSize="0.9rem">#2, User3: 18</Text>
        </Card>

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

        {/* Highscores Card - Far Right */}
        <Card variation="outlined" width="200px" height="940px">
          <Heading level={4}>HighScore</Heading>
          {highScores.length > 0 ? (
            highScores
              .sort((a, b) => b.score - a.score) // Sort by score descending
              .slice(0, 10) // Show top 10
              .map((entry, index) => (
                <Text key={entry.id} fontSize="0.9rem">
                  #{index + 1} {entry.username}: {entry.score}
                </Text>
              ))
          ) : (
            <Text fontSize="0.9rem">No scores yet</Text>
          )}
        </Card>
      </Flex>
    </View>
  );
};

export default SpaceInvadersGame;
