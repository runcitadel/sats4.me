import { IProvider } from "./provider";
import axios from "axios";
import { Agent } from "http";

export class LnMeProvider implements IProvider {
  supportsOnchain = true;
  hasPolling = true;

  constructor(public agent: Agent) {}

  async getInvoice({
    target: targetUrl,
    amountMsat,
    comment,
    host,
    proto
  }: {
    target: string;
    amountMsat: number;
    comment: string;
    host: string;
    proto: string;
  }) {
    const data = await axios.post(
      `${targetUrl}/v1/invoices`,
      {
        memo: comment,
        value: Math.round(amountMsat / 1000)
      },
      {
        httpAgent: this.agent,
        headers: {
          "X-Forwarded-For": host,
          "X-Forwarded-Proto": proto,
          "X-Forwarded-Host": host,
          "Content-Type": "application/json",
        },
      }
    );
    return {
      paymentHash: data.data.payment_hash,
      bolt11: data.data.payment_request,
    };
  }

  async getAddr({
    targetUrl,
    host,
    proto,
  }: {
    targetUrl: string;
    host: string;
    proto: string;
  }): Promise<string> {
    const data = await axios.post(
      `${targetUrl}/v1/newaddress`,
      {},
      {
        httpAgent: this.agent,
        headers: {
          "X-Forwarded-For": host,
          "X-Forwarded-Proto": proto,
          "X-Forwarded-Host": host,
          "Content-Type": "application/json",
        },
      }
    );
    return data.data;
  }

  async isPaid(targetUrl: string, paymentHash: string) {
    const data = await axios.get(
      `${targetUrl}/v1/invoice/${paymentHash}`,
      {
        httpAgent: this.agent,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return data.data.settled as boolean;

  }
}
