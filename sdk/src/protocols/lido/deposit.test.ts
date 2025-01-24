import { eth } from "."
import { wallets } from "../../../test/wallets"
import { applyPermissions, advanceTime } from "../../../test/helpers"
import { contracts } from "../../../eth-sdk/config"
import { Status } from "../../../test/types"
import { eth as kit } from "../../../test/kit"
import { parseEther } from "ethers"
import { Chain } from "../../../src"

describe("lido", () => {
  describe("deposit", () => {
    beforeAll(async () => {
      await applyPermissions(Chain.eth, await eth.deposit())
    })

    it("allows submitting ETH", async () => {
      await expect(
        kit.asMember.lido.stEth.submit(wallets.avatar, {
          value: parseEther("10"),
        })
      ).not.toRevert()
    })

    it("allows wrapping and unwrapping stETH", async () => {
      await expect(
        kit.asMember.lido.stEth.approve(
          contracts.mainnet.lido.wstEth,
          parseEther("5")
        )
      ).not.toRevert()
      await expect(
        kit.asMember.lido.wstEth.wrap(parseEther("5"))
      ).not.toRevert()
      await expect(
        kit.asMember.lido.wstEth.unwrap(parseEther("1"))
      ).not.toRevert()
    })

    it("only allows requesting withdrawals from avatar's positions", async () => {
      await expect(
        kit.asMember.lido.stEth.approve(
          contracts.mainnet.lido.unstEth,
          parseEther("1")
        )
      ).not.toRevert()
      await advanceTime(Chain.eth, 2)
      await expect(
        kit.asMember.lido.unstEth.requestWithdrawals(
          [parseEther("1")],
          wallets.avatar
        )
      ).not.toRevert()

      await expect(
        kit.asMember.lido.wstEth.approve(
          contracts.mainnet.lido.unstEth,
          parseEther("1")
        )
      ).not.toRevert()
      await advanceTime(Chain.eth, 2)
      await expect(
        kit.asMember.lido.unstEth.requestWithdrawalsWstETH(
          [parseEther("1")],
          wallets.avatar
        )
      ).not.toRevert()

      await expect(
        kit.asMember.lido.unstEth.requestWithdrawals(
          [parseEther("1")],
          wallets.member
        )
      ).toBeForbidden(Status.ParameterNotAllowed)
      await expect(
        kit.asMember.lido.unstEth.requestWithdrawalsWstETH(
          [parseEther("1")],
          wallets.member
        )
      ).toBeForbidden(Status.ParameterNotAllowed)
    })
  })
})
