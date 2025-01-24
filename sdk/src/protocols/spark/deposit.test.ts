import { eth } from "."
import { wallets } from "../../../test/wallets"
import { applyPermissions, stealErc20 } from "../../../test/helpers"
import { contracts } from "../../../eth-sdk/config"
import { Status } from "../../../test/types"
import { eth as kit } from "../../../test/kit"
import { formatUnits, parseEther, parseUnits } from "ethers"
import { Chain } from "../../../src"

const maxAmount =
  115792089237316195423570985008687907853269984665640564039457584007913129639935n

describe("spark", () => {
  describe("deposit", () => {
    beforeAll(async () => {
      await applyPermissions(
        Chain.eth,
        await eth.deposit({ targets: ["DSR_sDAI", "ETH", "USDC", "WETH"] })
      )
    })

    // Test with ETH
    it("only allows depositing ETH on behalf of avatar", async () => {
      await expect(
        kit.asMember.spark.wrappedTokenGatewayV3.depositETH(
          contracts.mainnet.spark.poolV3,
          wallets.avatar,
          0,
          { value: parseEther("1") }
        )
      ).not.toRevert()

      await expect(
        kit.asMember.spark.wrappedTokenGatewayV3.depositETH(
          contracts.mainnet.spark.poolV3,
          wallets.member,
          0,
          { value: parseEther("1") }
        )
      ).toBeForbidden(Status.ParameterNotAllowed)
    })

    it("only allows withdrawing ETH from avatars' position", async () => {
      await expect(
        kit.asMember.spark.spWeth.approve(
          contracts.mainnet.spark.wrappedTokenGatewayV3,
          parseEther("1")
        )
      ).not.toRevert()

      await expect(
        kit.asMember.spark.wrappedTokenGatewayV3.withdrawETH(
          contracts.mainnet.spark.poolV3,
          parseEther("1"),
          wallets.avatar
        )
      ).not.toRevert()

      await expect(
        kit.asMember.spark.wrappedTokenGatewayV3.withdrawETH(
          contracts.mainnet.spark.poolV3,
          parseEther("1"),
          wallets.member
        )
      ).toBeForbidden(Status.ParameterNotAllowed)
    })

    it("allow setting the deposited ETH as collateral", async () => {
      let reserveConfig: Array<any> =
        await kit.asAvatar.spark.protocolDataProviderV3.getReserveConfigurationData(
          contracts.mainnet.weth
        )
      const collateralizable: boolean = reserveConfig[5]
      if (collateralizable) {
        await expect(
          kit.asMember.spark.poolV3.setUserUseReserveAsCollateral(
            contracts.mainnet.weth,
            true
          )
        ).not.toRevert()
      } else {
        await expect(
          kit.asMember.spark.poolV3.setUserUseReserveAsCollateral(
            contracts.mainnet.weth,
            true
          )
        ).toRevert()
      }
    })

    // Test with WETH
    it("only allows depositing WETH on behalf of avatar", async () => {
      await stealErc20(
        Chain.eth,
        contracts.mainnet.weth,
        parseEther("1"),
        contracts.mainnet.balancer.vault
      )
      await expect(
        kit.asMember.weth.approve(
          contracts.mainnet.spark.poolV3,
          parseEther("1")
        )
      ).not.toRevert()

      await expect(
        kit.asMember.spark.poolV3.supply(
          contracts.mainnet.weth,
          parseEther("1"),
          wallets.avatar,
          0
        )
      ).not.toRevert()

      await expect(
        kit.asMember.spark.poolV3.supply(
          contracts.mainnet.weth,
          parseEther("1"),
          wallets.member,
          0
        )
      ).toBeForbidden(Status.ParameterNotAllowed)
    })

    it("only allows withdrawing WETH from avatars' position", async () => {
      await expect(
        kit.asMember.spark.poolV3.withdraw(
          contracts.mainnet.weth,
          parseEther("1"),
          wallets.avatar
        )
      ).not.toRevert()

      await expect(
        kit.asMember.spark.poolV3.withdraw(
          contracts.mainnet.weth,
          parseEther("1"),
          wallets.member
        )
      ).toBeForbidden(Status.ParameterNotAllowed)
    })

    // Claim rewards to avatar
    it("only claim rewards to avatar", async () => {
      await expect(
        kit.asMember.spark.rewardsController.claimRewards(
          [contracts.mainnet.spark.spWeth],
          maxAmount,
          wallets.avatar,
          contracts.mainnet.lido.wstEth
        )
      ).not.toRevert()

      await expect(
        kit.asMember.spark.rewardsController.claimRewards(
          [contracts.mainnet.spark.spWeth],
          maxAmount,
          wallets.member,
          contracts.mainnet.lido.wstEth
        )
      ).toBeForbidden(Status.ParameterNotAllowed)
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
          contracts.mainnet.spark.poolV3,
          parseUnits("1000", 6)
        )
      ).not.toRevert()

      await expect(
        kit.asMember.spark.poolV3.supply(
          contracts.mainnet.usdc,
          parseUnits("1000", 6),
          wallets.avatar,
          0
        )
      ).not.toRevert()

      await expect(
        kit.asMember.spark.poolV3.supply(
          contracts.mainnet.usdc,
          parseUnits("1000", 6),
          wallets.member,
          0
        )
      ).toBeForbidden(Status.ParameterNotAllowed)
    })

    it("only allows withdrawing USDC from avatars' position", async () => {
      await expect(
        kit.asMember.spark.poolV3.withdraw(
          contracts.mainnet.usdc,
          parseUnits("1000", 6),
          wallets.avatar
        )
      ).not.toRevert()

      await expect(
        kit.asMember.spark.poolV3.withdraw(
          contracts.mainnet.usdc,
          parseUnits("1000", 6),
          wallets.member
        )
      ).toBeForbidden(Status.ParameterNotAllowed)
    })

    it("allow setting the deposited USDC as collateral", async () => {
      let reserveConfig: Array<any> =
        await kit.asAvatar.spark.protocolDataProviderV3.getReserveConfigurationData(
          contracts.mainnet.usdc
        )
      const collateralizable: boolean = reserveConfig[5]
      if (collateralizable) {
        await expect(
          kit.asMember.spark.poolV3.setUserUseReserveAsCollateral(
            contracts.mainnet.usdc,
            true
          )
        ).not.toRevert()
      } else {
        await expect(
          kit.asMember.spark.poolV3.setUserUseReserveAsCollateral(
            contracts.mainnet.usdc,
            true
          )
        ).toRevert()
      }
    })

    it("only allow sDAI deposit and redeem from avatar", async () => {
      await stealErc20(
        Chain.eth,
        contracts.mainnet.dai,
        parseEther("1000"),
        contracts.mainnet.balancer.vault
      )
      await expect(
        kit.asMember.dai.approve(
          contracts.mainnet.spark.sDai,
          parseEther("1000")
        )
      ).not.toRevert()
      await expect(
        kit.asMember.spark.sDai.deposit(parseEther("1000"), wallets.avatar)
      ).not.toRevert()
      const sDaiBalanceBn = await kit.asAvatar.spark.sDai.balanceOf(
        wallets.avatar
      )
      const sDaiBalance = formatUnits(sDaiBalanceBn, 18).toString()
      await expect(
        kit.asMember.spark.sDai.redeem(
          parseEther(sDaiBalance),
          wallets.avatar,
          wallets.avatar
        )
      ).not.toRevert()

      await expect(
        kit.asMember.spark.sDai.deposit(parseEther("1000"), wallets.member)
      ).toBeForbidden(Status.ParameterNotAllowed)
      await expect(
        kit.asMember.spark.sDai.redeem(
          parseEther("1000"),
          wallets.member,
          wallets.member
        )
      ).toBeForbidden(Status.ParameterNotAllowed)
    })
  })
})
