import { defineFunction } from '@aws-amplify/backend';

export const buttonEventsApi = defineFunction({
  name: 'buttonEventsApi',
  entry: './handler.js',
  environment: {
    BUTTON_EVENTS_TABLE: 'ButtonEvents'
  },
  timeoutSeconds: 30,
});
