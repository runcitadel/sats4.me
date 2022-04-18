import Supabase from "@supabase/supabase-js";

const supabase = Supabase.createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_ADMIN_KEY as string
);

export async function getOnionAddress(address: string): Promise<string | false> {
  const { data } = await supabase.from("LightningAddresses").select("address").eq("address", address.toLowerCase());
  if(!data || data.length !== 1) {
    return false;
  }
  return data[0].userOnionUrl;
}
