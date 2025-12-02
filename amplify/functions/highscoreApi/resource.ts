import { defineFunction } from '@aws-amplify/backend';

export const highscoreApi = defineFunction({
  name: 'highscoreApi',
  entry: './handler.js',
  environment: {
    HIGHSCORE_TABLE: 'HighScore'
  },
  timeoutSeconds: 30,
});
