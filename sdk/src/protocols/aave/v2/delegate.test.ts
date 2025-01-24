import { eth } from "."
import { wallets } from "../../../../test/wallets"
import { applyPermissions } from "../../../../test/helpers"
import { Status } from "../../../../test/types"
import { eth as kit } from "../../../../test/kit"
import { Chain } from "../../../../src"

const DELEGATEE = "0x849D52316331967b6fF1198e5E32A0eB168D039d"

describe("aaveV2", () => {
  describe("delegate", () => {
    beforeAll(async () => {
      await applyPermissions(
        Chain.eth,
        await eth.delegate({ targets: ["AAVE"], delegatee: DELEGATEE })
      )
    })

    it("only allow delegation of AAVE to delegatee", async () => {
      await expect(kit.asMember.aaveV2.aave.delegate(DELEGATEE)).not.toRevert()

      await expect(
        kit.asMember.aaveV2.aave.delegate(wallets.member)
      ).toBeForbidden(Status.ParameterNotAllowed)

      await expect(
        kit.asMember.aaveV2.aave.delegateByType(DELEGATEE, 0)
      ).not.toRevert()

      await expect(
        kit.asMember.aaveV2.aave.delegateByType(wallets.member, 0)
      ).toBeForbidden(Status.ParameterNotAllowed)
    })
  })
})
