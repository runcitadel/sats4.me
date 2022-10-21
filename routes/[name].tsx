import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import SendLn from "../islands/SendLn.tsx";
import SendOnChain from "../islands/SendOnChain.tsx";
import * as mainLogic from "../src/manage.ts";

interface SendSatsProps {
  exists: boolean;
}

export const handler: Handlers<SendSatsProps> = {
  async GET(_, ctx) {
    const { name } = ctx.params;
    const proxyTarget = await mainLogic.getProxyTarget(name);

    return ctx.render({
      exists: !!proxyTarget,
    });
  },
};

export default function SendSats(props: PageProps<SendSatsProps>) {
  return (
    <>
      {props.data.exists && (
        <Head>
          <title>Sats for {props.params.name}</title>
          <meta property="twitter:card" content="summary" />
          <meta
            property="og:site_name"
            content={`Sats for @${props.params.name}`}
          />
          <meta
            name="lightning"
            content={`lnurlp:${props.params.name}@sats4.me`}
          />
          <meta
            property="og:description"
            content={`Send some Sats to @${props.params.name} - powered by sats4me.`}
          />

          <meta property="og:image" content="/lnme.svg" />
        </Head>
      )}
      <div
        class="h-screen w-screen flex flex-col text-[8vh] items-center justify-center text-center text-white"
        style={{
          backgroundImage:
            "linear-gradient(60deg, #3d3393 0%, #2b76b9 37%, #2cacd1 65%, #35eb93 100%)",
        }}
      >
        {props.data.exists
          ? (
            <>
              <SendLn user={props.params.name} />
              <SendOnChain user={props.params.name} />
            </>
          )
          : <p class="text-2xl">This user does not exist.</p>}
      </div>
    </>
  );
}
