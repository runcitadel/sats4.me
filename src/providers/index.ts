import { LnMeProvider } from "./lnme.ts";
import { ProviderManager } from "./provider.ts";

export class Providers extends ProviderManager {
  constructor() {
    super();
    this.addProvider("lnme", new LnMeProvider());
    // TODO: Other providers, lndhub & Lnbits
  }
}

export default new Providers();
