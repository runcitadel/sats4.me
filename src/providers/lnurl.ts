import { IProvider } from "./provider.js";
import * as lnurl from "lnurl-pay";
import axios from "axios";
import { Agent } from "http";
import type { LnUrlRequestInvoiceResponse } from "lnurl-pay/dist/types/types";
import bolt11 from "bolt11";

const fetchGet = (agent: Agent) => {
  return async ({
    url,
    params,
  }: {
    url: string;
    params?: { [key: string]: string | number };
  }): Promise<{ [key: string]: string | number }> => {
    return axios.get(url, { params, httpAgent: agent }).then((response) => {
      if (response.data.status === "ERROR")
        throw new Error(response.data.reason + "");
      return response.data;
    });
  };
};
export class LnUrlProvider implements IProvider {
  supportsOnchain = false;
  hasPolling = false;

  constructor(public agent: Agent) {}

  async getInvoice({
    amountMsat: amount,
    target: lnurlp,
    comment,
  }: {
    comment: string;
    target: string;
    amountMsat: number;
  }) {
    const invoiceRules = await lnurl.requestPayServiceParams({
      lnUrlOrAddress: lnurlp,
      fetchGet: fetchGet(this.agent),
    });
    let invoice: LnUrlRequestInvoiceResponse;
    if(invoiceRules.commentAllowed >= comment.length) {
      invoice = await lnurl.requestInvoice({
        lnUrlOrAddress: lnurlp,
        fetchGet: fetchGet(this.agent),
        tokens: amount as any,
        comment
      });
    } else {
      invoice = await lnurl.requestInvoice({
        lnUrlOrAddress: lnurlp,
        fetchGet: fetchGet(this.agent),
        tokens: amount as any,
      });
    }
    const parsedInvoice = bolt11.decode(invoice.invoice);
    return {
      bolt11: invoice.invoice,
      paymentHash: parsedInvoice.tagsObject.payment_hash as string,
    };
  }

  async getAddr(target: {
    username: string;
    targetUrl: string;
    host: string;
    proto: string;
  }): Promise<string> {
    throw new Error("Not supported on this backend!");
  }

  isPaid(targetUrl: string, paymentHash: string): Promise<boolean> {
    throw new Error("Not supported on this backend!");
  }
}
