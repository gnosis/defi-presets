import { z } from "zod"
import _ethPools from "./_ethPools"

const zEthPool = z.enum([
  ..._ethPools.map((pool) => pool.name),
  ..._ethPools.map((pool) => pool.address),
] as [string, string, ...string[]])

export const eth = {
  deposit: z.object({
    targets: zEthPool.array(),
  }),
  withdraw: z.object({
    targets: zEthPool.array(),
  }),
}
