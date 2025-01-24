import { eth } from "."
import { wallets } from "../../../../test/wallets"
import { applyPermissions, stealErc20 } from "../../../../test/helpers"
import { contracts } from "../../../../eth-sdk/config"
import { eth as kit } from "../../../../test/kit"
import { parseEther, parseUnits } from "ethers"
import { Chain } from "../../../../src"

describe("compoundV2", () => {
  describe("deposit", () => {
    beforeAll(async () => {
      await applyPermissions(
        Chain.eth,
        await eth.deposit({ targets: ["ETH", "USDC"] })
      )
    })

    // Test with ETH
    it("allows depositing ETH on behalf of avatar", async () => {
      await expect(
        kit.asMember.compoundV2.cEth.mint({ value: parseEther("1") })
      ).not.toRevert()

      // await expect(
      //   kit.asMember.compoundV2.cEth.mint(
      //     {
      //       value: parseEther("1"),
      //       from: wallets.member
      //     },
      //   )
      // ).toBeForbidden()
    })

    it("allows withdrawing ETH from avatars' position", async () => {
      await expect(
        kit.asMember.compoundV2.cEth.redeemUnderlying(parseEther("0.5"))
      ).not.toRevert()

      // await expect(
      //   kit.asMember.compoundV2.cEth.redeemUnderlying(
      //     parseEther("1"),
      //     {
      //       from: wallets.member
      //     }
      //   )
      // ).toBeForbidden(Status.ParameterNotAllowed)
    })

    it("allow setting/removing the deposited ETH as collateral", async () => {
      await expect(
        kit.asMember.compoundV2.comptroller.enterMarkets([
          contracts.mainnet.compoundV2.cEth,
        ])
      ).not.toRevert()
      await expect(
        kit.asMember.compoundV2.comptroller.exitMarket(
          contracts.mainnet.compoundV2.cEth
        )
      ).not.toRevert()
    })

    // Test with USDC
    it("only allows depositing USDC on behalf of avatar", async () => {
      await stealErc20(
        Chain.eth,
        contracts.mainnet.usdc,
        parseUnits("1000", 6),
        contracts.mainnet.balancer.vault
      )
      await expect(
        kit.asMember.usdc.approve(
          // The cToken in the config file corresponds to cUSDC
          contracts.mainnet.compoundV2.cToken,
          parseUnits("1000", 6)
        )
      ).not.toRevert()

      await expect(
        // The cToken in the config file corresponds to cUSDC
        kit.asMember.compoundV2.cToken.mint(parseUnits("1000", 6))
      ).not.toRevert()
    })

    it("allows withdrawing USDC from avatars' position", async () => {
      await expect(
        kit.asMember.compoundV2.cToken.redeemUnderlying(parseUnits("1000", 6))
      ).not.toRevert()
    })

    it("allow setting/removing the deposited USDC as collateral", async () => {
      await expect(
        kit.asMember.compoundV2.comptroller.enterMarkets([
          contracts.mainnet.compoundV2.cToken,
        ])
      ).not.toRevert()
      await expect(
        kit.asMember.compoundV2.comptroller.exitMarket(
          contracts.mainnet.compoundV2.cToken
        )
      ).not.toRevert()
    })

    it("only allow claiming COMP on behalf of avatar", async () => {
      await expect(
        kit.asMember.compoundV2.comptroller["claimComp(address,address[])"](
          wallets.avatar,
          [
            contracts.mainnet.compoundV2.cEth,
            // The cToken in the config file corresponds to cUSDC
            contracts.mainnet.compoundV2.cToken,
          ]
        )
      ).not.toRevert()
      await expect(
        kit.asMember.compoundV2.comptroller["claimComp(address,address[])"](
          wallets.member,
          [
            contracts.mainnet.compoundV2.cEth,
            contracts.mainnet.compoundV2.cToken,
          ]
        )
      ).toBeForbidden()
    })
  })
})
