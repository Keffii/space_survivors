import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  HighScore: a
    .model({
      username: a.string().required(),
      score: a.integer().required(),
      timestamp: a.timestamp().required()
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read']), // All logged in users can read all scores
      allow.publicApiKey()
    ]),
});


export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 365,
    },
  },
});