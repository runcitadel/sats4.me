import Koa from "koa";
import Router from "@koa/router";
import SocksProxyAgentPkg from "socks-proxy-agent";
const SocksProxyAgent = SocksProxyAgentPkg.SocksProxyAgent;
import * as mainLogic from "./manage.js";
import bodyParser from "koa-body";
import * as fs from "@runcitadel/fs";
import * as path from "path";
import * as url from "url";
import Providers from "./providers/index.js";

const proxy = process.env.SOCKS_PROXY || "socks5h://127.0.0.1:9050";
const app = new Koa();
const router = new Router();
router.use(bodyParser());

const agent = new SocksProxyAgent(proxy);
const providers = new Providers(process.env.CLN_SOCKET as string, agent);

router.get("/.well-known/lnurlp/:username", async (ctx, next) => {
  const username: string = ctx.params.username;
  const proxyTarget = await mainLogic.getProxyTarget(ctx.hostname, username);
  if (proxyTarget) {
    ctx.body = {
      status: "OK",
      callback: `${ctx.protocol}://${ctx.host}/callback/${username}`,
      tag: "payRequest",
      // TODO: Dynamically get these limits
      maxSendable: 100000000,
      minSendable: 1000,
      metadata: JSON.stringify([
        ["text/identifier", `${username}@${ctx.host}`],
        ["text/plain", `Sats for ${username}@${ctx.host}`],
      ]),
      commentAllowed: 256,
    };
  } else {
    ctx.status = 404;
  }
});

router.get("/callback/:username", async (ctx, next) => {
  const username: string = ctx.params.username;
  const amount = Number(ctx.query.amount) || 0;
  const comment = (ctx.query.comment as string) || "Paid through sats4.me";
  const proxyTarget = await mainLogic.getProxyTarget(ctx.hostname, username);
  if (proxyTarget) {
    const provider = await providers.getProvider(proxyTarget.provider);
    ctx.body = {
      status: "OK",
      successAction: { tag: "message", message: "Thanks, payment received!" },
      routes: [],
      pr: await provider.getInvoice({
        username,
        target: proxyTarget.target,
        amountMsat: amount,
        host: ctx.host,
        proto: ctx.protocol,
        comment,
      }),
    };
  } else {
    ctx.status = 404;
  }
});

router.get("/", async (ctx, next) => {
  ctx.redirect("https://account.runcitadel.space");
  await next();
});

// get path from import.meta.url
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const donateCss = fs.readFileSync(
  path.join(__dirname, "..", "public", "donate.css"),
  "utf8"
);
const donateHtml = fs.readFileSync(
  path.join(__dirname, "..", "public", "donate.html"),
  "utf8"
);
const donateJs = fs.readFileSync(
  path.join(__dirname, "..", "public", "donate.js"),
  "utf8"
);
const lnmeSvg = fs.readFileSync(
  path.join(__dirname, "..", "public", "lnme.svg"),
  "utf8"
);
const notFoundHtml = fs.readFileSync(
  path.join(__dirname, "..", "public", "notfound.html"),
  "utf8"
);

router.get("/lnme.svg", async (ctx, next) => {
  ctx.body = lnmeSvg;
  ctx.type = "image/svg+xml";
  ctx.set("Cache-Control", "public, max-age=604800");
});

router.get("/donate.css", async (ctx, next) => {
  ctx.body = donateCss;
  ctx.type = "text/css";
  ctx.set("Cache-Control", "public, max-age=604800");
});

router.get("/donate.js", async (ctx, next) => {
  ctx.body = donateJs;
  ctx.type = "application/javascript";
  ctx.set("Cache-Control", "public, max-age=604800");
});

router.get("/:id", async (ctx, next) => {
  ctx.set("Cache-Control", "public, max-age=3600");
  if (await mainLogic.getProxyTarget(ctx.hostname, ctx.params.id)) {
    ctx.body = donateHtml
      .replace(
        '<meta property="og:site_name" content="">',
        `<meta property="og:site_name" content="Sats for @${ctx.params.id}">`
      )
      .replace(
        '<meta name="lightning" content="lnurlp:address@sats4.me">',
        `<meta name="lightning" content="lnurlp:${ctx.params.id}@${ctx.hostname}">`
      )
      .replace(
        '<meta property="og:description" content="">',
        `<meta property="og:site_name" content="Send some sats to @${ctx.params.id}">`
      );
  } else {
    ctx.status = 404;
    ctx.body = notFoundHtml;
  }
  ctx.type = "text/html";
});

router.get("/:userid/v1/invoice/:invoiceid", async (ctx, next) => {
  ctx.set("Cache-Control", "no-cache, no-store, must-revalidate");
  const username = ctx.params.userid;
  const paymentHash = ctx.params.invoiceid;
  const target = await mainLogic.getProxyTarget(ctx.hostname, username);
  if (target) {
    const provider = providers.getProvider(target.provider);
    if (provider.hasPolling) {
      ctx.body = await provider.isPaid(target.target, paymentHash);
    } else {
      ctx.status = 400;
    }
  } else {
    ctx.status = 404;
  }
  await next();
});

router.post("/:userid/v1/invoices", async (ctx, next) => {
  ctx.set("Cache-Control", "no-cache, no-store, must-revalidate");
  const username = ctx.params.userid;
  const target = await mainLogic.getProxyTarget(ctx.hostname, username);
  if (target) {
    const provider = await providers.getProvider(target.provider);
    const invoice = await provider.getInvoice({
      username,
      target: target.target,
      amountMsat: Number(ctx.request.body.value),
      host: ctx.host,
      proto: ctx.protocol,
      comment: ctx.request.body.memo,
    });
    ctx.body = {
      payment_hash: invoice.paymentHash,
      payment_request: invoice.bolt11,
      settled: false,
    };
  } else {
    ctx.status = 404;
  }
  await next();
});

router.get("/:userid/v1/newaddress", async (ctx, next) => {
  ctx.set("Cache-Control", "no-cache, no-store, must-revalidate");
  const username = ctx.params.userid;
  const target = await mainLogic.getProxyTarget(ctx.hostname, username);
  if (target) {
    const provider = providers.getProvider(target.provider);
    if (provider.supportsOnchain) {
      ctx.body = JSON.stringify(
        await provider.getAddr({
          username,
          targetUrl: target.target,
          host: ctx.host,
          proto: ctx.protocol,
        })
      );
    } else {
      ctx.status = 400;
    }
  } else {
    ctx.status = 404;
  }
  await next();
});

app.use(router.routes());
app.use(router.allowedMethods());
app.listen(400);
