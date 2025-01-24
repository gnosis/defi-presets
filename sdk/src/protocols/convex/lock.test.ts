import { eth } from "."
import { cvx } from "./actions"
import { wallets } from "../../../test/wallets"
import {
  applyPermissions,
  stealErc20,
  advanceTime,
} from "../../../test/helpers"
import { contracts } from "../../../eth-sdk/config"
import { Status } from "../../../test/types"
import { eth as kit } from "../../../test/kit"
import { parseEther } from "ethers"
import { Chain } from "../../../src"

describe("convex", () => {
  describe("stake", () => {
    beforeAll(async () => {
      await applyPermissions(Chain.eth, await eth.lock())
    })
    it("only allow lock, process expired locks and claim to avatar", async () => {
      await stealErc20(
        Chain.eth,
        cvx,
        parseEther("1"),
        contracts.mainnet.balancer.vault
      )
      await expect(
        kit.asMember.usdc
          .attach(cvx)
          .approve(contracts.mainnet.convex.vlCvx, parseEther("1"))
      ).not.toRevert()

      await expect(
        kit.asMember.convex.vlCvx.lock(wallets.avatar, parseEther("1"), 0)
      ).not.toRevert()
      await expect(
        kit.asMember.convex.vlCvx.lock(wallets.member, parseEther("1"), 0)
      ).toBeForbidden(Status.ParameterNotAllowed)

      await expect(
        kit.asMember.convex.vlCvx["getReward(address,bool)"](
          wallets.avatar,
          false
        )
      ).not.toRevert()
      await expect(
        kit.asMember.convex.vlCvx["getReward(address,bool)"](
          wallets.member,
          false
        )
      ).toBeForbidden(Status.ParameterNotAllowed)

      await advanceTime(Chain.eth, 10300000) // 16 weeks and 6 days must pass for the tokens to be unlocked
      await expect(
        kit.asMember.convex.vlCvx.processExpiredLocks(true)
      ).not.toRevert()
    }, 90000) // Added 90 seconds of timeout because the lock takes too long and the test fails.
  })
})
