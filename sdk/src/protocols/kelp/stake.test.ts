import { getIndexedAccountPath, MaxUint256, parseEther } from "ethers"
import { eth } from "."
import { eth as kit } from "../../../test/kit"
import { applyPermissions, stealErc20 } from "../../../test/helpers"
import { contracts } from "../../../eth-sdk/config"
import { bigint } from "zod"
import { avatar } from "../../../test/wallets"

const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
const ETHx = contracts.mainnet.kelp.ethx
const stealAddressStEth = "0x47176B2Af9885dC6C4575d4eFd63895f7Aaa4790"
const stealAddressEthx = "0x59Ab5a5b5d617E478a2479B0cAD80DA7e2831492"
const referralId =
  "0xd05723c7b17b4e4c722ca4fb95e64ffc54a70131c75e2b2548a456c51ed7cdaf"

describe("kelp", () => {
  describe("eth", () => {
    describe("stake action", () => {
      beforeAll(async () => {
        await applyPermissions(
          await eth.stake({
            targets: ["stETH", "ETHx", "ETH"],
          })
        )
      })

      it("stake + unstake stETH", async () => {
        const amount = parseEther("1")
        let balance = await kit.asMember.lido.stEth.balanceOf(avatar.address)
        console.log("[1.0] balance before stealing stEth = ", balance)

        await stealErc20(
          contracts.mainnet.lido.stEth,
          amount,
          stealAddressStEth
        )
        balance = await kit.asMember.lido.stEth.balanceOf(avatar.address)
        console.log("[1.1] balance after stealing stEth = ", balance)

        await expect(
          kit.asMember.lido.stEth.approve(
            contracts.mainnet.kelp.LRTDepositPool,
            amount
          )
        ).not.toRevert()
        await expect(
          kit.asMember.kelp.LRTDepositPool.depositAsset(
            contracts.mainnet.lido.stEth,
            amount,
            0,
            referralId
          )
        ).not.toRevert()

        // //////////////////////////////////////////////////////////////////////////////////

        balance = await kit.asMember.kelp.rseth.balanceOf(avatar.address)
        console.log("[2.0] balance rseth before unstake stETH = ", balance)
        await expect(
          kit.asMember.kelp.rseth.approve(
            contracts.mainnet.kelp.LRTWithdrawalManager,
            balance
          )
        ).not.toRevert()

        await expect(
          kit.asMember.kelp.LRTWithdrawalManager.initiateWithdrawal(
            contracts.mainnet.lido.stEth,
            balance,
            referralId
          )
        ).not.toRevert()

        balance = await kit.asMember.kelp.rseth.balanceOf(avatar.address)
        console.log("[2.1] balance rseth after unstake stETH = ", balance)
      })

      it("stake + unstake ETHx", async () => {
        const amount = parseEther("10")
        await stealErc20(ETHx, amount, stealAddressEthx)
        await expect(
          kit.asMember.kelp.ethx.approve(
            contracts.mainnet.kelp.LRTDepositPool,
            amount
          )
        ).not.toRevert()
        await expect(
          kit.asMember.kelp.LRTDepositPool.depositAsset(
            ETHx,
            amount,
            0,
            referralId
          )
        ).not.toRevert()

        // *** unstake ETHx *** //
        const balance = await kit.asMember.kelp.rseth.balanceOf(avatar.address)
        // console.log("balance before = ", balance)

        await expect(
          kit.asMember.kelp.rseth.approve(
            contracts.mainnet.kelp.LRTWithdrawalManager,
            balance
          )
        ).not.toRevert()
        await expect(
          kit.asMember.kelp.LRTWithdrawalManager.initiateWithdrawal(
            ETHx,
            balance,
            referralId
          )
        ).not.toRevert()
        // console.log("balance after = ", balance)
      })

      //*** ETH ***//
      it("stake ETH", async () => {
        const amount = parseEther("1")
        await expect(
          kit.asMember.kelp.LRTDepositPool.depositETH(0, referralId, {
            value: amount,
          })
        ).not.toRevert()
      })
      it("unstake ETH", async () => {
        const balance = await kit.asMember.kelp.rseth.balanceOf(avatar.address)
        console.log("[3.0] balance rsETH before unstaking ETH = ", balance)

        await expect(
          kit.asMember.kelp.rseth.approve(
            contracts.mainnet.kelp.LRTWithdrawalManager,
            balance
          )
        ).not.toRevert()
        await expect(
          kit.asMember.kelp.LRTWithdrawalManager.initiateWithdrawal(
            contracts.mainnet.lido.stEth,
            balance,
            referralId
          )
        ).not.toRevert()
        console.log("[3.1] balance rsETH after unstaking ETH ", balance)
      })
    })
  })
})
