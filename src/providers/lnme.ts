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
  }: {
    target: string;
    amountMsat: number;
    comment: string;
    host: string;
    proto: string;
  }) {
    if (!targetUrl.startsWith("http"))
      targetUrl = `http://${targetUrl}`;
    const res = await fetch(
      `${targetUrl}/v1/invoices`,
      {
        body: JSON.stringify({
          memo: comment,
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
      targetUrl = `http://${targetUrl}`;
      const res = await fetch(
        `${targetUrl}/v1/newaddress`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log(`${targetUrl}/v1/newaddress`);
      return await res.json();
  }

  async isPaid(targetUrl: string, paymentHash: string) {
    if (!targetUrl.startsWith("http"))
      targetUrl = `http://${targetUrl}`;
    const res = await fetch(
      `${targetUrl}/v1/invoice/${paymentHash}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const data = await res.json();
    return data.settled as boolean;

  }
}
