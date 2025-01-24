import { eth } from "."
import { wallets } from "../../../test/wallets"
import { applyPermissions } from "../../../test/helpers"
import { contracts } from "../../../eth-sdk/config"
import { eth as kit } from "../../../test/kit"
import { parseEther } from "ethers"
import { Chain } from "../../../src"

const bRethStablePid =
  "0x1e19cf2d73a72ef1332c882f20534b6519be0276000200000000000000000112"
const rEth = "0xae78736Cd615f374D3085123A210448E74Fc6393"

describe("balancer", () => {
  describe("deposit", () => {
    beforeAll(async () => {
      await applyPermissions(
        Chain.eth,
        await eth.deposit({ targets: ["B-rETH-STABLE", "50WETH-50-3pool"] })
      )
    })

    it("only deposit and withdraw from avatar", async () => {
      await kit.asAvatar.weth.deposit({ value: parseEther("1") })
      await expect(
        kit.asMember.weth.approve(
          contracts.mainnet.balancer.vault,
          parseEther("1")
        )
      ).not.toRevert()

      await expect(
        kit.asMember.balancer.vault.joinPool(
          bRethStablePid,
          wallets.avatar,
          wallets.avatar,
          {
            assets: [rEth, contracts.mainnet.weth],
            maxAmountsIn: [0, parseEther("1")],
            userData:
              "0x000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000de0b6b3a7640000",
            fromInternalBalance: false,
          }
        )
      ).not.toRevert()
      // member address not allowed
      await expect(
        kit.asMember.balancer.vault.joinPool(
          bRethStablePid,
          wallets.member,
          wallets.member,
          {
            assets: [rEth, contracts.mainnet.weth],
            maxAmountsIn: [0, parseEther("1")],
            userData:
              "0x000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000de0b6b3a7640000",
            fromInternalBalance: false,
          }
        )
      ).toBeForbidden()
      // pool id not allowed
      await expect(
        kit.asMember.balancer.vault.joinPool(
          "0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014",
          wallets.avatar,
          wallets.avatar,
          {
            assets: [rEth, contracts.mainnet.weth],
            maxAmountsIn: [0, parseEther("1")],
            userData:
              "0x000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000de0b6b3a7640000",
            fromInternalBalance: false,
          }
        )
      ).toBeForbidden()

      await expect(
        kit.asMember.balancer.vault.exitPool(
          bRethStablePid,
          wallets.avatar,
          wallets.avatar,
          {
            assets: [rEth, contracts.mainnet.weth],
            minAmountsOut: [0, 0],
            userData:
              "0x00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001",
            toInternalBalance: false,
          }
        )
      ).not.toRevert()
      // member address not allowed
      await expect(
        kit.asMember.balancer.vault.exitPool(
          bRethStablePid,
          wallets.member,
          wallets.member,
          {
            assets: [rEth, contracts.mainnet.weth],
            minAmountsOut: [0, 0],
            userData:
              "0x00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001",
            toInternalBalance: false,
          }
        )
      ).toBeForbidden()
      // pool id not allowed
      await expect(
        kit.asMember.balancer.vault.exitPool(
          "0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014",
          wallets.avatar,
          wallets.avatar,
          {
            assets: [rEth, contracts.mainnet.weth],
            minAmountsOut: [0, 0],
            userData:
              "0x00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001",
            toInternalBalance: false,
          }
        )
      ).toBeForbidden()
    })
  })
})
