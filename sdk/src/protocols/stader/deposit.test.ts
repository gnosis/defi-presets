import { eth } from "."
import { applyPermissions } from "../../../test/helpers"
import { wallets } from "../../../test/wallets"
import { contracts } from "../../../eth-sdk/config"
import { Status } from "../../../test/types"
import { eth as kit } from "../../../test/kit"
import { parseEther } from "ethers"
import { Chain } from "../../../src"

describe("stader", () => {
  describe("deposit", () => {
    beforeAll(async () => {
      await applyPermissions(Chain.eth, await eth.deposit())
    })

    it("only deposit ETH on behalf of avatar", async () => {
      await expect(
        kit.asMember.stader.stakingPoolManager["deposit(address)"](
          wallets.avatar,
          {
            value: parseEther("5"),
          }
        )
      ).not.toRevert()
      await expect(
        kit.asMember.stader.stakingPoolManager["deposit(address)"](
          wallets.member,
          {
            value: parseEther("5"),
          }
        )
      ).toBeForbidden(Status.ParameterNotAllowed)
    })

    it("only withdraw to avatar", async () => {
      await expect(
        kit.asMember.stader.ethx.approve(
          contracts.mainnet.stader.userWithdrawManager,
          parseEther("1")
        )
      ).not.toRevert()
      await expect(
        kit.asMember.stader.userWithdrawManager[
          "requestWithdraw(uint256,address)"
        ](parseEther("1"), wallets.avatar)
      ).not.toRevert()
      await expect(
        kit.asMember.stader.userWithdrawManager[
          "requestWithdraw(uint256,address)"
        ](parseEther("1"), wallets.member)
      ).toBeForbidden(Status.ParameterNotAllowed)
    })

    it("claim withdrawal request through roles", async () => {
      await expect(
        kit.asMember.stader.userWithdrawManager.claim(665)
      ).toBeAllowed()
    })
  })
})
