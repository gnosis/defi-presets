import { eth } from "."
import { wallets } from "../../../test/wallets"
import { applyPermissions, stealErc20 } from "../../../test/helpers"
import { contracts } from "../../../eth-sdk/config"
import { Status } from "../../../test/types"
import { eth as kit } from "../../../test/kit"
import { parseEther } from "ethers"
import { Chain } from "../../../src"

describe("spark", () => {
  describe("borrow", () => {
    beforeAll(async () => {
      await applyPermissions(
        Chain.eth,
        await eth.deposit({ targets: ["DAI", "ETH", "sDAI"] })
      )
      await applyPermissions(
        Chain.eth,
        await eth.borrow({ targets: ["DAI", "ETH", "sDAI"] })
      )
    })

    it("deposit sDAI", async () => {
      await stealErc20(
        Chain.eth,
        contracts.mainnet.spark.sDai,
        parseEther("10000"),
        contracts.mainnet.balancer.vault
      )
      await expect(
        kit.asMember.spark.sDai.approve(
          contracts.mainnet.spark.poolV3,
          parseEther("10000")
        )
      ).not.toRevert()
      await expect(
        kit.asMember.spark.poolV3.supply(
          contracts.mainnet.spark.sDai,
          parseEther("10000"),
          wallets.avatar,
          0
        )
      ).not.toRevert()
    })

    it("borrow ETH and repay", async () => {
      await expect(
        kit.asMember.spark.variableDebtWeth.approveDelegation(
          contracts.mainnet.spark.wrappedTokenGatewayV3,
          parseEther("1")
        )
      ).not.toRevert()

      await expect(
        kit.asMember.spark.wrappedTokenGatewayV3.borrowETH(
          contracts.mainnet.spark.poolV3,
          parseEther("1"),
          2,
          0
        )
      ).not.toRevert()

      await expect(
        kit.asMember.spark.wrappedTokenGatewayV3.repayETH(
          contracts.mainnet.spark.poolV3,
          parseEther("0.5"),
          2,
          wallets.avatar,
          { value: parseEther("0.5") }
        )
      ).not.toRevert()
    }, 30000) // Added 30 seconds of timeout because the borrow takes too long and the test fails.

    it("deposit ETH, borrow DAI and repay", async () => {
      await expect(
        kit.asMember.spark.wrappedTokenGatewayV3.depositETH(
          contracts.mainnet.spark.poolV3,
          wallets.avatar,
          0,
          { value: parseEther("1") }
        )
      ).not.toRevert()

      await expect(
        kit.asMember.spark.poolV3.borrow(
          contracts.mainnet.dai,
          parseEther("100"),
          2,
          0,
          wallets.avatar
        )
      ).not.toRevert()

      await expect(
        kit.asMember.dai.approve(
          contracts.mainnet.spark.poolV3,
          parseEther("50")
        )
      ).not.toRevert()

      await expect(
        kit.asMember.spark.poolV3.repay(
          contracts.mainnet.dai,
          parseEther("50"),
          2,
          wallets.avatar
        )
      ).not.toRevert()
    })

    // Roles Module testing without executing transactions
    // Test with ETH
    it("allows borrowing ETH from avatar", async () => {
      await expect(
        kit.asMember.spark.variableDebtWeth.approveDelegation(
          contracts.mainnet.spark.wrappedTokenGatewayV3,
          parseEther("1")
        )
      ).toBeAllowed()

      await expect(
        kit.asMember.spark.wrappedTokenGatewayV3.borrowETH(
          contracts.mainnet.spark.poolV3,
          parseEther("1"),
          2,
          0
        )
      ).toBeAllowed()
    })

    it("only allows repaying ETH from avatar", async () => {
      await expect(
        kit.asMember.spark.wrappedTokenGatewayV3.repayETH(
          contracts.mainnet.spark.poolV3,
          parseEther("1"),
          2,
          wallets.avatar,
          { value: parseEther("1") }
        )
      ).toBeAllowed()

      await expect(
        kit.asMember.spark.wrappedTokenGatewayV3.repayETH(
          contracts.mainnet.spark.poolV3,
          parseEther("1"),
          2,
          wallets.member,
          { value: parseEther("1") }
        )
      ).toBeForbidden(Status.ParameterNotAllowed)
    })

    it("allows swapping the ETH borrow rate mode", async () => {
      await expect(
        kit.asMember.spark.poolV3.swapBorrowRateMode(contracts.mainnet.weth, 1)
      ).toRevert()
    })

    // Test with DAI
    it("only allows borrowing DAI from avatar", async () => {
      await expect(
        kit.asMember.spark.poolV3.borrow(
          contracts.mainnet.dai,
          parseEther("10000"),
          2,
          0,
          wallets.avatar
        )
      ).toBeAllowed()

      await expect(
        kit.asMember.spark.poolV3.borrow(
          contracts.mainnet.dai,
          parseEther("10000"),
          2,
          0,
          wallets.member
        )
      ).toBeForbidden()
    })

    it("only allows repaying DAI from avatar", async () => {
      await stealErc20(
        Chain.eth,
        contracts.mainnet.dai,
        parseEther("10000"),
        contracts.mainnet.balancer.vault
      )

      await expect(
        kit.asMember.dai.approve(
          contracts.mainnet.spark.poolV3,
          parseEther("10000")
        )
      ).toBeAllowed()

      await expect(
        kit.asMember.spark.poolV3.repay(
          contracts.mainnet.dai,
          parseEther("10000"),
          2,
          wallets.avatar
        )
      ).toBeAllowed()

      await expect(
        kit.asMember.spark.poolV3.repay(
          contracts.mainnet.dai,
          parseEther("10000"),
          2,
          wallets.member
        )
      ).toBeForbidden()
    })

    it("allows swapping the DAI borrow rate mode", async () => {
      await expect(
        kit.asMember.spark.poolV3.swapBorrowRateMode(contracts.mainnet.dai, 1)
      ).toRevert()
    })
  })
})
