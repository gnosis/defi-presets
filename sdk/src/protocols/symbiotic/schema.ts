import { z } from "zod"
import ethPools from "./_ethPools"

const zEthPool = z.enum([
  ...ethPools.map((pool) => pool.tokenSymbol),
  ...ethPools.map((pool) => pool.tokenAddress),
] as [string, string, ...string[]])

export const eth = {
  deposit: z.object({
    targets: zEthPool.array(),
  }),
  withdraw: z.object({
    targets: zEthPool.array(),
  }),
}
