import Supabase from "@supabase/supabase-js";

const supabase = Supabase.createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_ANON_KEY as string
);

export function getOnionAddress(
  host: string,
  address: string
): Promise<string | false> {
  if (host === "sats4.me") return getOnionAddressMain(address);
  else return getOnionAddressForDomain(host, address);
}

export async function getOnionAddressMain(
  address: string
): Promise<string | false> {
  const { data, error } = await supabase
    .from("LightningAddresses")
    .select("userOnionUrl")
    .eq("address", address.toLowerCase());
  if (error || !data || data.length !== 1) {
    return false;
  }
  return data[0].userOnionUrl;
}

export async function getOnionAddressForDomain(
  domain: string,
  addr: string
): Promise<string | false> {
  const { data, error } = await supabase
    .from("LightningAddresses")
    .select("userOnionUrl")
    .eq("domain", domain.toLowerCase());
  const { data: data2, error: error2 } = await supabase
    .from("LightningAddresses")
    .select("userOnionUrl")
    .eq("domain", domain.toLowerCase())
    .eq("address", addr.toLowerCase());

  if (error || !data || data.length === 0) {
    return false;
  }
  if (error2 || !data2 || data2.length === 0 || data.length === 1)
    return data[0].userOnionUrl;

  return data2[0].userOnionUrl;
}
