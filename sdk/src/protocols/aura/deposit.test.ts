import { eth, gno } from "."
import { aura } from "./actions"
import { wallets } from "../../../test/wallets"
import { applyPermissions, stealErc20 } from "../../../test/helpers"
import { contracts } from "../../../eth-sdk/config"
import { Status } from "../../../test/types"
import { eth as kit } from "../../../test/kit"
import { parseEther } from "ethers"
import { Chain } from ".../../../src"

const b50Weth50Aura = "0xCfCA23cA9CA720B6E98E3Eb9B6aa0fFC4a5C08B9"
const b50Weth50AuraPid =
  "0xcfca23ca9ca720b6e98e3eb9b6aa0ffc4a5c08b9000200000000000000000274"
const aura50Weth50AuraRewarder = "0x1204f5060bE8b716F5A62b4Df4cE32acD01a69f5"

describe("aura", () => {
  describe("deposit", () => {
    beforeAll(async () => {
      // Aura 50WETH-50AURA
      await applyPermissions(Chain.eth, await eth.deposit({ targets: ["100"] }))
    })
    it("deposit and withdraw bpt from pool, only claim to avatar", async () => {
      await stealErc20(
        Chain.eth,
        b50Weth50Aura,
        parseEther("1"),
        contracts.mainnet.aura.booster
      )
      await expect(
        kit.asMember.usdc
          .attach(b50Weth50Aura)
          .approve(contracts.mainnet.aura.booster, parseEther("1"))
      ).not.toRevert()

      await expect(
        kit.asMember.aura.booster.deposit(100, parseEther("1"), true)
      ).not.toRevert()
      await expect(
        kit.asMember.aura.booster.deposit(99, parseEther("1"), true)
      ).toBeForbidden(Status.ParameterNotAllowed)

      await expect(
        kit.asMember.aura.rewarder
          .attach(aura50Weth50AuraRewarder)
          .withdrawAndUnwrap(parseEther("1"), false)
      ).not.toRevert()

      await expect(
        kit.asMember.aura.rewarder
          .attach(aura50Weth50AuraRewarder)
          ["getReward(address,bool)"](wallets.avatar, true)
      ).not.toRevert()
      await expect(
        kit.asMember.aura.rewarder
          .attach(aura50Weth50AuraRewarder)
          ["getReward(address,bool)"](wallets.member, true)
      ).toBeForbidden(Status.ParameterNotAllowed)
    }, 60000) // Added 60 seconds of timeout because the deposit takes too long and the test fails.

    it("deposit single token, withdraw bpt from pool", async () => {
      await kit.asAvatar.weth.deposit({ value: parseEther("1") })
      await expect(
        kit.asMember.weth.approve(
          contracts.mainnet.aura.rewardPoolDepositWrapper,
          parseEther("1")
        )
      ).not.toRevert()

      await expect(
        kit.asMember.aura.rewardPoolDepositWrapper.depositSingle(
          aura50Weth50AuraRewarder,
          contracts.mainnet.weth,
          parseEther("1"),
          b50Weth50AuraPid,
          {
            assets: [contracts.mainnet.weth, aura],
            maxAmountsIn: [parseEther("1"), 0],
            userData:
              "0x00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000000000000000000000",
            fromInternalBalance: false,
          }
        )
      ).not.toRevert()

      await expect(
        kit.asMember.aura.rewardPoolDepositWrapper.depositSingle(
          aura50Weth50AuraRewarder,
          contracts.mainnet.usdc, // USDC not allowed
          parseEther("1"),
          b50Weth50AuraPid,
          {
            assets: [contracts.mainnet.weth, aura],
            maxAmountsIn: [parseEther("1"), 0],
            userData:
              "0x00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000000000000000000000",
            fromInternalBalance: false,
          }
        )
      ).toBeForbidden()
    })
  })

  it("gno pool search", async () => {
    await gno.deposit({ targets: ["15"] })
  })
})
