import { eth } from "."
import {
  bal,
  b80Bal20Weth,
  b80Bal20WethPid,
  bbaUsdV1,
  bbaUsdV2,
  bbaUsdV3,
} from "./actions"
import { contracts } from "../../../eth-sdk/config"
import { Status } from "../../../test/types"
import { wallets } from "../../../test/wallets"
import { applyPermissions } from "../../../test/helpers"
import { eth as kit } from "../../../test/kit"
import { ZeroAddress, parseEther } from "ethers"
import { Chain } from "../../../src"

describe("balancer", () => {
  describe("lock", () => {
    beforeAll(async () => {
      await applyPermissions(Chain.eth, await eth.lock())
    })

    it("deposit and withdraw from B-80BAL-20WETH pool", async () => {
      await expect(
        kit.asMember.balancer.vault.joinPool(
          b80Bal20WethPid,
          wallets.avatar,
          wallets.avatar,
          {
            assets: [bal, ZeroAddress],
            maxAmountsIn: [0, parseEther("100")],
            userData:
              "0x000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000056bc75e2d63100000",
            fromInternalBalance: false,
          },
          { value: parseEther("100") }
        )
      ).not.toRevert()

      await expect(
        kit.asMember.balancer.vault.exitPool(
          b80Bal20WethPid,
          wallets.avatar,
          wallets.avatar,
          {
            assets: [bal, contracts.mainnet.weth],
            minAmountsOut: [0, 0],
            userData:
              "0x00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001",
            toInternalBalance: false,
          }
        )
      ).not.toRevert()
    })

    it("lock and claim", async () => {
      let unlock_timestamp =
        Math.floor(new Date().getTime() / 1000) + 30 * 24 * 60 * 60
      await expect(
        kit.asMember.usdc
          .attach(b80Bal20Weth)
          .approve(contracts.mainnet.balancer.veBal, parseEther("200"))
      ).not.toRevert()

      // The create_lock() reverts because it checks if the call
      // is from a whitelisted smart contract (like a Safe), revert if not.
      // To check if the smart contract is whitelisted you can query
      // the check() in https://etherscan.io/address/0x7869296Efd0a76872fEE62A058C8fBca5c1c826C
      await expect(
        kit.asMember.balancer.veBal.create_lock(
          parseEther("100"),
          unlock_timestamp
        )
      ).toRevert()

      // Test that the transaction goes through the roles
      await expect(
        kit.asMember.balancer.veBal.create_lock(
          parseEther("100"),
          unlock_timestamp
        )
      ).toBeAllowed()

      // Test that the transaction goes through the roles
      await expect(
        kit.asMember.balancer.veBal.increase_amount(parseEther("200"))
      ).toBeAllowed()

      unlock_timestamp = unlock_timestamp + 30 * 24 * 60 * 60
      // Test that the transaction goes through the roles
      await expect(
        kit.asMember.balancer.veBal.increase_unlock_time(unlock_timestamp)
      ).toBeAllowed()

      // Test that the transaction goes through the roles
      await expect(kit.asMember.balancer.veBal.withdraw()).toBeAllowed()

      // Claim only with avatar as user
      await expect(
        kit.asMember.balancer.feeDistributor.claimTokens(wallets.avatar, [
          bbaUsdV1,
          bbaUsdV2,
          bbaUsdV3,
          bal,
          contracts.mainnet.usdc,
        ])
      ).not.toRevert()

      await expect(
        kit.asMember.balancer.feeDistributor.claimTokens(wallets.member, [
          bbaUsdV1,
          bbaUsdV2,
          bbaUsdV3,
          bal,
          contracts.mainnet.usdc,
        ])
      ).toBeForbidden(Status.ParameterNotAllowed)
    })
  })
})
