import { eth } from "."
import { wallets } from "../../../../test/wallets"
import { applyPermissions, stealErc20 } from "../../../../test/helpers"
import { contracts } from "../../../../eth-sdk/config"
import { Status } from "../../../../test/types"
import { eth as kit } from "../../../../test/kit"
import { parseEther, parseUnits } from "ethers"
import { Chain } from "../../../../src"

describe("aaveV2", () => {
  describe("deposit", () => {
    beforeAll(async () => {
      await applyPermissions(
        Chain.eth,
        await eth.deposit({ targets: ["ETH", "USDC"] })
      )
    })

    // Test with ETH
    it("only allows depositing ETH on behalf of avatar", async () => {
      await expect(
        kit.asMember.aaveV2.wrappedTokenGatewayV2.depositETH(
          contracts.mainnet.aaveV2.poolV2,
          wallets.avatar,
          0,
          { value: parseEther("1") }
        )
      ).not.toRevert()

      await expect(
        kit.asMember.aaveV2.wrappedTokenGatewayV2.depositETH(
          contracts.mainnet.aaveV2.poolV2,
          wallets.member,
          0,
          { value: parseEther("1") }
        )
      ).toBeForbidden(Status.ParameterNotAllowed)
    }, 30000) // Added 30 seconds of timeout because the deposit takes too long and the test fails.

    it("only allows withdrawing ETH from avatars' position", async () => {
      await expect(
        kit.asMember.aaveV2.aWeth.approve(
          contracts.mainnet.aaveV2.wrappedTokenGatewayV2,
          parseEther("1")
        )
      ).not.toRevert()

      await expect(
        kit.asMember.aaveV2.wrappedTokenGatewayV2.withdrawETH(
          contracts.mainnet.aaveV2.poolV2,
          parseEther("1"),
          wallets.avatar
        )
      ).not.toRevert()

      await expect(
        kit.asMember.aaveV2.wrappedTokenGatewayV2.withdrawETH(
          contracts.mainnet.aaveV2.poolV2,
          parseEther("1"),
          wallets.member
        )
      ).toBeForbidden(Status.ParameterNotAllowed)
    })

    it("allow setting the deposited ETH as collateral", async () => {
      let reserveConfig: Array<any> =
        await kit.asAvatar.aaveV2.protocolDataProviderV2.getReserveConfigurationData(
          contracts.mainnet.weth
        )
      const collateralizable: boolean = reserveConfig[5]
      console.log("is collateralizable: ", collateralizable)
      if (collateralizable) {
        await expect(
          kit.asMember.aaveV2.poolV2.setUserUseReserveAsCollateral(
            contracts.mainnet.weth,
            true
          )
        ).not.toRevert()
      } else {
        await expect(
          kit.asMember.aaveV2.poolV2.setUserUseReserveAsCollateral(
            contracts.mainnet.weth,
            true
          )
        ).toRevert()
      }
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
          contracts.mainnet.aaveV2.poolV2,
          parseUnits("1000", 6)
        )
      ).not.toRevert()

      await expect(
        kit.asMember.aaveV2.poolV2.deposit(
          contracts.mainnet.usdc,
          parseUnits("1000", 6),
          wallets.avatar,
          0
        )
      ).not.toRevert()

      await expect(
        kit.asMember.aaveV2.poolV2.deposit(
          contracts.mainnet.usdc,
          parseUnits("1000", 6),
          wallets.member,
          0
        )
      ).toBeForbidden(Status.ParameterNotAllowed)
    })

    it("only allows withdrawing USDC from avatars' position", async () => {
      await expect(
        kit.asMember.aaveV2.poolV2.withdraw(
          contracts.mainnet.usdc,
          parseUnits("1000", 6),
          wallets.avatar
        )
      ).not.toRevert()

      await expect(
        kit.asMember.aaveV2.poolV2.withdraw(
          contracts.mainnet.usdc,
          parseUnits("1000", 6),
          wallets.member
        )
      ).toBeForbidden(Status.ParameterNotAllowed)
    })

    it("allow setting the deposited USDC as collateral", async () => {
      let reserveConfig: Array<any> =
        await kit.asAvatar.aaveV2.protocolDataProviderV2.getReserveConfigurationData(
          contracts.mainnet.usdc
        )
      const collateralizable: boolean = reserveConfig[5]
      console.log("is collateralizable: ", collateralizable)
      if (collateralizable) {
        await expect(
          kit.asMember.aaveV2.poolV2.setUserUseReserveAsCollateral(
            contracts.mainnet.usdc,
            true
          )
        ).not.toRevert()
      } else {
        await expect(
          kit.asMember.aaveV2.poolV2.setUserUseReserveAsCollateral(
            contracts.mainnet.usdc,
            true
          )
        ).toRevert()
      }
    })
  })
})
