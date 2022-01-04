import Koa from "koa";
import Router from "@koa/router";
import fetch from "node-fetch";
import SocksProxyAgentPkg from "socks-proxy-agent";
const SocksProxyAgent = SocksProxyAgentPkg.SocksProxyAgent;
import * as https from "https";
import * as fs from "fs";
import * as mainLogic from "./manage.js";
import bodyParser from "koa-body";

const config = {
  domain: "ln.runcitadel.space",
  https: {
    port: 443,
    options: {
      key: fs
        .readFileSync(
          "/etc/letsencrypt/live/ln.runcitadel.space/privkey.pem",
          "utf8"
        )
        .toString(),

      cert: fs
        .readFileSync(
          "/etc/letsencrypt/live/ln.runcitadel.space/fullchain.pem",
          "utf8"
        )
        .toString(),
    },
  },
};

// Connect to the local tor daemon

const proxy = process.env.socks_proxy || "socks5h://127.0.0.1:9050";
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
          "X-Forwarded-For": "ln.runcitadel.space",
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

app.use(router.routes());
app.use(router.allowedMethods());
const server = https.createServer(config.https.options, app.callback());
server.listen(443, function () {
  console.log("Listening");
});
