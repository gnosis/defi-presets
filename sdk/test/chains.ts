import { Chain } from "../src"

export const ANVIL_PORTS: Record<Chain, number> = {
  [Chain.eth]: 8545, // eth
  [Chain.arb1]: 8546, // arb1
  [Chain.gno]: 8547, // gno
  [Chain.oeth]: 8548, // oeth
  [Chain.base]: 8549, // base
} as const
