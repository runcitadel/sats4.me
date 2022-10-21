import { useState } from "preact/hooks";

export interface SendOnChainProps {
  user: string;
}

export default function SendOnChain(props: SendOnChainProps) {
  const [address, setAddress] = useState<string>(
    "Prefer onchain Bitcoin? Click here!",
  );
  async function getAddress() {
    const res = await fetch(
      `/address/${
        encodeURIComponent(props.user)
      }`,
    );
    setAddress(await res.text());
  }
  return (
    <a
      onClick={(event) => {
        event.preventDefault();
        getAddress();
      }}
      class="text-base block"
    >
      {address}
    </a>
  );
}
