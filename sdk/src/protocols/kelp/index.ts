import { allow } from "zodiac-roles-sdk/kit"
import { contracts } from "../../../eth-sdk/config"
import { NotFoundError } from "../../errors"

const tokens = [
  {
    name: "stETH",
    address: contracts.mainnet.lido.stEth,
  },
  {
    name: "ETHx",
    address: contracts.mainnet.kelp.ethx,
  },
  {
    name: "ETH",
    address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  },
]

export const eth = {
  stake: async ({
    targets,
  }: {
    targets: ((typeof tokens)[number]["name"] | { address: `0x${string}` })[]
  }) => {
    return targets.flatMap((target) => {
      if (target === "stETH" || target === contracts.mainnet.lido.stEth) {
        return [
          allow.mainnet.lido.stEth.approve(
            contracts.mainnet.kelp.LRTDepositPool
          ),
          allow.mainnet.kelp.LRTDepositPool.depositAsset(
            contracts.mainnet.lido.stEth,
            undefined,
            undefined,
            undefined
          ),
          allow.mainnet.kelp.rseth.approve(
            contracts.mainnet.kelp.LRTWithdrawalManager
          ),
          allow.mainnet.kelp.LRTWithdrawalManager.initiateWithdrawal(
            contracts.mainnet.lido.stEth,
            undefined,
            undefined
          ),
          allow.mainnet.kelp.LRTWithdrawalManager.completeWithdrawal(
            contracts.mainnet.lido.stEth,
            undefined
          ),
        ]
      }
      if (target === "ETHx" || target === contracts.mainnet.kelp.ethx) {
        return [
          allow.mainnet.kelp.ethx.approve(
            contracts.mainnet.kelp.LRTDepositPool
          ),
          allow.mainnet.kelp.LRTDepositPool.depositAsset(
            contracts.mainnet.kelp.ethx,
            undefined,
            undefined,
            undefined
          ),
          allow.mainnet.kelp.rseth.approve(
            contracts.mainnet.kelp.LRTWithdrawalManager
          ),
          allow.mainnet.kelp.LRTWithdrawalManager.initiateWithdrawal(
            contracts.mainnet.kelp.ethx,
            undefined,
            undefined
          ),
          allow.mainnet.kelp.LRTWithdrawalManager.completeWithdrawal(
            contracts.mainnet.kelp.ethx,
            undefined
          ),
        ]
      }
      if (
        target === "ETH" ||
        target === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
      ) {
        return [
          allow.mainnet.kelp.LRTDepositPool.depositETH(undefined, undefined, {
            send: true,
          }),
          allow.mainnet.kelp.rseth.approve(
            contracts.mainnet.kelp.LRTWithdrawalManager
          ),
          allow.mainnet.kelp.LRTWithdrawalManager.initiateWithdrawal(
            "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
            undefined,
            undefined
          ),
          allow.mainnet.kelp.LRTWithdrawalManager.completeWithdrawal(
            "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
            undefined
          ),
        ]
      }

      throw new NotFoundError(`Token not found: ${target}`)
    })
  },
}
