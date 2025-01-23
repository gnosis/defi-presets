import { z } from "zod"

const zEthTargets = z.enum([
  "stETH",
  "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
  "ETHx",
  "0xA35b1B31Ce002FBF2058D22F30f95D405200A15b",
  "ETH",
  "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
])

export const eth = {
  stake: z.object({
    targets: zEthTargets.array(),
  }),
}
