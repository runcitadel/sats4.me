import { IProvider } from "./provider.js";
import { LnUrlProvider } from "./lnurl.js";

export class LnAddrProvider extends LnUrlProvider implements IProvider {}
