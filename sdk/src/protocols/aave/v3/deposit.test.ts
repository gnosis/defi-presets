import { eth } from "."
import { wallets } from "../../../../test/wallets"
import { applyPermissions, stealErc20 } from "../../../../test/helpers"
import { contracts } from "../../../../eth-sdk/config"
import { Status } from "../../../../test/types"
import { eth as kit } from "../../../../test/kit"
import { parseEther, parseUnits } from "ethers"
import { Chain } from "../../../../src"

describe("aaveV3", () => {
  describe("deposit", () => {
    beforeAll(async () => {
      await applyPermissions(
        Chain.eth,
        await eth.deposit({ market: "Core", targets: ["ETH", "USDC", "WETH"] })
      )
    })

    // Test with ETH
    it("only allows depositing ETH on behalf of avatar", async () => {
      await expect(
        kit.asMember.aaveV3.wrappedTokenGatewayCoreV3.depositETH(
          contracts.mainnet.aaveV3.poolCoreV3,
          wallets.avatar,
          0,
          { value: parseEther("1") }
        )
      ).not.toRevert()

      await expect(
        kit.asMember.aaveV3.wrappedTokenGatewayCoreV3.depositETH(
          contracts.mainnet.aaveV3.poolCoreV3,
          wallets.member,
          0,
          { value: parseEther("1") }
        )
      ).toBeForbidden(Status.ParameterNotAllowed)
    })

    it("only allows withdrawing ETH from avatars' position", async () => {
      await expect(
        kit.asMember.aaveV3.aEthWeth.approve(
          contracts.mainnet.aaveV3.wrappedTokenGatewayCoreV3,
          parseEther("1")
        )
      ).not.toRevert()

      await expect(
        kit.asMember.aaveV3.wrappedTokenGatewayCoreV3.withdrawETH(
          contracts.mainnet.aaveV3.poolCoreV3,
          parseEther("1"),
          wallets.avatar
        )
      ).not.toRevert()

      await expect(
        kit.asMember.aaveV3.wrappedTokenGatewayCoreV3.withdrawETH(
          contracts.mainnet.aaveV3.poolCoreV3,
          parseEther("1"),
          wallets.member
        )
      ).toBeForbidden(Status.ParameterNotAllowed)
    })

    it("allow setting the deposited ETH as collateral", async () => {
      let reserveConfig: Array<any> =
        await kit.asAvatar.aaveV3.protocolDataProviderCoreV3.getReserveConfigurationData(
          contracts.mainnet.weth
        )
      const collateralizable: boolean = reserveConfig[5]
      console.log("is collateralizable: ", collateralizable)
      if (collateralizable) {
        await expect(
          kit.asMember.aaveV3.poolCoreV3.setUserUseReserveAsCollateral(
            contracts.mainnet.weth,
            true
          )
        ).not.toRevert()
      } else {
        await expect(
          kit.asMember.aaveV3.poolCoreV3.setUserUseReserveAsCollateral(
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
          contracts.mainnet.aaveV3.poolCoreV3,
          parseEther("1")
        )
      ).not.toRevert()

      await expect(
        kit.asMember.aaveV3.poolCoreV3.supply(
          contracts.mainnet.weth,
          parseEther("1"),
          wallets.avatar,
          0
        )
      ).not.toRevert()

      await expect(
        kit.asMember.aaveV3.poolCoreV3.supply(
          contracts.mainnet.weth,
          parseEther("1"),
          wallets.member,
          0
        )
      ).toBeForbidden(Status.ParameterNotAllowed)
    })

    it("only allows withdrawing WETH from avatars' position", async () => {
      await expect(
        kit.asMember.aaveV3.poolCoreV3.withdraw(
          contracts.mainnet.weth,
          parseEther("1"),
          wallets.avatar
        )
      ).not.toRevert()

      await expect(
        kit.asMember.aaveV3.poolCoreV3.withdraw(
          contracts.mainnet.weth,
          parseEther("1"),
          wallets.member
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
          contracts.mainnet.aaveV3.poolCoreV3,
          parseUnits("1000", 6)
        )
      ).not.toRevert()

      await expect(
        kit.asMember.aaveV3.poolCoreV3.supply(
          contracts.mainnet.usdc,
          parseUnits("1000", 6),
          wallets.avatar,
          0
        )
      ).not.toRevert()

      await expect(
        kit.asMember.aaveV3.poolCoreV3.supply(
          contracts.mainnet.usdc,
          parseUnits("1000", 6),
          wallets.member,
          0
        )
      ).toBeForbidden(Status.ParameterNotAllowed)
    })

    it("only allows withdrawing USDC from avatars' position", async () => {
      await expect(
        kit.asMember.aaveV3.poolCoreV3.withdraw(
          contracts.mainnet.usdc,
          parseUnits("1000", 6),
          wallets.avatar
        )
      ).not.toRevert()

      await expect(
        kit.asMember.aaveV3.poolCoreV3.withdraw(
          contracts.mainnet.usdc,
          parseUnits("1000", 6),
          wallets.member
        )
      ).toBeForbidden(Status.ParameterNotAllowed)
    })

    it("allow setting the deposited USDC as collateral", async () => {
      let reserveConfig: Array<any> =
        await kit.asAvatar.aaveV3.protocolDataProviderCoreV3.getReserveConfigurationData(
          contracts.mainnet.usdc
        )
      const collateralizable: boolean = reserveConfig[5]
      console.log("is collateralizable: ", collateralizable)
      if (collateralizable) {
        await expect(
          kit.asMember.aaveV3.poolCoreV3.setUserUseReserveAsCollateral(
            contracts.mainnet.usdc,
            true
          )
        ).not.toRevert()
      } else {
        await expect(
          kit.asMember.aaveV3.poolCoreV3.setUserUseReserveAsCollateral(
            contracts.mainnet.usdc,
            true
          )
        ).toRevert()
      }
    })
  })
})
