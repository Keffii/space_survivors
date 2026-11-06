# Setting up SpaceSurvivors in a new AWS account

Most of the AWS setup is now defined in code (`amplify/backend.ts`). When you
connect the repo to Amplify in a new account, the first deploy creates
everything in this table:

| Resource | Before | Now |
| --- | --- | --- |
| Cognito, AppSync, DynamoDB, Lambdas | Amplify | Amplify (unchanged) |
| `CUSTOM_LAMBDA_GRAPHQL_ENDPOINT` / `CUSTOM_LAMBDA_GRAPHQL_KEY` secrets | Copied in by hand after the first deploy | **Removed.** Set from the deployed API automatically |
| IoT rule `+/events/button` → `graphqlIoTCoreButtonEvents` | Created by hand | **Created automatically** |
| IoT rule for connect/disconnect events → `graphqlIoTCoreStatus` | Created by hand | **Created automatically** |
| IAM policy for IoT on the Cognito authenticated role | Created by hand (old `IAM_SETUP.md`) | **Created automatically** |
| IoT policy attached to each signed-in user's Cognito identity | Attached by hand | **Created automatically.** The app attaches it when you click Connect |
| IoT endpoint in `useIoTButtonInput.ts` | Hardcoded to the old account | **Looked up at deploy time** and written to `amplify_outputs.json` |

You still have to do these steps by hand.

---

## 1. Prepare the new AWS account

1. Turn on MFA for the root user and create an admin user in IAM Identity Center.
   Don't use the root user for daily work.
2. Create a **budget alert** (Billing → Budgets → *Zero spend* or *Monthly cost* template).
   The project fits in the free tier, so the alert flags anything unexpected.
3. Pick a region and use it for every step below. The old setup used `eu-central-1` (Frankfurt).

## 2. Connect the repo to Amplify Hosting

1. Open **AWS Amplify → Create new app → GitHub**, authorize GitHub and choose
   `keffii/space_survivors`, branch `main`.
2. Amplify detects `amplify.yml` and the Gen 2 backend. Let it create a new service role.
3. Add the Discord secret: go to **Hosting → Secrets → Manage secrets**, choose
   *All branches* and add:

   | Key | Value |
   | --- | --- |
   | `DISCORD_WEBHOOK` | Your Discord webhook URL. Create a new one if the old URL leaked. If you don't use Discord, enter any placeholder such as `none` |

   The backend references this secret, so the deploy **fails until it exists**. If the
   first build fails because the secret is missing, add it and click **Redeploy this version**.
4. When the build finishes, open the new `https://main.<app-id>.amplifyapp.com` URL and
   update the *Play Online* link in `README.md`.

> If the build log says the account/region is not bootstrapped, run
> `npx cdk bootstrap aws://<ACCOUNT_ID>/<REGION>` once with admin credentials,
> then redeploy.

## 3. Local development

To work against the deployed `main` backend:

```bash
npm install
aws configure sso                # or any credentials for the new account
npx ampx generate outputs --app-id <AMPLIFY_APP_ID> --branch main
npm run dev
```

To use a personal sandbox backend instead:

```bash
npx ampx sandbox secret set DISCORD_WEBHOOK   # paste the URL (or "none")
npx ampx sandbox                              # writes amplify_outputs.json
```

## 4. Register the ESP32 in AWS IoT Core

Things, certificates and device policies belong to the account, so you have to
recreate them and reflash the board with the new endpoint and certificate.

1. **IoT Core → All devices → Things → Create thing**. Name it after the device ID,
   e.g. `ECE334663DD4`.
2. Choose **Auto-generate a new certificate**. Download the device certificate, the private
   key and the Amazon Root CA 1.
3. Create and attach this policy. Replace `REGION`, `ACCOUNT` and `DEVICE_ID`:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       { "Effect": "Allow", "Action": "iot:Connect", "Resource": "arn:aws:iot:REGION:ACCOUNT:client/DEVICE_ID" },
       { "Effect": "Allow", "Action": "iot:Publish", "Resource": "arn:aws:iot:REGION:ACCOUNT:topic/DEVICE_ID/events/button" }
     ]
   }
   ```

4. Get the new endpoint. It's in `amplify_outputs.json` → `custom.iotEndpoint`, or run:

   ```bash
   aws iot describe-endpoint --endpoint-type iot:Data-ATS
   ```

5. Update the ESP32 firmware with the new **endpoint**, **certificate** and **private key**,
   then reflash it. The firmware must keep:
   - MQTT **client ID = device ID** (`ECE334663DD4`). The connect/disconnect rule reads the
     device ID from the client ID.
   - Topic `DEVICE_ID/events/button` with a JSON payload `{"btn":"LEFT","action":"press","ts":123}`.
6. Check the messages in **IoT Core → MQTT test client** by subscribing to `+/events/button`.

## 5. Create the Device record

The game shows status and stores button events only for devices that have a row
in the `Device` table with an owner.

1. Sign up in the app and finish one game, so that a `HighScore` row is created for you.
2. Open **DynamoDB → Tables → `HighScore-<apiId>-NONE` → Explore items** and copy your
   `owner` value. It looks like `<sub>::<username>`.
3. Open the `Device-<apiId>-NONE` table → **Create item** and add these attributes (all
   type String):

   | Attribute | Value |
   | --- | --- |
   | `device_id` | `ECE334663DD4` |
   | `owner` | the value you copied |
   | `status` | `disconnected` |
   | `__typename` | `Device` |
   | `createdAt` / `updatedAt` | an ISO date, e.g. `2026-01-01T00:00:00.000Z` |

4. Power on the ESP32. The badge in the app should change to **Connected**, and Discord
   should post a message.

## 6. Grafana

The Function URLs are new. Find them in `amplify_outputs.json` → `custom.buttonEventsApiUrl`
and `custom.highscoreApiUrl`, or in the Lambda console. Update the URLs in your Grafana
(Infinity / JSON API) data sources.

---

## Troubleshooting

- **Browser can't subscribe ("Not authorized" or the socket closes right away).** Check the
  console for `[IoT] Could not attach IoT policy to identity`. Sign out and back in, and
  make sure the latest backend is deployed.
- **No Device status updates.** Check the ESP32 MQTT client ID (it must equal the
  device ID), then the CloudWatch logs of the `graphqlIoTCoreStatus` Lambda.
- **No ButtonEvents rows.** The `Device` row is missing or has no `owner` (step 5). See the
  logs of the `graphqlIoTCoreButtonEvents` Lambda.
- **API key expired.** The AppSync API key lasts 365 days. Redeploy to rotate it. The Lambdas
  receive the new key automatically.
