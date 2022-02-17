import Koa from "koa";
import Router from "@koa/router";
import fetch from "node-fetch";
import SocksProxyAgentPkg from "socks-proxy-agent";
const SocksProxyAgent = SocksProxyAgentPkg.SocksProxyAgent;
import * as mainLogic from "./manage.js";
import bodyParser from "koa-body";

// Connect to the local tor daemon

const proxy = process.env.SOCKS_PROXY || "socks5h://127.0.0.1:9050";
const app = new Koa();
const router = new Router();
router.use(bodyParser());

const agent = new SocksProxyAgent(proxy);

router.get("/.well-known/lnurlp/:username", async (ctx, next) => {
  const username: string = ctx.params.username;
  // Other request query params (all as string)
  const query = ctx.querystring ? `?${ctx.querystring}` : "";

  if (await mainLogic.getOnionAddress(username)) {
    // send a request to the users onion
    const apiResponse = await fetch(
      `http://${await mainLogic.getOnionAddress(
        username
      )}/.well-known/lnurlp/${username}${query}`,
      {
        agent,
        headers: {
          "X-Forwarded-For": ctx.host,
        },
      }
    );
    ctx.body = await apiResponse.json();
  } else {
    ctx.status = 404;
  }
  await next();
});

router.post("/add-address", async (ctx, next) => {
  const address = ctx.request.body.address;
  const signature = ctx.request.body.signature;
  const onionUrl = ctx.request.body.onionUrl;

  // Validate that all 3 are present and string
  if (
    !address ||
    !signature ||
    !onionUrl ||
    typeof address !== "string" ||
    typeof signature !== "string" ||
    typeof onionUrl !== "string"
  ) {
    ctx.status = 400;
    return;
  }
  const data = await mainLogic.addAddress(signature, onionUrl, address);
  ctx.status = data.code;
  ctx.body = data.msg;
  await next();
});

router.post("/set-onion-url", async (ctx, next) => {
  const signature = ctx.request.body.signature;
  const onionUrl = ctx.request.body.onionUrl;

  // Validate that all 3 are present and string
  if (
    !signature ||
    !onionUrl ||
    typeof signature !== "string" ||
    typeof onionUrl !== "string"
  ) {
    ctx.status = 400;
    return;
  }
  const data = await mainLogic.setOnionUrl(signature, onionUrl);
  ctx.status = data.code;
  ctx.body = data.msg;
  await next();
});

router.get("/", async (ctx, next) => {
  ctx.body = `<html>
    <head>
        <title>Citadel Lightning addresses</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: radial-gradient(#ffffab00, #ffc14f);
                padding: 0;
                margin: 0;
                font-size: 60vh;
            }
        </style>
    </head>
    <body>
        ⚡
    </body>
</html>`;
  await next();
});

app.use(router.routes());
app.use(router.allowedMethods());
app.listen(400);
