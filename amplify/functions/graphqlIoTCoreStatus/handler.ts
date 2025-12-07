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
    };

    // Extract device_id from clientId
    const device_id = event.clientId || event.device_id;
    console.log(`Device ID: ${device_id}`);

    // First, get the device owner from the Device table
    let ownerEmail = 'Unknown Player';
    try {
        const getDeviceRequest = new Request(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                query: `query GetDevice {
                    getDevice(device_id: "${device_id}") {
                        device_id
                        owner
                    }
                }`
            })
        });

        const deviceResponse = await fetch(getDeviceRequest);
        const deviceBody = await deviceResponse.json();
        console.log("Device query response:", deviceBody);

        if (deviceBody.data?.getDevice?.owner) {
            ownerEmail = deviceBody.data.getDevice.owner;
        }
    } catch (error) {
        console.error("Error fetching device owner:", error);
    }

    // Update device status
    request = new Request(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            query: `mutation UpdateDevice {
                updateDevice(input: {
                    device_id: "${device_id}", 
                    status: "${event.eventType}"
                }) {
                    device_id
                    status
                    owner
                    createdAt
                    updatedAt
                }
            }`
        })
    });

    try {
        console.log("request: ", request);
        response = await fetch(request);
        console.log("response: ", response);
        responseBody = await response.json();
        console.log("Response Body: ", responseBody);
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
        const status = String(event.eventType || 'unknown').toLowerCase();
        
        // Validate and format timestamp
        let formattedTimestamp;
        if (event.timestamp) {
            const date = new Date(event.timestamp);
            if (isNaN(date.getTime())) {
                formattedTimestamp = new Date().toISOString();
            } else {
                formattedTimestamp = date.toISOString();
            }
        } else {
            formattedTimestamp = new Date().toISOString();
        }

        // Determine if connected or disconnected
        const isConnected = status.includes('connect') && !status.includes('disconnect');
        const isDisconnected = status.includes('disconnect');

        let color = 45973; // Default blue
        if (isConnected) {
            color = 5814783; // Green
        } else if (isDisconnected) {
            color = 15158332; // Red
        }

        const messageContent = `Player **${ownerEmail}** ${isDisconnected ? 'disconnected' : 'connected'} for device **${device_id}**`;

        const discordMessage = {
            content: messageContent,
            embeds: [
                {
                    title: event.eventType || "Connection Event",
                    description: formattedTimestamp,
                    color: color,
                    fields: [
                        {
                            name: "Player",
                            value: ownerEmail,
                            inline: true
                        },
                        {
                            name: "Device",
                            value: device_id,
                            inline: true
                        }
                    ]
                }
            ]
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