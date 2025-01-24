import { Permission, c } from "zodiac-roles-sdk"
import { allow } from "zodiac-roles-sdk/kit"
import { allowErc20Approve } from "../../../conditions"
import { Vault } from "./types"
import { contracts } from "../../../../eth-sdk/config"
import { Chain } from "../../../../src"

export const stake = (chain: Chain, vault: Vault) => {
  const permissions: Permission[] = [
    {
      ...allow.mainnet.stakeWiseV3.vault.updateState(),
      targetAddress: vault.id,
    },
    {
      ...allow.mainnet.stakeWiseV3.vault.mintOsToken(c.avatar),
      targetAddress: vault.id,
    },
    {
      ...allow.mainnet.stakeWiseV3.vault.burnOsToken(),
      targetAddress: vault.id,
    },
    {
      ...allow.mainnet.stakeWiseV3.vault.enterExitQueue(undefined, c.avatar),
      targetAddress: vault.id,
    },
    {
      ...allow.mainnet.stakeWiseV3.vault.claimExitedAssets(),
      targetAddress: vault.id,
    },
  ]

  switch (chain) {
    case Chain.eth:
      permissions.push(
        {
          ...allow.mainnet.stakeWiseV3.vault.deposit(c.avatar, undefined, {
            send: true,
          }),
          targetAddress: vault.id,
        },
        {
          ...allow.mainnet.stakeWiseV3.vault.updateStateAndDeposit(
            c.avatar,
            undefined,
            undefined,
            {
              send: true,
            }
          ),
          targetAddress: vault.id,
        }
      )
      break

    case Chain.gno:
      permissions.push(
        ...allowErc20Approve([contracts.gnosis.gno], [vault.id]),
        {
          ...allow.gnosis.stakeWiseV3.vault.deposit(undefined, c.avatar),
          targetAddress: vault.id,
        }
      )
      break

    default:
      throw new Error(`Unsupported chain: ${chain}`)
  }

  return permissions
}
