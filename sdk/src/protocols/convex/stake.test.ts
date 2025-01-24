import { eth } from "."
import { crv, cvx, zeroAddress } from "./actions"
import { wallets } from "../../../test/wallets"
import { applyPermissions, stealErc20 } from "../../../test/helpers"
import { contracts } from "../../../eth-sdk/config"
import { Status } from "../../../test/types"
import { eth as kit } from "../../../test/kit"
import { parseEther } from "ethers"
import { Chain } from "../../../src"

const cvxCrv = "0x62B9c7356A2Dc64a1969e19C23e4f579F9810Aa7"

describe("convex", () => {
  describe("stake", () => {
    beforeAll(async () => {
      await applyPermissions(
        Chain.eth,
        await eth.stake({ targets: ["CVX", "cvxCRV"] })
      )
    })
    it("convert CRV to cvxCRV", async () => {
      await stealErc20(
        Chain.eth,
        crv,
        parseEther("2"),
        contracts.mainnet.balancer.vault
      )
      await expect(
        kit.asMember.usdc
          .attach(crv)
          .approve(contracts.mainnet.convex.crvDepositor, parseEther("2"))
      ).not.toRevert()

      // Converts CRV to cvxCRV
      await expect(
        kit.asMember.convex.crvDepositor["deposit(uint256,bool)"](
          parseEther("1"),
          false
        )
      ).not.toRevert()

      await expect(
        kit.asMember.convex.crvDepositor["deposit(uint256,bool,address)"](
          parseEther("1"),
          false,
          zeroAddress
        )
      ).not.toRevert()
    })

    it("stake and withdraw cvxCRV / set rewards weight and claim", async () => {
      await expect(
        kit.asMember.usdc
          .attach(cvxCrv)
          .approve(contracts.mainnet.convex.stkCvxCrv, parseEther("1"))
      ).not.toRevert()
      // Using cvxCRV
      await expect(
        kit.asMember.convex.stkCvxCrv.stake(parseEther("1"), wallets.avatar)
      ).not.toRevert()

      await stealErc20(
        Chain.eth,
        crv,
        parseEther("1"),
        contracts.mainnet.balancer.vault
      )
      await expect(
        kit.asMember.usdc
          .attach(crv)
          .approve(contracts.mainnet.convex.crvDepositor, parseEther("1"))
      ).not.toRevert()
      // Using CRV
      await expect(
        kit.asMember.convex.crvDepositor["deposit(uint256,bool,address)"](
          parseEther("1"),
          true,
          contracts.mainnet.convex.stkCvxCrv
        )
      ).not.toRevert()

      // Rewards
      await expect(
        kit.asMember.convex.stkCvxCrv.setRewardWeight(5000)
      ).not.toRevert()
      await expect(
        kit.asMember.convex.stkCvxCrv["getReward(address)"](wallets.avatar)
      ).not.toRevert()
      await expect(
        kit.asMember.convex.stkCvxCrv["getReward(address)"](wallets.member)
      ).toBeForbidden(Status.ParameterNotAllowed)

      // Withdraw
      await expect(
        kit.asMember.convex.stkCvxCrv.withdraw(parseEther("1"))
      ).not.toRevert()
    }, 60000) // Added 60 seconds of timeout because the deposit takes too long and the test fails.

    it("stake and withdraw CVX / claim rewards", async () => {
      await stealErc20(
        Chain.eth,
        cvx,
        parseEther("1"),
        contracts.mainnet.balancer.vault
      )
      await expect(
        kit.asMember.usdc
          .attach(cvx)
          .approve(contracts.mainnet.convex.cvxRewardPool, parseEther("1"))
      ).not.toRevert()

      await expect(
        kit.asMember.convex.cvxRewardPool.stake(parseEther("1"))
      ).not.toRevert()

      await expect(
        kit.asMember.convex.cvxRewardPool["getReward(bool)"](false)
      ).not.toRevert()

      await expect(
        kit.asMember.convex.cvxRewardPool.withdraw(parseEther("1"), true)
      ).not.toRevert()
    })
  })
})
