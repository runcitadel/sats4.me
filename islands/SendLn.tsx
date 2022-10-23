import { useState } from "preact/hooks";
import { requestProvider } from "https://deno.land/x/webln@v0.3.0/mod.ts";

export interface SendLnProps {
  user: string;
}

export default function SendLn(props: SendLnProps) {
  const [amount, setAmount] = useState<number | undefined>();
  const [memo, setMemo] = useState<string | undefined>();
  const [invoice, setInvoice] = useState<string | undefined>();
  const [paid, setPaid] = useState(false);
  async function sendSats() {
    const res = await fetch(
      `/callback/${
        encodeURIComponent(props.user)
      }?amount=${amount}&memo=${memo}`,
    );
    const invoice = (await res.json()).pr;
    try {
      const webln = await requestProvider();
      await webln.enable();
      await webln.sendPayment(invoice);
      setPaid(true);
    } catch {
      setInvoice(invoice);
    }
  }
  return (
    <p>
      {invoice
        ? (
          <>
            Thank you! <a href={`lightning:${invoice}`}>{invoice}</a>
          </>
        )
        : (
          <>
            {paid ? <>Thank you!</> : (
              <>
                Send me<br />
                <input
                  type="number"
                  placeholder="10000"
                  class="appearance-textfield bg-transparent outline-none border-b-1 border-white w-[5em] max-w-full text-center"
                  autofocus
                  autocomplete="off"
                  min="1"
                  value={amount}
                  onChange={(event) => {
                    setAmount(
                      Number((event.target! as HTMLInputElement).value),
                    );
                  }}
                />{" "}
                Sats
                <br />
                for
                <br />
                <input
                  type="text"
                  class="appearance-textfield bg-transparent outline-none border-b-1 border-white w-[5em] max-w-full text-center"
                  placeholder="message"
                  autocomplete="off"
                  value={memo}
                  onChange={(event) => {
                    setMemo((event.target! as HTMLInputElement).value);
                  }}
                />
                <button
                  class="rounded-full py-2 px-8 bg-blue-500 text-3xl w-5/6 mt-4"
                  onClick={() => sendSats()}
                >
                  ⚡ Send ⚡
                </button>
              </>
            )}
          </>
        )}
    </p>
  );
}
