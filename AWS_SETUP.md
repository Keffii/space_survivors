# Setting up SpaceSurvivors in a new AWS account

The whole backend is defined in code (`amplify/`). When you connect the repo to
Amplify, the first deploy creates everything: Cognito (sign-in), AppSync +
DynamoDB (highscores) and the `highscoreApi` Lambda with a public Function URL.
No secrets or manual IAM/IoT setup are needed.

> This branch is a web-only demo. The ESP32/IoT Core integration and Discord
> notifications have been removed; the game is played with the keyboard.

---

## 1. Prepare the new AWS account

1. Turn on MFA for the root user and create an admin user in IAM Identity Center.
   Don't use the root user for daily work.
2. Create a **budget alert** (Billing → Budgets → *Zero spend* or *Monthly cost* template).
   The project fits in the free tier, so the alert flags anything unexpected.
3. Pick a region and use it for every step below, e.g. `eu-central-1` (Frankfurt).

## 2. Connect the repo to Amplify Hosting

1. Open **AWS Amplify → Create new app → GitHub**, authorize GitHub and choose
   `keffii/space_survivors` and the branch to deploy. Leave *monorepo* unticked.
2. Amplify detects `amplify.yml` and the Gen 2 backend. Let it create a new service role.
3. When the build finishes, open the `https://<branch>.<app-id>.amplifyapp.com` URL,
   create an account and play.

> If the build log says the account/region is not bootstrapped, run
> `npx cdk bootstrap aws://<ACCOUNT_ID>/<REGION>` once with admin credentials,
> then redeploy.

## 3. Local development

To work against a deployed branch backend:

```bash
npm install
aws configure sso                # or any credentials for the new account
npx ampx generate outputs --app-id <AMPLIFY_APP_ID> --branch <BRANCH>
npm run dev
```

To use a personal sandbox backend instead:

```bash
npx ampx sandbox                 # writes amplify_outputs.json
```

## 4. Grafana (optional)

The highscore Function URL is in `amplify_outputs.json` → `custom.highscoreApiUrl`,
or in the Lambda console. Use it in a Grafana Infinity / JSON API data source.

---

## Troubleshooting

- **`npm ci` fails with "Missing: @opentelemetry/core@2.0.0 from lock file".** The
  Amplify constructs bundle mismatched OpenTelemetry versions, so `amplify.yml`
  uses `npm install` instead of `npm ci`. Keep it that way.
- **API key expired.** The AppSync API key lasts 365 days. Redeploy to rotate it. The
  Lambda receives the new key automatically.
