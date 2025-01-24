import { eth } from "."
import { zeroAddress } from "./actions"
import { wallets } from "../../../test/wallets"
import { applyPermissions, stealErc20 } from "../../../test/helpers"
import { contracts } from "../../../eth-sdk/config"
import { Status } from "../../../test/types"
import { eth as kit } from "../../../test/kit"
import { parseEther } from "ethers"
import { Chain } from "../../../src"

const bal = "0xba100000625a3754423978a60c9317c58a424e3D"
const b80Bal20Weth = "0x5c6Ee304399DBdB9C8Ef030aB642B10820DB8F56"
const auraBal = "0x616e8BfA43F920657B3497DBf40D6b1A02D4608d"

describe("aura", () => {
  describe("stake", () => {
    beforeAll(async () => {
      await applyPermissions(
        Chain.eth,
        await eth.stake({ targets: ["BAL", "B-80BAL-20WETH", "auraBAL"] })
      )
    })
    it("mint auraBAL using BAL, stake and compound", async () => {
      await stealErc20(
        Chain.eth,
        bal,
        parseEther("3"),
        contracts.mainnet.balancer.vault
      )
      await expect(
        kit.asMember.usdc
          .attach(bal)
          .approve(contracts.mainnet.aura.balDepositorWrapper, parseEther("3"))
      ).not.toRevert()

      // mint
      await expect(
        kit.asMember.aura.balDepositorWrapper.deposit(
          parseEther("1"),
          0,
          true,
          zeroAddress
        )
      ).not.toRevert()

      // stake
      await expect(
        kit.asMember.aura.balDepositorWrapper.deposit(
          parseEther("1"),
          0,
          true,
          contracts.mainnet.aura.auraBalStakingRewarder
        )
      ).not.toRevert()
      await expect(
        kit.asMember.aura.auraBalStakingRewarder["getReward()"]()
      ).not.toRevert()
      await expect(
        kit.asMember.aura.auraBalStakingRewarder.withdraw(1, true)
      ).not.toRevert()

      // compound
      await expect(
        kit.asMember.aura.balDepositorWrapper.deposit(
          parseEther("1"),
          0,
          true,
          contracts.mainnet.aura.auraBalStaker
        )
      ).not.toRevert()
      await expect(
        kit.asMember.aura.auraBalCompoundingRewarder["getReward()"]()
      ).not.toRevert()
      await expect(
        kit.asMember.aura.stkauraBal.withdraw(1, wallets.avatar, wallets.avatar)
      ).not.toRevert()
      await expect(
        kit.asMember.aura.stkauraBal.withdraw(1, wallets.member, wallets.member)
      ).toBeForbidden(Status.ParameterNotAllowed)
    }, 90000) // Added 90 seconds of timeout because the deposit takes too long and the test fails.

    it("mint auraBAL using B-80BAL-20WETH, stake and compound", async () => {
      await stealErc20(
        Chain.eth,
        b80Bal20Weth,
        parseEther("3"),
        contracts.mainnet.balancer.vault
      )
      await expect(
        kit.asMember.usdc
          .attach(b80Bal20Weth)
          .approve(
            contracts.mainnet.aura.b80Bal20WethDepositorWrapper,
            parseEther("3")
          )
      ).not.toRevert()

      // mint
      await expect(
        kit.asMember.aura.b80Bal20WethDepositorWrapper[
          "deposit(uint256,bool,address)"
        ](parseEther("1"), true, zeroAddress)
      ).not.toRevert()

      // stake
      await expect(
        kit.asMember.aura.b80Bal20WethDepositorWrapper[
          "deposit(uint256,bool,address)"
        ](parseEther("1"), true, contracts.mainnet.aura.auraBalStakingRewarder)
      ).not.toRevert()
      await expect(
        kit.asMember.aura.auraBalStakingRewarder["getReward()"]()
      ).not.toRevert()

      console.log("BEFORE")
      await kit.asAvatar.aura.auraBalStakingRewarder.withdraw(1, true)
      console.log("AFTER")
      await expect(
        kit.asMember.aura.auraBalStakingRewarder.withdraw(1, true)
      ).not.toRevert()

      // compound
      await expect(
        kit.asMember.aura.b80Bal20WethDepositorWrapper[
          "deposit(uint256,bool,address)"
        ](parseEther("1"), true, contracts.mainnet.aura.auraBalStaker)
      ).not.toRevert()
      await expect(
        kit.asMember.aura.auraBalCompoundingRewarder["getReward()"]()
      ).not.toRevert()
      await expect(
        kit.asMember.aura.stkauraBal.withdraw(1, wallets.avatar, wallets.avatar)
      ).not.toRevert()
      await expect(
        kit.asMember.aura.stkauraBal.withdraw(1, wallets.member, wallets.member)
      ).toBeForbidden(Status.ParameterNotAllowed)
    }, 30000) // Added 30 seconds of timeout because the deposit takes too long and the test fails.

    it("stake and compound auraBAL", async () => {
      await stealErc20(
        Chain.eth,
        auraBal,
        parseEther("2"),
        contracts.mainnet.balancer.vault
      )
      // For staking
      await expect(
        kit.asMember.usdc
          .attach(auraBal)
          .approve(
            contracts.mainnet.aura.auraBalStakingRewarder,
            parseEther("1")
          )
      ).not.toRevert()
      // For compounding
      await expect(
        kit.asMember.usdc
          .attach(auraBal)
          .approve(contracts.mainnet.aura.stkauraBal, parseEther("1"))
      ).not.toRevert()

      // stake
      await expect(
        kit.asMember.aura.auraBalStakingRewarder.stake(parseEther("1"))
      ).not.toRevert()

      // compound
      await expect(
        kit.asMember.aura.stkauraBal.deposit(parseEther("1"), wallets.avatar)
      ).not.toRevert()
      await expect(
        kit.asMember.aura.stkauraBal.deposit(parseEther("1"), wallets.member)
      ).toBeForbidden(Status.ParameterNotAllowed)
    })
  })
})
