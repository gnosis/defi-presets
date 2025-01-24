import { getMainnetSdk } from "@gnosis-guild/eth-sdk-client"
import { ethProvider } from "../../provider"
import { getProvider } from "../../../test/provider"
import { keccak256, solidityPacked } from "ethers"
import { Chain } from "../../../src"

const sdk = getMainnetSdk(
  process.env.NODE_ENV === "test" ? getProvider(Chain.eth) : ethProvider
)

export const queryDepositPool = async () => {
  const depositPoolKey = keccak256(
    solidityPacked(
      ["string", "string"],
      ["contract.address", "rocketDepositPool"]
    )
  )

  // TODO: we need this as any cast because typechain does not yet correctly generate the types for conflicting function names
  // (getAddress is a BaseContract member, so the full TypeChain would have to create the function member type under the full signature key)
  return (await (sdk.rocketPool.storage as any)["getAddress(bytes32)"](
    depositPoolKey
  )) as `0x${string}`
}
