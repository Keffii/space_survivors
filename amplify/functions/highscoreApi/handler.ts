import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

const GRAPHQL_ENDPOINT = process.env.API_ENDPOINT as string;
const GRAPHQL_API_KEY = process.env.API_KEY as string;

interface HighScoreItem {
  username: string;
  score: number;
  timestamp: number;
}

interface GraphQLResponse {
  data?: {
    listHighScores?: {
      items: HighScoreItem[];
      nextToken?: string;
    };
  };
  errors?: Array<{ message: string }>;
}

export const handler: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
  const qs = event.queryStringParameters || {};
  const limit = qs.limit ? Number(qs.limit) : 10;

  const query = `
    query ListHighScores($nextToken: String) {
      listHighScores(nextToken: $nextToken, limit: 1000) {
        items {
          username
          score
          timestamp
        }
        nextToken
      }
    }
  `;

  const items: HighScoreItem[] = [];
  let nextToken: string | undefined;

  try {
    do {
      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'x-api-key': GRAPHQL_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          variables: { nextToken }
        })
      });

      const result = await response.json() as GraphQLResponse;
      
      if (result.errors) {
        console.error('GraphQL errors:', result.errors);
        return { statusCode: 500, body: JSON.stringify({ error: 'GraphQL error', details: result.errors }) };
      }

      if (result.data?.listHighScores?.items) {
        items.push(...result.data.listHighScores.items);
      }
      nextToken = result.data?.listHighScores?.nextToken;
    } while (nextToken);
  } catch (err) {
    console.error('Fetch error', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'fetch error' }) };
  }

  // Sort by score descending and take top N
  items.sort((a, b) => (b.score || 0) - (a.score || 0));
  const top = items.slice(0, limit);

  return {
    statusCode: 200,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ scores: top })
  };
};
