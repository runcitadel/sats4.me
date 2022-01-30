# Lightning address reverse proxy

  This is the source code of our reverse proxy for Lightning Adresses running at [ln.runcitadel.space](https://ln.runcitadel.space).
  
  If you can log in with a node signature, you can register up to 5 names, which will be reverse-proxied to the onion URL of your [LnMe instance](https://github.com/bumi/lnme).
  
### Dependencies

This needs a MongoDB instance (we're running this on MongoDB Atlas), a SOCKS proxy for Tor, and a running LND instance.
