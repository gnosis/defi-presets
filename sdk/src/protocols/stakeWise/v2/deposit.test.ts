import { eth } from "."
import { applyPermissions } from "../../../../test/helpers"
import { contracts } from "../../../../eth-sdk/config"
import { mintNFT } from "../../uniswap/v3/testUtils"
import { Chain } from "../../../../src"

const stealAddress = "0x56556075Ab3e2Bb83984E90C52850AFd38F20883"
const eAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"

describe("stakeWiseV2", () => {
  describe("deposit", () => {
    beforeAll(async () => {
      await applyPermissions(
        Chain.eth,
        await eth.deposit({ targets: ["ETH-sETH2 0.3%"] })
      )
    })

    // TODO: fix this test
    it.skip("mint new position with permitted stakeWise pool features", async () => {
      await expect(
        mintNFT(
          eAddress,
          contracts.mainnet.stakeWiseV2.sEth2,
          3000,
          1000000000000000000000n,
          0n,
          true,
          stealAddress
        )
      ).not.toRevert()
      await expect(
        mintNFT(
          eAddress,
          contracts.mainnet.usdt, // invalid token
          3000,
          1000000000000000000000n,
          0n,
          true
        )
      ).toBeForbidden()
      await expect(
        mintNFT(
          eAddress,
          contracts.mainnet.stakeWiseV2.sEth2,
          500, // invalid fee
          1000000000000000000000n,
          0n,
          true,
          stealAddress
        )
      ).toBeForbidden()
    }, 30000)
  })
})
