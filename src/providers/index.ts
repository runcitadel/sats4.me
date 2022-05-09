import { Agent } from "http";
import { Bolt12Provider } from "./bolt12.js";
import { LnAddrProvider } from "./lnaddr.js";
import { LnMeProvider } from "./lnme.js";
import { LnUrlProvider } from "./lnurl.js";
import { ProviderManager } from "./provider.js";

export default class Providers extends ProviderManager {
  constructor(cLnSocketPath: string, agent: Agent) {
    super();
    this.addProvider("bolt12", new Bolt12Provider(cLnSocketPath));
    this.addProvider("lnme", new LnMeProvider(agent));
    this.addProvider("otheraddr", new LnAddrProvider(agent));
    this.addProvider("lnurl", new LnUrlProvider(agent));
    // TODO: Alby & Lnbits
  }
}
