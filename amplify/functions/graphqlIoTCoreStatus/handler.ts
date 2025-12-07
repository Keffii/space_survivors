import type { Handler } from 'aws-lambda';

const GRAPHQL_ENDPOINT = process.env.API_ENDPOINT as string;
const GRAPHQL_API_KEY = process.env.API_KEY as string;

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
export const handler: Handler = async (event, context) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);

    let statusCode = 200;
    let response;
    let responseBody;
    let request;

    const headers = {
        'x-api-key': GRAPHQL_API_KEY,
        'Content-Type': 'application/json'
    }

    /** @type {import('node-fetch').RequestInit} */

    // Mutate
    request = new Request(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            query: `mutation MyMutation {
                    updateDevice(input: {
                        device_id: "${event.device_id}", 
                        status: "${event.eventType}"
                        }) 
                    {
                        device_id
                        status
                        owner
                        createdAt
                        updatedAt
                    }
                }
                `})
    });

    try {
        console.log("request: ", request)
        response = await fetch(request);
        console.log("response: ", response)
        responseBody = await response.json();
        console.log("Response Body: ", responseBody)
        if (responseBody.errors) statusCode = 400;
    } catch (error) {
        statusCode = 400;
        responseBody = {
            errors: [
                {
                    status: response?.status,
                    error: JSON.stringify(error),
                }
            ]
        };
    }

    // Send Discord webhook notification
    const webhookUrl = process.env.DISCORD_WEBHOOK;
    if (webhookUrl && statusCode === 200) {
        const username = event.username || event.clientId || event.device_id || 'Unknown';
        const status = String(event.eventType || 'unknown').toLowerCase();
        
        let message = '';
        if (status === 'connect' || status === 'connected') {
            message = `Player ${username} connected`;
        } else if (status === 'disconnect' || status === 'disconnected') {
            message = `Player ${username} disconnected`;
        } else {
            message = `Player ${username} status: ${status}`;
        }

        const discordMessage = {
            content: message
        };

        try {
            const discordResponse = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(discordMessage)
            });

            if (discordResponse.status === 204) {
                console.log('Discord webhook sent successfully');
            } else if (discordResponse.status === 429) {
                console.warn('Discord rate-limited');
            } else {
                const text = await discordResponse.text();
                console.error('Discord webhook error status=%s body=%s', discordResponse.status, text);
            }
        } catch (discordError) {
            console.error('Failed to send Discord webhook:', String(discordError));
        }
    }

    return {
        statusCode,
        body: JSON.stringify(responseBody)
    };

};