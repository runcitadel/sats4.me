import { createClient } from "https://cdn.skypack.dev/@supabase/supabase-js?dts";

export type Provider =
  | "lnme"
  | "alby"
  | "otheraddr"
  | "lnbits"
  | "bolt12"
  | "lnurl";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")!
);

export async function getProxyTarget(
  address: string
): Promise<
  | {
    target: string;
    provider: Provider;
  }
  | false
> {
  const { data, error } = await supabase
    .from("LightningAddresses")
    .select("proxyTarget, provider")
    .eq("address", address.toLowerCase())
    .single();
  if (error || !data) {
    return false;
  }
  return {
    target: data.proxyTarget,
    provider: data.provider,
  };
}
