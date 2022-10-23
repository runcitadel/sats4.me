import { IProvider } from "./provider.ts";
import lnbits from "npm:lnbits";

export class LnbitsProvider implements IProvider {
  hasPolling = true;
  supportsOnchain = false;

  async getInvoice({
    target,
    amountMsat,
    comment,
  }: {
    username: string;
    target: string;
    amountMsat: number;
    host: string;
    proto: string;
    comment: string;
  }): Promise<{ bolt11: string; paymentHash: string }> {
    let [invoiceKey, server] = target.split("@");
    if (!server.startsWith("http")) server = `http://${server}`;
    const userLnbits = lnbits({
      adminKey: "dummyValue",
      invoiceReadKey: invoiceKey,
      endpoint: server,
    });
    const invoice = await userLnbits.wallet.createInvoice({
      amount: Math.round(amountMsat / 1000),
      memo: comment || "sats4.me invoice",
    });

    return {
      bolt11: invoice.payment_request,
      paymentHash: invoice.payment_hash,
    };
  }

  getAddr(): Promise<string> {
    throw new Error("Not supported on this backend!");
  }
}
