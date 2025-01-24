import { EthVault, GnoVault, Vault } from "./types"
import ethVaults from "./_ethVaults"
import gnoVaults from "./_gnoVaults"
import { NotFoundError } from "../../../errors"
import { stake } from "./actions"
import { Chain } from "../../../../src"

export const findVault = (vaults: readonly Vault[], nameOrId: string) => {
  const nameOrIdLower = nameOrId.toLowerCase()
  const vault = vaults.find(
    (vault) =>
      vault.name?.toLowerCase() === nameOrIdLower ||
      vault.id.toLowerCase() === nameOrIdLower
  )
  if (!vault) {
    throw new NotFoundError(`Pool not found: ${nameOrId}`)
  }
  return vault
}

export const eth = {
  stake: async (options: { targets: (EthVault["name"] | EthVault["id"])[] }) =>
    options.targets.flatMap((target) =>
      stake(Chain.eth, findVault(ethVaults, target))
    ),
}

export const gno = {
  stake: async (options: { targets: (GnoVault["name"] | GnoVault["id"])[] }) =>
    options.targets.flatMap((target) =>
      stake(Chain.gno, findVault(gnoVaults, target))
    ),
}
