import { NotFoundError } from "../../../errors"
import ethCoreTokens from "./_ethCoreInfo"
import ethPrimeTokens from "./_ethPrimeInfo"
import ethEtherFiTokens from "./_ethEtherFiInfo"
import ethMarkets from "./_ethMarketInfo"
import gnoTokens from "./_gnoCoreInfo"
import arb1Tokens from "./_arb1CoreInfo"
import oethTokens from "./_oethCoreInfo"
import baseTokens from "./_baseCoreInfo"
import {
  EthToken,
  EthMarket,
  GnoToken,
  Arb1Token,
  OethToken,
  BaseToken,
  Token,
} from "./types"
import { DelegateToken, StakeToken } from "../v2/types"
import { findDelegateToken, findStakeToken } from "../v2/index"
import { depositEther, depositToken, borrowEther, borrowToken } from "./actions"
import { stake, delegate } from "../v2/actions"
import { Chain } from "../../../../src"

const findToken = (
  tokens: readonly Token[],
  symbolOrAddress: string
): Token => {
  const symbolOrAddressLower = symbolOrAddress.toLowerCase()
  const token = tokens.find(
    (token) =>
      token.symbol.toLowerCase() === symbolOrAddressLower ||
      token.token.toLowerCase() === symbolOrAddressLower
  )
  if (!token) {
    throw new NotFoundError(`Token not found: ${symbolOrAddress}`)
  }
  return token
}

const findMarket = (nameOrPoolAddress: string) => {
  const nameOrPoolAddressLower = nameOrPoolAddress.toLowerCase()

  const market = ethMarkets.find(
    (market) =>
      market.name.toLowerCase() === nameOrPoolAddressLower ||
      market.poolAddress.toLowerCase() === nameOrPoolAddressLower
  )

  if (!market) {
    throw new NotFoundError(`Market not found: ${nameOrPoolAddress}`)
  }

  return market
}

const getEthMarketTokens = (marketName: string): readonly EthToken[] => {
  switch (marketName) {
    case "Core":
      return ethCoreTokens
    case "Prime":
      return ethPrimeTokens
    case "EtherFi":
      return ethEtherFiTokens
    default:
      throw new NotFoundError(`Unsupported Ethereum market: ${marketName}`)
  }
}

export const eth = {
  deposit: async ({
    market,
    targets,
  }: {
    market: EthMarket["name"] | EthMarket["poolAddress"]
    targets: ("ETH" | EthToken["symbol"] | EthToken["token"])[]
  }) => {
    const selectedMarket = findMarket(market)
    const tokens = getEthMarketTokens(selectedMarket.name)

    return targets.flatMap((target) =>
      target === "ETH"
        ? depositEther(Chain.eth, market)
        : depositToken(Chain.eth, findToken(tokens, target), market)
    )
  },

  borrow: async ({
    market,
    targets,
  }: {
    market: EthMarket["name"] | EthMarket["poolAddress"]
    targets: ("ETH" | EthToken["symbol"] | EthToken["token"])[]
  }) => {
    const selectedMarket = findMarket(market)
    const tokens = getEthMarketTokens(selectedMarket.name)

    return targets.flatMap((target) =>
      target === "ETH"
        ? borrowEther(Chain.eth)
        : borrowToken(Chain.eth, findToken(tokens, target))
    )
  },

  stake: async ({
    targets,
  }: {
    targets: (StakeToken["address"] | StakeToken["symbol"])[]
  }) => {
    return targets.flatMap((token) => stake(findStakeToken(token)))
  },

  delegate: async ({
    targets,
    delegatee,
  }: {
    targets: (DelegateToken["address"] | DelegateToken["symbol"])[]
    delegatee: string
  }) => {
    return targets.flatMap((target) =>
      delegate(findDelegateToken(target), delegatee)
    )
  },
}

export const gno = {
  deposit: async ({
    targets,
  }: {
    targets: ("XDAI" | GnoToken["symbol"] | GnoToken["token"])[]
  }) => {
    return targets.flatMap((target) =>
      target === "XDAI"
        ? depositEther(Chain.gno)
        : depositToken(Chain.gno, findToken(gnoTokens, target))
    )
  },

  borrow: async ({
    targets,
  }: {
    targets: ("XDAI" | GnoToken["symbol"] | GnoToken["token"])[]
  }) => {
    return targets.flatMap((target) =>
      target === "XDAI"
        ? borrowEther(Chain.gno)
        : borrowToken(Chain.gno, findToken(gnoTokens, target))
    )
  },
}

export const arb1 = {
  deposit: async ({
    targets,
  }: {
    targets: ("ETH" | Arb1Token["symbol"] | Arb1Token["token"])[]
  }) => {
    return targets.flatMap((target) =>
      target === "ETH"
        ? depositEther(Chain.arb1)
        : depositToken(Chain.arb1, findToken(arb1Tokens, target))
    )
  },

  borrow: async ({
    targets,
  }: {
    targets: ("ETH" | Arb1Token["symbol"] | Arb1Token["token"])[]
  }) => {
    return targets.flatMap((target) =>
      target === "ETH"
        ? borrowEther(Chain.arb1)
        : borrowToken(Chain.arb1, findToken(arb1Tokens, target))
    )
  },
}

export const oeth = {
  deposit: async ({
    targets,
  }: {
    targets: ("ETH" | OethToken["symbol"] | OethToken["token"])[]
  }) => {
    return targets.flatMap((target) =>
      target === "ETH"
        ? depositEther(Chain.oeth)
        : depositToken(Chain.oeth, findToken(oethTokens, target))
    )
  },

  borrow: async ({
    targets,
  }: {
    targets: ("ETH" | OethToken["symbol"] | OethToken["token"])[]
  }) => {
    return targets.flatMap((target) =>
      target === "ETH"
        ? borrowEther(Chain.oeth)
        : borrowToken(Chain.oeth, findToken(oethTokens, target))
    )
  },
}

export const base = {
  deposit: async ({
    targets,
  }: {
    targets: ("ETH" | BaseToken["symbol"] | BaseToken["token"])[]
  }) => {
    return targets.flatMap((target) =>
      target === "ETH"
        ? depositEther(Chain.base)
        : depositToken(Chain.base, findToken(baseTokens, target))
    )
  },

  borrow: async ({
    targets,
  }: {
    targets: ("ETH" | BaseToken["symbol"] | BaseToken["token"])[]
  }) => {
    return targets.flatMap((target) =>
      target === "ETH"
        ? borrowEther(Chain.base)
        : borrowToken(Chain.base, findToken(baseTokens, target))
    )
  },
}
