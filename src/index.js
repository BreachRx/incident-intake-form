const express = require("express");
const session = require("express-session");
const auth = require("basic-auth-token");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const {GraphQLClient, gql} = require("graphql-request");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oidc");
const yup = require("yup");

require("dotenv").config();
const app = express();

const webPort = process.env.WEB_PORT ?? 3000;

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_AUTH_CLIENT_ID,
  clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET,
  callbackURL: process.env.OAUTH_CALLBACK_URL,
}, function(issuer, profile, cb) {
  return cb(null, profile);
}));
const fallbackSecret = crypto.randomBytes(64).toString("hex");
app.use(session({
  secret: process.env.SESSION_SECRET ?? fallbackSecret,
  resave: false,
  saveUninitialized: true,
}));

passport.serializeUser((user, cb) => {
  process.nextTick(function() {
    return cb(null, user);
  });
});

passport.deserializeUser((user, cb) => {
  process.nextTick(function() {
    return cb(null, user);
  });
});

app.use(passport.initialize());
app.use(passport.session());

app.use("/static", express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.set("views", `${process.cwd()}/src/pages`);

const breachrxAppUrl = process.env.BREACHRX_APP_URL;
const [, orgName, breachRxEnvironment] = breachrxAppUrl.match(
    "https://(.*)\.(development|app|staging)\.breachrx\.io",
);
const breachRxGraphQLUrl = `https://graphql.${breachRxEnvironment}.breachrx.io/graphql`;

const apiKey = process.env.BREACHRX_API_KEY;
const secretKey = process.env.BREACHRX_SECRET_KEY;

const breachRxClient = new GraphQLClient(breachRxGraphQLUrl, {
  headers: {
    authorization: `Basic ${auth(apiKey, secretKey)}`,
    orgName,
  },
});

const createIncidentMutation = gql`mutation CreateIncident(
  $severity: String!,
  $name: String!,
  $type: String!,
  $description: String
) {
  createIncident(
    type: $type, 
    severity: $severity, 
    name: $name,
    description: $description
  ) {
    id
    name
    severity {
      name
    }
    types {
      type {
        name
      }
    }
    description
  }
}`;

const getIncidentTypesQuery = gql`{
  types {
    name
  }
}`;

const getIncientSeveritiesQuery = gql`{
  incidentSeverities {
    name
  }
}`;

const incidentSchema = yup.object().shape({
  name: yup.string().required(),
  description: yup.string().nullable(),
  type: yup.string().required(),
  severity: yup.string().required(),
});

let cachedIncidentTypes;
let cachedIncidentSeverities;

app.get("/login/federated/google", passport.authenticate("google", {scope: ["email"]}));

app.get(
    "/oauth2/redirect",
    passport.authenticate("google", {failureRedirect: "/login?failure=true", failureMessage: true}),
    (req, res)=> {
      res.redirect("/");
    },
);

app.get("/login", (req, res)=>{
  res.render("login");
});

app.use((req, res, next) => {
  if (!req.isAuthenticated()) {
    res.redirect("/login");
  } else {
    next();
  }
});

app.get("/", async (req, res) => {
  if (!cachedIncidentTypes) {
    cachedIncidentTypes = await breachRxClient.request(getIncidentTypesQuery);
  }
  if (!cachedIncidentSeverities) {
    cachedIncidentSeverities = await breachRxClient.request(getIncientSeveritiesQuery);
  }

  res.render("form", {
    severities: cachedIncidentSeverities.incidentSeverities,
    incidentTypes: cachedIncidentTypes.types,
  });
});

app.post("/", async (req, res) => {
  const redirect = process.env.FORM_REDIRECT_URL ?? "/";
  const description = req.body.incidentDescription +
    `<br/><br/>Submitted by ${req.session.passport.user.emails[0].value}.`;
  const variables = {
    name: req.body.incidentName,
    description: description,
    type: req.body.incidentType,
    severity: req.body.incidentSeverity,
  };

  const isIncidentValid = await incidentSchema.isValid(variables);
  if (!isIncidentValid) {
    return res.redirect("/?invalid=true");
  }

  try {
    await breachRxClient.request(createIncidentMutation, variables);
    return res.redirect(`${redirect}?submit=true`);
  } catch (error) {
    console.error(`Error: ${JSON.stringify(error.response, null, 2)}`);
    return res.redirect(`${redirect}?submit=false`);
  }
});

app.listen(webPort, ()=>{
  console.log("BreachRx incident intake app started.");
});
