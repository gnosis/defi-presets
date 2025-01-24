import { eth } from "."
import { wallets } from "../../../test/wallets"
import { applyPermissions, stealErc20 } from "../../../test/helpers"
import { contracts } from "../../../eth-sdk/config"
import { Status } from "../../../test/types"
import { eth as kit } from "../../../test/kit"
import { parseEther } from "ethers"
import { Chain } from "../../../src"

const steCrv = "0x06325440D014e39736583c165C2963BA99fAf14E"
const cvxsteCrv = "0x9518c9063eB0262D791f38d8d6Eb0aca33c63ed0"
const cvxsteCrvRewarder = "0x0A760466E1B4621579a82a39CB56Dda2F4E70f03"
const steCrvHolder = "0x4F48031B0EF8acCea3052Af00A3279fbA31b50D8"

describe("convex", () => {
  describe("deposit", () => {
    beforeAll(async () => {
      // Convex ETH/stETH
      await applyPermissions(Chain.eth, await eth.deposit({ targets: ["25"] }))
    })
    it("deposit and withdraw curve LP from pool without staking", async () => {
      await stealErc20(Chain.eth, steCrv, parseEther("1"), steCrvHolder)
      await expect(
        kit.asMember.usdc
          .attach(steCrv)
          .approve(contracts.mainnet.convex.booster, parseEther("1"))
      ).not.toRevert()

      await expect(
        kit.asMember.convex.booster.deposit(25, parseEther("1"), false)
      ).not.toRevert()
      await expect(
        kit.asMember.convex.booster.deposit(24, parseEther("1"), false)
      ).toBeForbidden(Status.ParameterNotAllowed)

      await expect(
        kit.asMember.convex.booster.withdraw(25, parseEther("1"))
      ).not.toRevert()
      await expect(
        kit.asMember.convex.booster.withdraw(24, parseEther("1"))
      ).toBeForbidden(Status.ParameterNotAllowed)
    }, 60000) // Added 60 seconds of timeout because the deposit takes too long and the test fails.

    it("stake and withdraw cvxDepositToken / withdraw and unwrap cvxDepositToken", async () => {
      await stealErc20(Chain.eth, cvxsteCrv, parseEther("2"), cvxsteCrvRewarder)
      await expect(
        kit.asMember.usdc
          .attach(cvxsteCrv)
          .approve(cvxsteCrvRewarder, parseEther("2"))
      ).not.toRevert()

      await expect(
        // The rewarder in the config file is the cvxsteCrvRewarder (no need to attach)
        kit.asMember.convex.rewarder.stake(parseEther("1"))
      ).not.toRevert()
      await expect(
        kit.asMember.convex.rewarder.withdraw(parseEther("1"), false)
      ).not.toRevert()

      await expect(
        kit.asMember.convex.rewarder.stake(parseEther("1"))
      ).not.toRevert()
      await expect(
        kit.asMember.convex.rewarder.withdrawAndUnwrap(parseEther("1"), false)
      ).not.toRevert()
    })

    it("only claim rewards to avatar", async () => {
      await expect(
        kit.asMember.convex.rewarder["getReward(address,bool)"](
          wallets.avatar,
          true
        )
      ).not.toRevert()
      await expect(
        kit.asMember.convex.rewarder["getReward(address,bool)"](
          wallets.member,
          true
        )
      ).toBeForbidden(Status.ParameterNotAllowed)
    })
  })
})
