import { allow } from "zodiac-roles-sdk/kit"
import { Permission, c } from "zodiac-roles-sdk"
import ethTokens from "./_ethCoreInfo"
import gnoTokens from "./_gnoCoreInfo"
import arb1Tokens from "./_arb1CoreInfo"
import oethTokens from "./_oethCoreInfo"
import baseTokens from "./_baseCoreInfo"
import { Token } from "./types"
import { allowErc20Approve } from "../../../conditions"
import { contracts } from "../../../../eth-sdk/config"
import { Chain } from "../../../../src"

export const _getAllAddresses = (chain: Chain, market: string) => {
  if (chain === Chain.eth) {
    switch (market) {
      case "Core":
        return {
          aNativeToken: contracts.mainnet.aaveV3.aEthWeth as `0x${string}`,
          wrappedTokenGatewayV3: contracts.mainnet.aaveV3
            .wrappedTokenGatewayCoreV3 as `0x${string}`,
          poolV3: contracts.mainnet.aaveV3.poolCoreV3 as `0x${string}`,
          wrappedNativeToken: contracts.mainnet.weth as `0x${string}`,
          variableDebtWrappedNativeToken: contracts.mainnet.aaveV3
            .variableDebtWeth as `0x${string}`,
        }

      case "Prime":
        return {
          aNativeToken: contracts.mainnet.aaveV3.aEthLidoWeth as `0x${string}`,
          wrappedTokenGatewayV3: contracts.mainnet.aaveV3
            .wrappedTokenGatewayPrimeV3 as `0x${string}`,
          poolV3: contracts.mainnet.aaveV3.poolPrimeV3 as `0x${string}`,
          wrappedNativeToken: contracts.mainnet.weth as `0x${string}`,
          variableDebtWrappedNativeToken: contracts.mainnet.aaveV3
            .variableDebtEthLidoWeth as `0x${string}`,
        }

      case "EtherFi":
        return {
          aNativeToken: contracts.mainnet.aaveV3.aEthLidoWeth as `0x${string}`,
          wrappedTokenGatewayV3: undefined, // EtherFi market does not use this
          poolV3: contracts.mainnet.aaveV3.poolEtherFiV3 as `0x${string}`,
          wrappedNativeToken: contracts.mainnet.weth as `0x${string}`,
          variableDebtWrappedNativeToken: contracts.mainnet.aaveV3
            .variableDebtEthLidoWeth as `0x${string}`,
        }

      default:
        throw new Error(`Unsupported Ethereum market: ${market}`)
    }
  }

  switch (chain) {
    case Chain.gno:
      return {
        aNativeToken: contracts.gnosis.aaveV3.aGnoWXDAI as `0x${string}`,
        wrappedTokenGatewayV3: contracts.gnosis.aaveV3
          .wrappedTokenGatewayV3 as `0x${string}`,
        poolV3: contracts.gnosis.aaveV3.poolV3 as `0x${string}`,
        wrappedNativeToken: contracts.gnosis.wxdai as `0x${string}`,
        variableDebtWrappedNativeToken: contracts.gnosis.aaveV3
          .variableDebtWXDAI as `0x${string}`,
      }

    case Chain.arb1:
      return {
        aNativeToken: contracts.arbitrumOne.aaveV3.aArbWeth as `0x${string}`,
        wrappedTokenGatewayV3: contracts.arbitrumOne.aaveV3
          .wrappedTokenGatewayV3 as `0x${string}`,
        poolV3: contracts.arbitrumOne.aaveV3.poolV3 as `0x${string}`,
        wrappedNativeToken: contracts.arbitrumOne.weth as `0x${string}`,
        variableDebtWrappedNativeToken: contracts.arbitrumOne.aaveV3
          .variableDebtWeth as `0x${string}`,
      }

    case Chain.oeth:
      return {
        aNativeToken: contracts.optimism.aaveV3.aOptWeth as `0x${string}`,
        wrappedTokenGatewayV3: contracts.optimism.aaveV3
          .wrappedTokenGatewayV3 as `0x${string}`,
        poolV3: contracts.optimism.aaveV3.poolV3 as `0x${string}`,
        wrappedNativeToken: contracts.optimism.weth as `0x${string}`,
        variableDebtWrappedNativeToken: contracts.optimism.aaveV3
          .variableDebtWeth as `0x${string}`,
      }

    case Chain.base:
      return {
        aNativeToken: contracts.base.aaveV3.aBasWeth as `0x${string}`,
        wrappedTokenGatewayV3: contracts.base.aaveV3
          .wrappedTokenGatewayV3 as `0x${string}`,
        poolV3: contracts.base.aaveV3.poolV3 as `0x${string}`,
        wrappedNativeToken: contracts.base.weth as `0x${string}`,
        variableDebtWrappedNativeToken: contracts.base.aaveV3
          .variableDebtWeth as `0x${string}`,
      }

    default:
      throw new Error(`Unsupported chain: ${chain}`)
  }
}

