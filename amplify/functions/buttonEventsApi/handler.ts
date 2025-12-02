import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

const GRAPHQL_ENDPOINT = process.env.API_ENDPOINT as string;
const GRAPHQL_API_KEY = process.env.API_KEY as string;

interface ButtonEventItem {
  device_id: string;
  timestamp: number;
  btn: string;
  action: string;
  owner: string;
}

interface GraphQLResponse {
  data?: {
    listButtonEvents?: {
      items: ButtonEventItem[];
      nextToken?: string;
    };
  };
  errors?: Array<{ message: string }>;
}

function floorToMinute(ts: number): number {
  return Math.floor(ts / 60000) * 60000;
}

export const handler: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
  const qs = event.queryStringParameters || {};
  const startTs = qs.start ? Number(qs.start) : Date.now() - 60 * 60 * 1000;
  const endTs = qs.end ? Number(qs.end) : Date.now();
  const deviceId = qs.device_id;

  // Build filter for GraphQL query
  let filter = `{ timestamp: { between: [${startTs}, ${endTs}] } }`;
  if (deviceId) {
    filter = `{ and: [{ timestamp: { between: [${startTs}, ${endTs}] } }, { device_id: { eq: "${deviceId}" } }] }`;
  }

  const query = `
    query ListButtonEvents($filter: ModelButtonEventsFilterInput, $nextToken: String) {
      listButtonEvents(filter: $filter, nextToken: $nextToken, limit: 1000) {
        items {
          device_id
          timestamp
          btn
          action
          owner
        }
        nextToken
      }
    }
  `;

  const items: ButtonEventItem[] = [];
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
          variables: {
            filter: {
              ...(deviceId ? { device_id: { eq: deviceId } } : {}),
              timestamp: { between: [startTs, endTs] }
            },
            nextToken
          }
        })
      });

      const result = await response.json() as GraphQLResponse;
      
      if (result.errors) {
        console.error('GraphQL errors:', result.errors);
        return { statusCode: 500, body: JSON.stringify({ error: 'GraphQL error', details: result.errors }) };
      }

      if (result.data?.listButtonEvents?.items) {
        items.push(...result.data.listButtonEvents.items);
      }
      nextToken = result.data?.listButtonEvents?.nextToken;
    } while (nextToken);
  } catch (err) {
    console.error('Fetch error', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'fetch error' }) };
  }

  const leftMap: Record<number, number> = Object.create(null);
  const rightMap: Record<number, number> = Object.create(null);

  for (const it of items) {
    const tsMs = typeof it.timestamp === 'number' ? it.timestamp : Date.parse(String(it.timestamp));
    const minute = floorToMinute(tsMs);
    const btn = (it.btn || '').toUpperCase();
    if (btn === 'LEFT') leftMap[minute] = (leftMap[minute] || 0) + 1;
    if (btn === 'RIGHT') rightMap[minute] = (rightMap[minute] || 0) + 1;
  }

  const toDatapoints = (map: Record<number, number>): [number, number][] =>
    Object.keys(map)
      .map((k): [number, number] => [map[Number(k)], Number(k)])
      .sort((a, b) => a[1] - b[1]);

  const resp = [
    { target: 'left_presses', datapoints: toDatapoints(leftMap) },
    { target: 'right_presses', datapoints: toDatapoints(rightMap) }
  ];

  return {
    statusCode: 200,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(resp)
  };
};
