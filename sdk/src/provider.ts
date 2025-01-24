import { JsonRpcProvider } from "ethers"
import { Chain } from "./types"

export const CHAIN_ID = {
  [Chain.eth]: 1,
  [Chain.gno]: 10,
  [Chain.arb1]: 42161,
  [Chain.oeth]: 10,
  [Chain.base]: 8453,
} as const

export const ethProvider = new JsonRpcProvider("https://rpc.eth.gateway.fm", {
  chainId: CHAIN_ID[Chain.eth],
  name: "Ethereum",
})

export const gnoProvider = new JsonRpcProvider(
  "https://rpc.gnosis.gateway.fm",
  {
    chainId: CHAIN_ID[Chain.gno],
    name: "Gnosis",
  }
)

export const arb1Provider = new JsonRpcProvider(
  "https://rpc.arb1.arbitrum.gateway.fm",
  {
    chainId: CHAIN_ID[Chain.arb1],
    name: "ArbitrumOne",
  }
)

export const oethProvider = new JsonRpcProvider(
  "https://optimism.llamarpc.com",
  {
    chainId: CHAIN_ID[Chain.oeth],
    name: "Optimism",
  }
)

export const baseProvider = new JsonRpcProvider("https://base.llamarpc.com", {
  chainId: CHAIN_ID[Chain.base],
  name: "Base",
})
