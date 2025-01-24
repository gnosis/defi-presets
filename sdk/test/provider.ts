import { JsonRpcProvider } from "ethers"
import { ANVIL_PORTS } from "./chains"
import { Chain } from "../src"

let providers: Map<Chain, JsonRpcProvider> = new Map()

export const getProvider = (chain: Chain) => {
  if (!providers.has(chain)) {
    providers.set(
      chain,
      new JsonRpcProvider(`http://127.0.0.1:${ANVIL_PORTS[chain]}`)
    )
  }
  return providers.get(chain)!
}
