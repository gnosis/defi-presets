import { eth } from "."
import { wallets } from "../../../../test/wallets"
import { applyPermissions, stealErc20 } from "../../../../test/helpers"
import { contracts } from "../../../../eth-sdk/config"
import { eth as kit } from "../../../../test/kit"
import { parseEther, parseUnits } from "ethers"
import { Chain } from "../../../../src"

describe("compoundV2", () => {
  describe("borrow", () => {
    beforeAll(async () => {
      await applyPermissions(
        Chain.eth,
        await eth.deposit({ targets: ["ETH", "USDC"] })
      )
      await applyPermissions(
        Chain.eth,
        await eth.borrow({ tokens: ["ETH", "USDC"] })
      )
    })

    it("deposit USDC", async () => {
      await stealErc20(
        Chain.eth,
        contracts.mainnet.usdc,
        parseUnits("10000", 6),
        contracts.mainnet.balancer.vault
      )
      await expect(
        kit.asMember.usdc.approve(
          // The cToken in the config file corresponds to cUSDC
          contracts.mainnet.compoundV2.cToken,
          parseUnits("10000", 6)
        )
      ).not.toRevert()

      await expect(
        // The cToken in the config file corresponds to cUSDC
        kit.asMember.compoundV2.cToken.mint(parseUnits("10000", 6))
      ).not.toRevert()
    })

    it("borrow ETH and only repay from avatar", async () => {
      await expect(
        kit.asMember.compoundV2.cEth.borrow(parseEther("1"))
      ).not.toRevert()

      await expect(
        kit.asMember.compoundV2.maximillion.repayBehalf(wallets.avatar, {
          value: parseEther("0.5"),
        })
      ).not.toRevert()

      await expect(
        kit.asMember.compoundV2.maximillion.repayBehalf(wallets.member, {
          value: parseEther("0.5"),
        })
      ).toBeForbidden()
    })

    it("deposit ETH, borrow USDC and repay", async () => {
      await expect(
        kit.asMember.compoundV2.cEth.mint({ value: parseEther("1") })
      ).not.toRevert()

      await expect(
        // The cToken in the config file corresponds to cUSDC
        kit.asMember.compoundV2.cToken.borrow(parseUnits("100", 6))
      ).not.toRevert()

      await expect(
        kit.asMember.usdc.approve(
          // The cToken in the config file corresponds to cUSDC
          contracts.mainnet.compoundV2.cToken,
          parseUnits("50", 6)
        )
      ).not.toRevert()

      await expect(
        // The cToken in the config file corresponds to cUSDC
        kit.asMember.compoundV2.cToken.repayBorrow(parseUnits("50", 6))
      ).not.toRevert()
    })
  })
})
