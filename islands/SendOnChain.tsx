import { useState } from "preact/hooks";

export interface SendOnChainProps {
  user: string;
}

export default function SendOnChain(props: SendOnChainProps) {
  const [address, setAddress] = useState<string>(
    "Prefer onchain Bitcoin? Click here!",
  );
  async function getAddress() {
    if (address === "Prefer onchain Bitcoin? Click here!") return;
    const res = await fetch(
      `/address/${
        encodeURIComponent(props.user)
      }`,
    );
    setAddress(await res.json());
  }
  return (
    <a
      onClick={(event) => {
        event.preventDefault();
        getAddress();
      }}
      class="text-base block cursor-pointer"
    >
      {address}
    </a>
  );
}