// Function to get the 2-byte hexadecimal representation of the assetId
const _getAssetId = (chain: Chain, token: Token): string => {
  // Select the appropriate token list based on the chain
  let tokens
  switch (chain) {
    case Chain.eth:
      tokens = ethTokens
      break
    case Chain.gno:
      tokens = gnoTokens
      break
    case Chain.arb1:
      tokens = arb1Tokens
      break
    case Chain.oeth:
      tokens = oethTokens
      break
    case Chain.base:
      tokens = baseTokens
      break
    default:
      throw new Error(`Unsupported chain: ${chain}`)
  }

  // Find the index of the token in the list
  const index = tokens.findIndex((t) => t.token === token.token)
  if (index === -1) {
    throw new Error(`Token not found in the ${chain} token list.`)
  }

  // Convert the index to a 2-byte hexadecimal string, padded with leading zeros
  const hexIndex = index.toString(16).padStart(4, "0")
  return `0x${hexIndex}`
}

export const depositToken = (
  chain: Chain,
  token: Token,
  market: string = "Core"
) => {
  const { poolV3 } = _getAllAddresses(chain, market)

  const permissions: Permission[] = [
    ...allowErc20Approve([token.token], [poolV3]),
    {
      ...allow.mainnet.aaveV3.poolCoreV3.supply(
        token.token,
        undefined,
        c.avatar
      ),
      targetAddress: poolV3,
    },
    {
      ...allow.mainnet.aaveV3.poolCoreV3.withdraw(
        token.token,
        undefined,
        c.avatar
      ),
      targetAddress: poolV3,
    },
    {
      ...allow.mainnet.aaveV3.poolCoreV3.setUserUseReserveAsCollateral(
        token.token
      ),
      targetAddress: poolV3,
    },
  ]

  if (chain === Chain.arb1 || chain === Chain.oeth) {
    const assetId = _getAssetId(chain, token)

    permissions.push({
      ...allow.arbitrumOne.aaveV3.poolV3["withdraw(bytes32)"](
        c.bitmask({
          shift: 30,
          mask: "0xffff",
          value: assetId,
        })
      ),
      targetAddress: poolV3,
    })
  }

  if (chain === Chain.eth) {
    permissions.push(
      allow.mainnet.aaveV3.incentivesV3.claimRewards(
        undefined,
        undefined,
        c.avatar
      )
    )
  }

  return permissions
}

export const depositEther = (chain: Chain, market: string = "Core") => {
  const addresses = _getAllAddresses(chain, market)

  if (market === "EtherFi") {
    throw new Error("EtherFi market does not support ETH deposits.")
  }

  const { aNativeToken, wrappedTokenGatewayV3, poolV3, wrappedNativeToken } =
    addresses

  if (!wrappedTokenGatewayV3) {
    throw new Error(
      `wrappedTokenGatewayV3 is not defined for market: ${market}`
    )
  }

  const permissions: Permission[] = [
    ...allowErc20Approve([aNativeToken], [wrappedTokenGatewayV3]),
    {
      ...allow.mainnet.aaveV3.wrappedTokenGatewayCoreV3.depositETH(
        poolV3,
        c.avatar,
        undefined,
        { send: true }
      ),
      targetAddress: wrappedTokenGatewayV3,
    },
    {
      ...allow.mainnet.aaveV3.wrappedTokenGatewayCoreV3.withdrawETH(
        poolV3,
        undefined,
        c.avatar
      ),
      targetAddress: wrappedTokenGatewayV3,
    },
    {
      ...allow.mainnet.aaveV3.poolCoreV3.setUserUseReserveAsCollateral(
        wrappedNativeToken
      ),
      targetAddress: poolV3,
    },
  ]

  if (chain === Chain.eth) {
    permissions.push(
      allow.mainnet.aaveV3.incentivesV3.claimRewards(
        undefined,
        undefined,
        c.avatar
      )
    )
  }

  return permissions
}

export const borrowToken = (
  chain: Chain,
  token: Token,
  market: string = "Core"
) => {
  const { poolV3 } = _getAllAddresses(chain, market)

  return [
    ...allowErc20Approve([token.token], [poolV3]),
    {
      ...allow.mainnet.aaveV3.poolCoreV3.borrow(
        token.token,
        undefined,
        undefined,
        undefined,
        c.avatar
      ),
      targetAddress: poolV3,
    },
    {
      ...allow.mainnet.aaveV3.poolCoreV3.repay(
        token.token,
        undefined,
        undefined,
        c.avatar
      ),
      targetAddress: poolV3,
    },
  ]
}

export const borrowEther = (chain: Chain, market: string = "Core") => {
  if (market === "EtherFi") {
    throw new Error("EtherFi market does not support ETH deposits.")
  }

  const { wrappedTokenGatewayV3, poolV3, variableDebtWrappedNativeToken } =
    _getAllAddresses(chain, market)

  if (!wrappedTokenGatewayV3) {
    throw new Error(
      `wrappedTokenGatewayV3 is not defined for market: ${market}`
    )
  }

  return [
    {
      ...allow.mainnet.aaveV3.variableDebtWeth.approveDelegation(
        wrappedTokenGatewayV3
      ),
      targetAddress: variableDebtWrappedNativeToken,
    },
    {
      ...allow.mainnet.aaveV3.wrappedTokenGatewayCoreV3.borrowETH(poolV3),
      targetAddress: wrappedTokenGatewayV3,
    },
    {
      ...allow.mainnet.aaveV3.wrappedTokenGatewayCoreV3.repayETH(
        poolV3,
        undefined,
        c.avatar,
        { send: true }
      ),
      targetAddress: wrappedTokenGatewayV3,
    },
  ]
}
