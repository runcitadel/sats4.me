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
  }: {
    target: string;
    amountMsat: number;
    comment: string;
    host: string;
    proto: string;
    description: string;
  }) {
    if (!targetUrl.startsWith("http"))
      targetUrl = `https://${targetUrl}`;
    const res = await fetch(
      `${targetUrl}/v1/invoices`,
      {
        body: JSON.stringify({
          memo: description,
          value: Math.round(amountMsat / 1000)
        }),
        method: "POST",
        headers: {
          "X-Forwarded-For": host,
          "X-Forwarded-Proto": proto,
          "X-Forwarded-Host": host,
          "Content-Type": "application/json",
        },
      }
    );
    const data = await res.json();
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
