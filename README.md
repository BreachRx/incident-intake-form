# BreachRx Incident Intake Shim Service
This service is run within a secure network and gives anyone with credentials the ability to submit BreachRx Incidents via an intake form.

The intake form itself is just one example of how to allow users to submit Incidents to BreachRx.  

Any HTML form can submit to this service, or if you prefer to build a more sophisticated form using [the BreachRx GraphQL API](https://www.breachrx.com/docs/breachrx-api/) you can (and ideally should) do that instead.

## Setup
Create a `.env` file with the following contents:

```bash
BREACHRX_API_KEY="<API_KEY>"
BREACHRX_SECRET_KEY="<SECRET_KEY>"
BREACHRX_APP_URL="https://<ORGANIZATION_NAME>.app.breachrx.io/"
FORM_REDIRECT_URL="<ALTERNATIVE_REDIRECT_URL>" # optional
GOOGLE_AUTH_CLIENT_ID="<GOOGLE_AUTH_CLIENT_ID>"
GOOGLE_AUTH_CLIENT_SECRET="<GOOGLE_AUTH_CLIENT_SECRET>"
SESSION_SECRET="<Literally any string that isn't easily guessable>"
WEB_PORT=<PORT_FOR_HTTP_SERVICE> # optional
```

## Running
`npm run start`

## Customizing
You can customize where the form redirects to once submission is successful, by setting the `FORM_REDIRECT_URL` environment variable.

This example is written to integrate with Google's OAuth 2.0 support, but any major auth service can be quickly integrated.