import { installGlobals } from "https://deno.land/x/virtualstorage@0.1.0/mod.ts";
import { createClient } from "https://cdn.skypack.dev/@supabase/supabase-js?dts";

installGlobals();

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
  if (error) {
    console.error(error);
    return false;
  }
  return {
    target: data.proxyTarget,
    provider: data.provider,
  };
}
