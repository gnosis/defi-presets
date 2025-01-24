import { getMainnetSdk } from "@gnosis-guild/eth-sdk-client"
import { NotFoundError } from "../../errors"
import ilks from "./_info"
import { ethProvider } from "../../provider"
import { getProvider } from "../../../test/provider"
import { Chain } from "../../../src"

const sdk = getMainnetSdk(
  process.env.NODE_ENV === "test" ? getProvider(Chain.eth) : ethProvider
)

export const queryProxy = async (avatar: `0x${string}`) => {
  return (await sdk.sky.proxyRegistry.proxies(avatar)) as `0x${string}`
}

export const queryCdps = async (proxy: `0x${string}`, targets?: string[]) => {
  // fetch all cdps
  const cdps: bigint[] = []
  let cdp = await sdk.sky.cdpManager.first(proxy)
  console.log({ first: cdp, proxy })
  while (cdp !== 0n) {
    cdps.push(cdp)
    cdp = (await sdk.sky.cdpManager.list(cdp)).next
  }

  const targetCdps = targets?.map((target) => {
    try {
      return BigInt(target)
    } catch (e) {
      // could not be parsed as BigInt
      throw new NotFoundError(`Cdp not found: ${target}`)
    }
  })
  targetCdps?.forEach((target) => {
    if (!cdps.some((cdp) => cdp === target)) {
      throw new NotFoundError(`Cdp not found: ${target}`)
    }
  })

  return targetCdps || cdps
}

export const queryIlk = async (cdp: bigint) => {
  const ilkId = await sdk.sky.cdpManager.ilks(cdp)
  const ilk = ilks.find((ilk) => ilk.ilk === ilkId)
  if (!ilk) {
    throw new Error(`Unexpected ilk ${ilkId} of cdp ${Number(cdp)}`)
  }
  return ilk
}
