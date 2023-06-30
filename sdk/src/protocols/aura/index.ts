import { NotFoundError } from "../../errors"
import pools from "./_info"
import { Pool, StakeToken, Token } from "./types"
import { deposit, stake, compound, lock } from "./actions"
import stakeTokens from "./stakeTokens"


const findPool = (nameOrAddressOrId: string): Pool => {
  const symbolAddressLower = nameOrAddressOrId.toLowerCase()
  const pool = pools.find(
    (pool) =>
      pool.name.toLowerCase() === symbolAddressLower ||
      pool.bpt.toLowerCase() === symbolAddressLower || 
      pool.id.toLowerCase() === symbolAddressLower 
  )
  if (!pool) {
    throw new NotFoundError(`Pool not found: ${nameOrAddressOrId}`)
  }
  return pool
}

const findStakeToken = (nameOrAddress: string): StakeToken => {
  const symbolAddressLower = nameOrAddress.toLowerCase()
  const stakeToken = stakeTokens.find(
    (stakeToken) =>
    stakeToken.address.toLowerCase() === symbolAddressLower ||
    stakeToken.symbol.toLowerCase() === symbolAddressLower
  )
  if (!stakeToken) {
    throw new NotFoundError(`Token not found: ${nameOrAddress}`)
  }
  return stakeToken
}


export const eth = {
  deposit: ({
    targets,
    tokens
  }: {
    // "targets" is a mandatory parameter
    targets: (Pool["name"] | Pool["bpt"] | Pool["id"])[],
    // "tokens" is an optional parameter since the user might want to allow (or not) the depositSingle() function
    // If "tokens" is not specified then we allow all the pool.tokens[]
    tokens?: Token[]
  }) => {
    return targets.flatMap(
      (target) => deposit(findPool(target), tokens)
    )
  },
  stake: ({
    targets
  }: {
    targets: (StakeToken["address"] | StakeToken["symbol"])[]
  }) => {
    return targets.flatMap(
      (target) => stake(findStakeToken(target))
    )
  },
  compound: ({
    targets
  }: {
    targets: (StakeToken["address"] | StakeToken["symbol"])[]
  }) => {
    return targets.flatMap(
      (target) => compound(findStakeToken(target))
    )
  },
  lock: () => {
    return lock()
  },
}