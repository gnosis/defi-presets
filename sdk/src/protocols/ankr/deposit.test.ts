import { eth } from "."
import { applyPermissions } from "../../../test/helpers"
import { wallets } from "../../../test/wallets"
import { contracts } from "../../../eth-sdk/config"
import { Status } from "../../../test/types"
import { eth as kit } from "../../../test/kit"
import { parseEther } from "ethers"
import { Chain } from ".../../../src"

describe("ankr", () => {
  describe("deposit", () => {
    beforeAll(async () => {
      await applyPermissions(Chain.eth, await eth.deposit())
    })

    it("deposit ETH", async () => {
      await expect(
        kit.asMember.ankr.eth2Staking.stakeAndClaimAethC({
          value: parseEther("5"),
        })
      ).not.toRevert()
    })

    it("only withdraw with flash unstake to avatar", async () => {
      await expect(
        kit.asMember.ankr.ankrEth.approve(
          contracts.mainnet.ankr.flashUnstake,
          parseEther("1")
        )
      ).toBeAllowed()
      await expect(
        kit.asMember.ankr.flashUnstake.swapEth(
          parseEther("0.000001"),
          wallets.avatar
        )
      ).not.toRevert()
      await expect(
        kit.asMember.ankr.flashUnstake.swapEth(
          parseEther("0.01"),
          wallets.member
        )
      ).toBeForbidden(Status.ParameterNotAllowed)
    })

    it("withdraw with standard unstake", async () => {
      await expect(
        kit.asMember.ankr.eth2Staking.unstakeAETH(parseEther("1"))
      ).not.toRevert()
    })
  })
})
