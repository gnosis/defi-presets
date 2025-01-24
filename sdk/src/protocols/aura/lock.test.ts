import { eth } from "."
import { aura } from "./actions"
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
import { Chain } from ".../../../src"

describe("aura", () => {
  describe("stake", () => {
    beforeAll(async () => {
      await applyPermissions(Chain.eth, await eth.lock())
    })
    it("only allow lock, process expired locks and claim to avatar", async () => {
      await stealErc20(
        Chain.eth,
        aura,
        parseEther("1"),
        contracts.mainnet.balancer.vault
      )
      await expect(
        kit.asMember.usdc
          .attach(aura)
          .approve(contracts.mainnet.aura.vlAura, parseEther("1"))
      ).not.toRevert()

      await expect(
        kit.asMember.aura.vlAura.lock(wallets.avatar, parseEther("1"))
      ).not.toRevert()
      await expect(
        kit.asMember.aura.vlAura.lock(wallets.member, parseEther("1"))
      ).toBeForbidden(Status.ParameterNotAllowed)

      await expect(
        kit.asMember.aura.vlAura["getReward(address)"](wallets.avatar)
      ).not.toRevert()
      await expect(
        kit.asMember.aura.vlAura["getReward(address)"](wallets.member)
      ).toBeForbidden(Status.ParameterNotAllowed)

      await advanceTime(Chain.eth, 10200000) // 16 weeks and 5 days must pass for the tokens to be unlocked
      await expect(
        kit.asMember.aura.vlAura.processExpiredLocks(true)
      ).not.toRevert()
    })
  })
})
