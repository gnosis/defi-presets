import { allow } from "zodiac-roles-sdk/kit"
import { EthPool } from "./types"
import { NotFoundError } from "../../errors"
import _ethPools from "./_ethPools"
import { Permission } from "zodiac-roles-sdk/."
import { allowErc20Approve } from "../../conditions"
import { c } from "zodiac-roles-sdk"
import { contracts } from "../../../eth-sdk/config"

const WSTETH = contracts.mainnet.lido.wstEth

const findPool = (nameOrAddress: string) => {
  const pools = _ethPools
  const nameOrAddressLower = nameOrAddress.toLowerCase()
  const pool = pools.find(
    (pool) =>
      pool.tokenAddress.toLowerCase() === nameOrAddressLower ||
      pool.tokenSymbol.toLowerCase() === nameOrAddressLower
  )
  if (!pool) {
    throw new NotFoundError(`Pool not found: ${nameOrAddress}`)
  }
  return pool
}

export const eth = {
  deposit: async ({
    targets,
  }: {
    targets: (EthPool["tokenAddress"] | EthPool["tokenSymbol"])[]
  }) => {
    return targets.flatMap((target) => {
      const pool = findPool(target)
      const permissions: Permission[] = []
      if (pool.tokenSymbol === "wstETH") {
        permissions.push(
          allow.mainnet.lido.stEth.approve(WSTETH),
          allow.mainnet.lido.wstEth.wrap()
        )
      }
      permissions.push(
        ...allowErc20Approve([pool.tokenAddress], [pool.address]),
        {
          ...allow.mainnet.symbiotic.defaultCollateral[
            "deposit(address,uint256)"
          ](c.avatar, undefined),
          targetAddress: pool.address,
        },
        {
          ...allow.mainnet.symbiotic.defaultCollateral.withdraw(
            c.avatar,
            undefined
          ),
          targetAddress: pool.address,
        }
      )
      return permissions
    })
  },
}
