import { Handlers } from "$fresh/server.ts";
import * as mainLogic from "../../../src/manage.ts";

export const handler: Handlers = {
    async GET(req) {
        const url = new URL(req.url);
        const path = url.pathname.split("/");
        const username = path[path.length - 1];
        const proxyTarget = await mainLogic.getProxyTarget(username);
        if (proxyTarget) {
            return new Response(JSON.stringify({
                status: "OK",
                callback: `${url.protocol}://${url.host}/callback/${username}`,
                tag: "payRequest",
                // TODO: Cache these limits from remote server
                // We don't do a fetch() here to increase response speed
                maxSendable: 1000000000 * 1000,
                minSendable: 1000,
                metadata: JSON.stringify([
                  ["text/identifier", `${username}@${url.host}`],
                  ["text/plain", `Sats for ${username}@${url.host}`],
                ]),
                commentAllowed: 256,
              }), {
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET",
                    "Access-Control-Allow-Headers": "*",
                },
            });
        } else {
            return new Response(JSON.stringify("Not found"), {
                status: 404,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET",
                    "Access-Control-Allow-Headers": "*",
                },
            });
        }
    },
};