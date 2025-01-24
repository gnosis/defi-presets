import { getProvider } from "./provider"
import { Chain } from "../src"

export const createSigner = async (chain: Chain, address: string) => {
  const provider = getProvider(chain)
  return await provider.getSigner(address)
}

export const createWallets = async (chain: Chain) => {
  await Promise.all(
    Object.values(wallets).map(async (address) => {
      const provider = getProvider(chain)
      await provider.send("anvil_impersonateAccount", [address])
      await provider.send("anvil_setBalance", [
        address,
        "0x21E19E0C9BAB2400000",
      ])
    })
  )
}

export const wallets = {
  deployer: "0xdef1dddddddddddddddddddddddddddddddddddd",
  avatar: "0xdef1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  owner: "0xdef1010101010101010101010101010101010101",
  member: "0xdef1123412341234123412341234123412341234",
  other: "0xdef10f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f",
}
