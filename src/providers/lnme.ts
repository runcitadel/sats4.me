import { IProvider } from "./provider.ts";

export class LnMeProvider implements IProvider {
  supportsOnchain = true;
  hasPolling = true;

  constructor() { }

  async getInvoice({
    target: targetUrl,
    amountMsat,
    comment,
    host,
    proto,
    description,
    name,
  }: {
    target: string;
    amountMsat: number;
    comment: string;
    host: string;
    proto: string;
    description: string;
    name: string;
  }) {
    if (!targetUrl.startsWith("http"))
      targetUrl = `https://${targetUrl}`;
    const res = await fetch(
      `${targetUrl}/.well-known/lnurlp/${name}?amount=${amountMsat}&comment=${comment || description}`,
      {
        headers: {
          "X-Forwarded-For": host,
          "X-Forwarded-Proto": proto,
          "X-Forwarded-Host": host,
        },
      }
    );
    const data = await res.json();
    console.log(data);
    return {
      paymentHash: data.payment_hash,
      bolt11: data.payment_request,
    };
  }

  async getAddr({
    target: targetUrl,
  }: {
    target: string;
    host: string;
    proto: string;
  }): Promise<string> {
    if (!targetUrl.startsWith("http"))
      targetUrl = `https://${targetUrl}`;
      const res = await fetch(
        `${targetUrl}/v1/newaddress`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return await res.json();
  }
}
