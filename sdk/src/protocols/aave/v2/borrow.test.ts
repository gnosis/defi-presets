import { eth } from "."
import { wallets } from "../../../../test/wallets"
import { applyPermissions, stealErc20 } from "../../../../test/helpers"
import { contracts } from "../../../../eth-sdk/config"
import { Status } from "../../../../test/types"
import { eth as kit } from "../../../../test/kit"
import { parseEther, parseUnits } from "ethers"
import { Chain } from "../../../../src"

describe("aaveV2", () => {
  describe("borrow", () => {
    beforeAll(async () => {
      await applyPermissions(
        Chain.eth,
        await eth.deposit({ targets: ["ETH", "USDC"] })
      )
      await applyPermissions(
        Chain.eth,
        await eth.borrow({ targets: ["ETH", "USDC"] })
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
          contracts.mainnet.aaveV2.poolV2,
          parseUnits("10000", 6)
        )
      ).not.toRevert()
      await expect(
        kit.asMember.aaveV2.poolV2.deposit(
          contracts.mainnet.usdc,
          parseUnits("10000", 6),
          wallets.avatar,
          0
        )
      ).not.toRevert()
    }, 30000) // Added 30 seconds of timeout because the deposit takes too long and the test fails.

    it("borrow ETH and repay", async () => {
      await expect(
        kit.asMember.aaveV2.variableDebtWeth.approveDelegation(
          contracts.mainnet.aaveV2.wrappedTokenGatewayV2,
          parseEther("1")
        )
      ).not.toRevert()

      await expect(
        kit.asMember.aaveV2.wrappedTokenGatewayV2.borrowETH(
          contracts.mainnet.aaveV2.poolV2,
          parseEther("1"),
          2,
          0
        )
      ).not.toRevert()

      await expect(
        kit.asMember.aaveV2.wrappedTokenGatewayV2.repayETH(
          contracts.mainnet.aaveV2.poolV2,
          parseEther("0.5"),
          2,
          wallets.avatar,
          { value: parseEther("0.5") }
        )
      ).not.toRevert()
    }, 30000) // Added 30 seconds of timeout because the borrowETH takes too long and the test fails.

    it("deposit ETH, borrow USDC and repay", async () => {
      await expect(
        kit.asMember.aaveV2.wrappedTokenGatewayV2.depositETH(
          contracts.mainnet.aaveV2.poolV2,
          wallets.avatar,
          0,
          { value: parseEther("1") }
        )
      ).not.toRevert()

      await expect(
        kit.asMember.aaveV2.poolV2.borrow(
          contracts.mainnet.usdc,
          parseUnits("100", 6),
          2,
          0,
          wallets.avatar
        )
      ).not.toRevert()

      await expect(
        kit.asMember.usdc.approve(
          contracts.mainnet.aaveV2.poolV2,
          parseUnits("50", 6)
        )
      ).not.toRevert()

      await expect(
        kit.asMember.aaveV2.poolV2.repay(
          contracts.mainnet.usdc,
          parseUnits("50", 6),
          2,
          wallets.avatar
        )
      ).not.toRevert()
    })

    // Roles Module testing without executing transactions
    // Test with ETH
    it("allows borrowing ETH from avatar", async () => {
      await expect(
        kit.asMember.aaveV2.variableDebtWeth.approveDelegation(
          contracts.mainnet.aaveV2.wrappedTokenGatewayV2,
          parseEther("1")
        )
      ).toBeAllowed()

      await expect(
        kit.asMember.aaveV2.wrappedTokenGatewayV2.borrowETH(
          contracts.mainnet.aaveV2.poolV2,
          parseEther("1"),
          2,
          0
        )
      ).toBeAllowed()
    })

    it("only allows repaying ETH from avatar", async () => {
      await expect(
        kit.asMember.aaveV2.wrappedTokenGatewayV2.repayETH(
          contracts.mainnet.aaveV2.poolV2,
          parseEther("1"),
          2,
          wallets.avatar,
          { value: parseEther("1") }
        )
      ).toBeAllowed()

      await expect(
        kit.asMember.aaveV2.wrappedTokenGatewayV2.repayETH(
          contracts.mainnet.aaveV2.poolV2,
          parseEther("1"),
          2,
          wallets.member,
          { value: parseEther("1") }
        )
      ).toBeForbidden(Status.ParameterNotAllowed)
    })

    it("allows swapping the ETH borrow rate mode", async () => {
      await expect(
        kit.asMember.aaveV2.poolV2.swapBorrowRateMode(contracts.mainnet.weth, 1)
      ).toRevert()
    })

    // Test with USDC
    it("only allows borrowing USDC from avatar", async () => {
      await expect(
        kit.asMember.aaveV2.poolV2.borrow(
          contracts.mainnet.usdc,
          parseUnits("10000", 6),
          2,
          0,
          wallets.avatar
        )
      ).toBeAllowed()

      await expect(
        kit.asMember.aaveV2.poolV2.borrow(
          contracts.mainnet.usdc,
          parseUnits("10000", 6),
          2,
          0,
          wallets.member
        )
      ).toBeForbidden(Status.ParameterNotAllowed)
    })

    it("only allows repaying USDC from avatar", async () => {
      await stealErc20(
        Chain.eth,
        contracts.mainnet.usdc,
        parseUnits("10000", 6),
        contracts.mainnet.balancer.vault
      )

      await expect(
        kit.asMember.usdc.approve(
          contracts.mainnet.aaveV2.poolV2,
          parseUnits("10000", 6)
        )
      ).toBeAllowed()

      await expect(
        kit.asMember.aaveV2.poolV2.repay(
          contracts.mainnet.usdc,
          parseUnits("10000", 6),
          2,
          wallets.avatar
        )
      ).toBeAllowed()

      await expect(
        kit.asMember.aaveV2.poolV2.repay(
          contracts.mainnet.usdc,
          parseUnits("10000", 6),
          2,
          wallets.member
        )
      ).toBeForbidden(Status.ParameterNotAllowed)
    })

    it("allows swapping the USDC borrow rate mode", async () => {
      await expect(
        kit.asMember.aaveV2.poolV2.swapBorrowRateMode(contracts.mainnet.usdc, 1)
      ).toRevert()
    })
  })
})
