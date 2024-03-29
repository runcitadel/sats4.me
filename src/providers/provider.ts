import { Provider } from "../manage.ts";

export interface IProvider {
  supportsOnchain: boolean;
  hasPolling: boolean;

  getInvoice(data: {
    username: string;
    target: string;
    amountMsat: number;
    host: string;
    proto: string;
    comment: string;
    description: string;
  }): Promise<{
    bolt11: string;
    paymentHash: string;
  }>;
  getAddr(data: {
    username: string;
    target: string;
    host: string;
    proto: string;
  }): string | Promise<string>;
}

export class ProviderManager {
  providers: Record<string, IProvider> = {};
  getProvider(provider: Provider): IProvider {
    const foundProvider = this.providers[provider];
    if(!foundProvider) throw new Error("Provider not found!");
    return foundProvider;
  }
  addProvider(name: string, provider: IProvider) {
    if(this.providers[name]) throw new Error("Provider already exists");
    this.providers[name] = provider;
  }
}
