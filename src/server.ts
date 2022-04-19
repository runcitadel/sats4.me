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

router.get("/", async (ctx, next) => {
  ctx.redirect("https://account.runcitadel.space");
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

router.get("/donate.css", async (ctx, next) => {
  ctx.body = donateCss;
  ctx.type = "text/css";
});

router.get("/donate.js", async (ctx, next) => {
  ctx.body = donateJs;
  ctx.type = "application/javascript";
});

router.get("/:id", async (ctx, next) => {
  if(await mainLogic.getOnionAddress(ctx.params.id)) {
    ctx.body = donateHtml
                .replace('<meta property="og:site_name" content="">', `<meta property="og:site_name" content="Sats for @${ctx.params.id}">`)
                .replace('<meta name="lightning" content="lnurlp:address@sats4.me">', `<meta name="lightning" content="lnurlp:${ctx.params.id}@sats4.me">`)
                .replace('<meta property="og:description" content="">', `<meta property="og:site_name" content="Send some sats to @${ctx.params.id}">`);
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
