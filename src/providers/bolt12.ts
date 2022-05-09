import { IProvider } from "./provider.js";
import RPCClient, { WaitinvoiceStatus } from "@core-ln/core";
import { randomUUID } from "crypto";

/**
 * Bolt12 creates a bolt11 invoice to our node with a slightly higher amount than requested to cover fees,
 * and once it is paid, pays the bolt12 offer
 * 
 * It is currently highly experimental in sats4me and should not be used
 */
export class Bolt12Provider implements IProvider {
  supportsOnchain = false;
  coreLnClient: RPCClient;
  // Technically possible, but not implemented yet
  hasPolling = false;

  constructor(cLnSocket: string) {
    this.coreLnClient = new RPCClient(cLnSocket);
  }

  async getInvoice({
    amountMsat: amount,
    target: bolt12,
    username,
    comment,
  }: {
    username: string;
    target: string;
    amountMsat: number;
    host: string;
    comment: string;
  }) {
    // Ensure the payment could be made
    await this.coreLnClient.fetchinvoice({
      offer: bolt12,
      msatoshi: amount,
    });
    const label = `${username}-${randomUUID()}-sats4me`;
    const invoice = await this.coreLnClient.invoice({
      // 10 sats for potential fees
      msatoshi: amount + 10000,
      label,
      description: `Bolt 12 invoice for ${username} - powered by sats4.me`,
    });
    this.coreLnClient
      .waitinvoice({
        label,
      })
      .then(async (result) => {
        if (result.status === WaitinvoiceStatus.Paid) {
          const bolt12Invoice = await this.coreLnClient.fetchinvoice({
            offer: bolt12,
            msatoshi: amount,
            payer_note: comment,
          });
          this.coreLnClient.pay({
            bolt11: bolt12Invoice.invoice,
            msatoshi: amount.toString(),
          });
        }
      });
    return {
      bolt11: invoice.bolt11,
      paymentHash: invoice.payment_hash,
    };
  }

  async getAddr(): Promise<string> {
    throw new Error("Not supported on this backend!");
  }

  isPaid(targetUrl: string, paymentHash: string): Promise<boolean> {
    throw new Error("Not supported on this backend!");
  }
}
