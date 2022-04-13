import Koa from "koa";
import Router from "@koa/router";
import nodeFetch from "node-fetch";
import SocksProxyAgentPkg from "socks-proxy-agent";
const SocksProxyAgent = SocksProxyAgentPkg.SocksProxyAgent;
import * as mainLogic from "./manage.js";
import bodyParser from "koa-body";
import * as fs from "@runcitadel/fs";
import * as path from "path";
import * as url from "url";
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
    const apiResponse = await nodeFetch(
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
    ctx.body = await apiResponse.text();
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
        <title>sats4me</title>
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

// get path from import.meta.url
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const donateCss = fs.readFileSync(path.join(__dirname, "..", "public", "donate.css"), "utf8");
const donateHtml = fs.readFileSync(path.join(__dirname, "..", "public", "donate.html"), "utf8");
const donateJs = fs.readFileSync(path.join(__dirname, "..", "public", "donate.js"), "utf8");
const lnmeSvg = fs.readFileSync(path.join(__dirname, "..", "public", "lnme.svg"), "utf8");
const notFoundHtml = fs.readFileSync(path.join(__dirname, "..", "public", "notfound.html"), "utf8");

router.get("/lnme.svg", async (ctx, next) => {
  ctx.body = lnmeSvg;
  ctx.type = "image/svg+xml";
  await next();
});

router.get(".css", async (ctx, next) => {
  ctx.body = donateCss;
  ctx.type = "text/css";
  await next();
});

router.get(".js", async (ctx, next) => {
  ctx.body = donateJs;
  ctx.type = "application/javascript";
  await next();
});


router.get("/donate/:id", async (ctx, next) => {
  if(await mainLogic.getOnionAddress(ctx.params.id)) {
    ctx.redirect(`https://sats4.me/ctx.params.id`);
  } else {
    ctx.status = 404;
    ctx.body = notFoundHtml;
  }  
  ctx.type = "text/html";
  await next();
});

router.get("/:id", async (ctx, next) => {
  if(await mainLogic.getOnionAddress(ctx.params.id)) {
    ctx.body = donateHtml;
  } else {
    ctx.status = 404;
    ctx.body = notFoundHtml;
  }  
  ctx.type = "text/html";
  await next();
});


router.get("/:userid/v1/invoice/:invoiceid", async (ctx, next) => {
  const userid = ctx.params.userid;
  const invoiceid = ctx.params.invoiceid;
  if (await mainLogic.getOnionAddress(userid)) {
    // send a request to the users onion
    const apiResponse = await nodeFetch(
      `http://${await mainLogic.getOnionAddress(
        userid
      )}/v1/invoice/${invoiceid}`,
      {
        agent,
        headers: {
          "X-Forwarded-For": ctx.host,
        },
      }
    );
    ctx.body = await apiResponse.text();
  } else {
    ctx.status = 404;
  }
  await next();
});

router.post("/:userid/v1/invoices", async (ctx, next) => {
  const userid = ctx.params.userid;
  if (await mainLogic.getOnionAddress(userid)) {
    // send a request to the users onion
    const apiResponse = await nodeFetch(
      `http://${await mainLogic.getOnionAddress(
        userid
      )}/v1/invoices`,
      {
        agent,
        method: "POST",
        headers: {
          "X-Forwarded-For": ctx.host,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ctx.request.body),
      }
    );
    ctx.body = await apiResponse.text();
  } else {
    ctx.status = 404;
  }
  await next();
});

router.post("/:userid/v1/newaddress", async (ctx, next) => {
  const userid = ctx.params.userid;
  if (await mainLogic.getOnionAddress(userid)) {
    // send a request to the users onion
    const apiResponse = await nodeFetch(
      `http://${await mainLogic.getOnionAddress(
        userid
      )}/v1/newaddress`,
      {
        agent,
        method: "POST",
        headers: {
          "X-Forwarded-For": ctx.host,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ctx.request.body),
      }
    );
    ctx.body = await apiResponse.text();
  } else {
    ctx.status = 404;
  }
  await next();
});

app.use(router.routes());
app.use(router.allowedMethods());
app.listen(400);
