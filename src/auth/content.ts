// Text and images for the showcase panel on the auth screens.

export const APP_NAME = 'SpaceSurvivors';
export const LOGO_SRC = '/showcase/ship.png';
export const SOURCE_URL = 'https://github.com/Keffii/space_survivors';
export const CREDITS = 'Pixel art by CraftPix';

export const HEADLINE = 'Survive the swarm. Climb the leaderboard.';
export const DESCRIPTION =
  'SpaceSurvivors is a retro arcade shooter that runs in your browser. ' +
  "It's a full-stack project: a React and TypeScript frontend on a serverless AWS backend.";

export type FeatureIcon = 'trophy' | 'gamepad' | 'cloud';

export const FEATURES: Array<{ icon: FeatureIcon; title: string; text: string }> = [
  {
    icon: 'trophy',
    title: 'Live leaderboard',
    text: 'Scores reach every open browser in real time through AppSync GraphQL subscriptions.',
  },
  {
    icon: 'gamepad',
    title: 'Canvas game',
    text: 'HTML Canvas rendering with sprite animation, power-ups, XP and collision detection.',
  },
  {
    icon: 'cloud',
    title: 'Serverless AWS backend',
    text: 'Cognito sign-in, DynamoDB storage and Lambda, all defined as code.',
  },
];

export const TECH_STACK = [
  'React',
  'TypeScript',
  'Vite',
  'HTML Canvas',
  'AWS Amplify',
  'Cognito',
  'AppSync',
  'DynamoDB',
  'Lambda',
];

export const SHOWCASE_IMAGES = [
  { src: '/showcase/ship.png', alt: 'The player spaceship', kind: 'sprite' },
  { src: '/showcase/scene.png', alt: 'The ship firing at slimes over a pink sky', kind: 'scene' },
  { src: '/showcase/slime.png', alt: 'A slime enemy', kind: 'sprite' },
] as const;
