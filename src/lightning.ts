import { createChannel, createClient, Client } from "nice-grpc";
import { GetInfoResponse, LightningDefinition } from "./lnrpc/lightning.js";
import { WalletUnlockerDefinition } from "./lnrpc/walletunlocker.js";
import { StateDefinition, WalletState } from "./lnrpc/stateservice.js";
import * as grpc from "@grpc/grpc-js";
import * as fs from "@runcitadel/fs";

type RpcClientInfo = {
  Lightning?: Client<typeof LightningDefinition>;
  WalletUnlocker: Client<typeof WalletUnlockerDefinition>;
  State: Client<typeof StateDefinition>;
  state: WalletState;
  offline?: boolean;
};

type RpcClientWithLightningForSure = RpcClientInfo & {
  Lightning: Client<typeof LightningDefinition>;
};

export default class LNDService {
  #wasOnline = false;
  #channel: grpc.Channel | undefined = undefined;
  constructor(
    private connectionUrl: string,
    private cert: Buffer,
    private macaroonFile: string
  ) {}

  protected async getCommunicationChannel(): Promise<grpc.Channel> {
    if (this.#channel) return this.#channel;
    const tlsCredentials = grpc.credentials.createSsl(this.cert);
    // Read macaroons, they should exist in this state
    const macaroon = await fs.readFile(this.macaroonFile);

    // build credentials from macaroons
    const metadata = new grpc.Metadata();
    metadata.add("macaroon", macaroon.toString("hex"));
    const macaroonCreds = grpc.credentials.createFromMetadataGenerator(
      (_args, callback) => {
        callback(null, metadata);
      }
    );
    const fullCredentials = grpc.credentials.combineChannelCredentials(
      tlsCredentials,
      macaroonCreds
    );

    this.#channel = createChannel(this.connectionUrl, fullCredentials);
    return this.#channel;
  }

  protected async initializeRPCClient(): Promise<RpcClientInfo> {
    // Create credentials
    const lndCert = this.cert;
    const tlsCredentials = grpc.credentials.createSsl(lndCert);
    const channel = createChannel(this.connectionUrl, tlsCredentials);

    const walletUnlocker = createClient(WalletUnlockerDefinition, channel);

    const stateService = createClient(StateDefinition, channel);

    let walletState;
    try {
      walletState = await stateService.getState({});
    } catch {
      return {
        WalletUnlocker: walletUnlocker,
        State: stateService,
        state: WalletState.NON_EXISTING,
        offline: true,
      };
    }

    /* WAIING_TO_START will be used in the future
     * https://github.com/Lightningnetwork/lnd/blob/bb5c3f3b51c7c58296d120d5afe4ed0640d5751e/docs/leader_election.md
     * Once we have stuff like that implemented on the Citadel dashboard
     */
    if (
      walletState.state == WalletState.NON_EXISTING ||
      walletState.state == WalletState.LOCKED ||
      walletState.state == WalletState.WAITING_TO_START
    ) {
      return {
        WalletUnlocker: walletUnlocker,
        State: stateService,
        state: walletState.state,
      };
    } else if (
      walletState.state == WalletState.RPC_ACTIVE ||
      walletState.state == WalletState.SERVER_ACTIVE
    ) {
      const authenticatedChannel = await this.getCommunicationChannel();

      const LightningClient: Client<typeof LightningDefinition> = createClient(
        LightningDefinition,
        authenticatedChannel
      );

      this.#wasOnline = true;

      return {
        WalletUnlocker: walletUnlocker,
        State: stateService,
        Lightning: LightningClient,
        state: walletState.state,
      };
    } else {
      throw new Error("Unexpected LND state!");
    }
  }

  protected async expectWalletToExist(): Promise<RpcClientWithLightningForSure> {
    const client = await this.initializeRPCClient();
    if (!client.Lightning) throw new Error("Error: Wallet not ready");
    return client as RpcClientWithLightningForSure;
  }

  protected async getLightningClient(): Promise<
    Client<typeof LightningDefinition>
  > {
    if (this.#wasOnline) {
      const channel = await this.getCommunicationChannel();
      return createClient(LightningDefinition, channel);
    } else {
      const client = await this.expectWalletToExist();
      return client.Lightning;
    }
  }

  async getInfo(): Promise<GetInfoResponse> {
    const Lightning = await this.getLightningClient();
    return await Lightning.getInfo({});
  }

  async getVersion(): Promise<string> {
    const info = await this.getInfo();
    return info.version;
  }

  async signMessage(message: string): Promise<string> {
    const Lightning = await this.getLightningClient();
    // message as an Uint8Array
    const msg = Uint8Array.from(Buffer.from(message, "utf8"));
    const response = await Lightning.signMessage({ msg });
    return response.signature;
  }

  async verifyMessage(
    message: string,
    signature: string
  ): Promise<{
    pubkey: string;
    valid: boolean;
  }> {
    const Lightning = await this.getLightningClient();
    // message as an Uint8Array
    const msg = Uint8Array.from(Buffer.from(message, "utf8"));
    const response = await Lightning.verifyMessage({ msg, signature });
    return response;
  }
}
