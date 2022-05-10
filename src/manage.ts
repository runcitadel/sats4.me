import Supabase from "@supabase/supabase-js";

export type Provider =
  | "lnme"
  | "alby"
  | "otheraddr"
  | "lnbits"
  | "bolt12"
  | "lnurl";

const supabase = Supabase.createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_ANON_KEY as string
);

export function getProxyTarget(
  host: string,
  address: string
): Promise<
  | {
      target: string;
      provider: Provider;
    }
  | false
> {
  if (host === "sats4.me") return getOnionAddressMain(address);
  else return getOnionAddressForDomain(host, address);
}

export async function getOnionAddressMain(address: string): Promise<
  | {
      target: string;
      provider: Provider;
    }
  | false
> {
  const { data, error } = await supabase
    .from("LightningAddresses")
    .select("proxyTarget, provider")
    .eq("address", address.toLowerCase());
  if (error || !data || data.length !== 1) {
    return false;
  }
  return {
    target: data[0].proxyTarget,
    provider:data[0].provider,
  };
}

export async function getOnionAddressForDomain(
  domain: string,
  addr: string
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
    .eq("domain", domain.toLowerCase());
  const { data: data2, error: error2 } = await supabase
    .from("LightningAddresses")
    .select("proxyTarget, provider")
    .eq("domain", domain.toLowerCase())
    .eq("address", addr.toLowerCase());

  if (error || !data || data.length === 0) {
    return false;
  }
  if (error2 || !data2 || data2.length === 0 || data.length === 1)
    return {
      target: data[0].proxyTarget,
      provider: data[0].provider,
    };

  return {
    target: data2[0].proxyTarget,
    provider: data2[0].provider,
  };
}
