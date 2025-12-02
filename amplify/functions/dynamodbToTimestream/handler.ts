import type { DynamoDBStreamHandler } from 'aws-lambda';
import { TimestreamWriteClient, WriteRecordsCommand } from "@aws-sdk/client-timestream-write";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import type { AttributeValue } from "@aws-sdk/client-dynamodb";

const client = new TimestreamWriteClient({ region: "eu-central-1" });
const DATABASE_NAME = process.env.TIMESTREAM_DATABASE || "SpaceSurvivors";

export const handler: DynamoDBStreamHandler = async (event) => {
  console.log(`Processing ${event.Records.length} records`);

  for (const record of event.Records) {
    // Only process INSERT events (new items)
    if (record.eventName !== "INSERT" || !record.dynamodb?.NewImage) {
      continue;
    }

    try {
      const item = unmarshall(record.dynamodb.NewImage as Record<string, AttributeValue>);
      const sourceARN = record.eventSourceARN || "";

      // Determine which table the event came from
      const isButtonEvents = sourceARN.includes("ButtonEvents");
      const isHighScore = sourceARN.includes("HighScore");

      if (!isButtonEvents && !isHighScore) {
        console.log("Unknown table source, skipping:", sourceARN);
        continue;
      }

      const tableName = isButtonEvents ? "button_events" : "highscores";
      let timestreamRecord;

      if (isButtonEvents) {
        // ButtonEvents record
        timestreamRecord = {
          Dimensions: [
            { Name: "device_id", Value: String(item.device_id || "unknown") },
            { Name: "btn", Value: String(item.btn || "unknown") },
            { Name: "action", Value: String(item.action || "unknown") },
            { Name: "owner", Value: String(item.owner || "unknown") },
          ],
          MeasureName: "count",
          MeasureValue: "1",
          MeasureValueType: "BIGINT" as const,
          Time: String(item.ts || Date.now()),
          TimeUnit: "MILLISECONDS" as const,
        };
        console.log("Writing ButtonEvent to Timestream:", item.btn, item.action);
      } else {
        // HighScore record
        timestreamRecord = {
          Dimensions: [
            { Name: "username", Value: String(item.username || "unknown") },
            { Name: "owner", Value: String(item.owner || "unknown") },
          ],
          MeasureName: "score",
          MeasureValue: String(item.score || 0),
          MeasureValueType: "BIGINT" as const,
          Time: Date.now().toString(),
          TimeUnit: "MILLISECONDS" as const,
        };
        console.log("Writing HighScore to Timestream:", item.username, item.score);
      }

      await client.send(new WriteRecordsCommand({
        DatabaseName: DATABASE_NAME,
        TableName: tableName,
        Records: [timestreamRecord],
      }));

      console.log(`Successfully wrote to Timestream: ${tableName}`);
    } catch (error) {
      console.error("Error processing record:", error);
      // Don't throw - continue processing other records
    }
  }

  return {
    batchItemFailures: [],
  };
};
