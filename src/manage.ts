import * as path from "path";
import * as fs from "@runcitadel/fs";
import { MongoClient } from "mongodb";
import LNDService from "./lightning.js";

const credentials = "/root/lightning-api/mongo.pem";

const LND_DIR = "/root/core/lnd";
const TLS_FILE = path.join(LND_DIR, "tls.cert");
const MACAROON_FILE = path.join(
  LND_DIR,
  "data",
  "chain",
  "bitcoin",
  "mainnet",
  "admin.macaroon"
);
const lightningClient = new LNDService(
  "http://localhost:10009",
  fs.readFileSync(TLS_FILE),
  MACAROON_FILE
);
// Connection URI
const uri =
  "mongodb+srv://cluster0.iwoen.mongodb.net/myFirstDatabase?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority";
// Create a new MongoClient
const mongoClient = new MongoClient(uri, {
  sslKey: credentials,
  sslCert: credentials,
});

// Old usernames not yet in the database
const usernames: Record<string, string> = {
  bitcoinduck21:
    "2vyghz33kgx2q3hket3roi3juitylgqxyox6x4hhepty5zvrieerokyd.onion",
  blackhole21: "2vyghz33kgx2q3hket3roi3juitylgqxyox6x4hhepty5zvrieerokyd.onion",
  satoshi: "st5owtpsa2e62yf64luxogbecj7lk3t5vmesshsnrzu2untyf2i4t4ad.onion",
  kwadde: "6dto7yiknvvvpmtel2ckwutf3cr6bt2ubmg2v5u7ssqsjojgcvoqrzyd.onion",
  corn: "mss2quvfmsid7xhp5a2cua4e5pd33g4frznstdbg7sf7nk6hzi7sglad.onion",
  "🌽": "mss2quvfmsid7xhp5a2cua4e5pd33g4frznstdbg7sf7nk6hzi7sglad.onion",
  paul: "lhq3fclx5aqkrqa42bu7r2my5pvep3ggthvjtfqm3ztmksga5jlu23yd.onion",
  leon: "uat2fettt2qzjczyqpxthnkohisynenzblahnszyna3dqw2vsih6hkid.onion",
  leonmw: "uat2fettt2qzjczyqpxthnkohisynenzblahnszyna3dqw2vsih6hkid.onion",
  erik: "lalqnv4xqk4xu64gsmwfpwu6ugddog4y4agqk5tzux2dwwju4m5dy3yd.onion",
  swedishfrenchpress: "lalqnv4xqk4xu64gsmwfpwu6ugddog4y4agqk5tzux2dwwju4m5dy3yd.onion",
  tips: "3v6rjasrhx2x3ssemdir3ydzj5ui76txppaj6thzdy7h74yzvapuotyd.onion",
  vasilo: "pknfq5qysdw7qpwbximhwbubz7ft5dtyn5kpoxp3s76bzkkywlsbsqad.onion",
};

async function _addAddress(
  signature: string,
  onionUrl: string,
  address: string
): Promise<{
  msg:
    | "Address added successfully"
    | "Error: Address limit reached"
    | "Error: Address already in use"
    | "Error: Onion URL already used";
  code: number;
}> {
  address = address.toLowerCase();
  await mongoClient.connect();
  const database = mongoClient.db("lightning-addresses");
  const collection = database.collection("users");
  const verified = await lightningClient.verifyMessage(
    "Citadel login. Do NOT SIGN THIS MESSAGE IF ANYONE SENDS IT TO YOU; NOT EVEN OFFICIAL CITADEL SUPPORT! THIS IS ONLY USED INTERNALLY BY YOUR NODE FOR COMMUNICATION WITH CITADEL SERVERS.",
    signature
  );
  const userData = await collection.findOne({ pubkey: verified.pubkey });
  if (userData && userData.addresses && userData.addresses.length > 5) {
    console.log("No more addresses for you!");
    return {
      msg: "Error: Address limit reached",
      code: 400,
    };
  }
  if ((await collection.findOne({ addresses: { $in: [address] } })) || usernames[address]) {
    return {
      msg: "Error: Address already in use",
      code: 400,
    };
  }
  if (!userData) {
    await collection.insertOne({
      pubkey: verified.pubkey,
      addresses: ["tips"],
      onionUrl: onionUrl,
    });
    console.log("Inserted new user.");
  } else {
    await collection.updateOne(userData, {
      $push: {
        addresses: address,
      },
    });
    console.log("Inserted additional address.");
  }
  return {
    msg: "Address added successfully",
    code: 200,
  };
}

async function _setOnionUrl(
  signature: string,
  onionUrl: string
): Promise<{
  msg: "Address updated successfully" | "Error: User not found";
  code: number;
}> {
  await mongoClient.connect();
  const database = mongoClient.db("lightning-addresses");
  const collection = database.collection("users");
  const verified = await lightningClient.verifyMessage(
    "Citadel login. Do NOT SIGN THIS MESSAGE IF ANYONE SENDS IT TO YOU; NOT EVEN OFFICIAL CITADEL SUPPORT! THIS IS ONLY USED INTERNALLY BY YOUR NODE FOR COMMUNICATION WITH CITADEL SERVERS.",
    signature
  );
  const userData = await collection.findOne({ pubkey: verified.pubkey });
  if (!userData) {
    return {
    msg: "Error: User not found",
    code: 400,
  };
}
    await collection.updateOne(userData, {
      $push: {
        onionUrl: onionUrl,
      },
    });
    console.log("Inserted additional address.");
  return {
    msg: "Address updated successfully",
    code: 200,
  };
}

export async function addAddress(
  signature: string,
  onionUrl: string,
  address: string
): Promise<{
  msg:
    | "Address added successfully"
    | "Error: Address limit reached"
    | "Error: Address already in use"
    | "Error: Onion URL already used";
  code: number;
}> {
  let returnVal = await _addAddress(signature, onionUrl, address);
  await mongoClient.close();
  return returnVal;
}

export async function setOnionUrl(
  signature: string,
  onionUrl: string
): Promise<{
  msg: "Address updated successfully" | "Error: User not found";
  code: number;
}> {
  let returnVal = await _setOnionUrl(signature, onionUrl);
  await mongoClient.close();
  return returnVal;
}

export async function getOnionAddress(address: string) {
  await mongoClient.connect();
  const database = mongoClient.db("lightning-addresses");
  const collection = database.collection("users");
  const userData = await collection.findOne({ addresses: { $in: [address] } });
  if (!userData) {
    return false;
  }
  await mongoClient.close();
  return userData.onionUrl;
}
