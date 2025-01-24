import { id, solidityPackedKeccak256 } from "ethers"
import { eth } from "."
import { wallets } from "../../../test/wallets"
import { applyPermissions } from "../../../test/helpers"
import { getProvider } from "../../../test/provider"
import { contracts } from "../../../eth-sdk/config"
import { eth as kit } from "../../../test/kit"
import { Chain } from "../../../src"

describe("cowSwap", () => {
  describe("swap", () => {
    const appData = '{"version":"0.9.0","metadata":{}}'
    const testOrder = {
      sellToken: contracts.mainnet.usdc,
      buyToken: contracts.mainnet.weth,
      receiver: "", // set in beforeAll
      sellAmount: "96825924243465932",
      buyAmount: "474505929366652675891",
      validTo: 0, // set in beforeAll
      appData: solidityPackedKeccak256(["string"], [appData]),
      feeAmount: "19174075756534068",
      kind: id("sell"),
      partiallyFillable: false,
      sellTokenBalance: id("erc20"),
      buyTokenBalance: id("erc20"),
    }
    let testOrderFeeAmountBP = Math.ceil(
      (parseInt(testOrder.feeAmount) / parseInt(testOrder.sellAmount)) * 10000
    ) // = 535 bps
    const testOrderValidDuration = 60 * 30 // 30 min

    beforeAll(async () => {
      await applyPermissions(
        Chain.eth,
        await eth.swap({
          sell: [contracts.mainnet.usdc],
          buy: [contracts.mainnet.weth],
        })
      )

      const provider = getProvider(Chain.eth)
      const block = await provider.getBlock("latest")

      testOrder.receiver = wallets.avatar
      testOrder.validTo = block!.timestamp + testOrderValidDuration
    })

    it("it only allows swapping the specified token pair", async () => {
      await expect(
        kit.asMember.cowSwap.orderSigner.signOrder.delegateCall(
          testOrder,
          testOrderValidDuration,
          testOrderFeeAmountBP
        )
      ).not.toRevert()

      await expect(
        kit.asMember.cowSwap.orderSigner.signOrder.delegateCall(
          {
            ...testOrder,
            sellToken: contracts.mainnet.weth,
            buyToken: contracts.mainnet.usdc,
          },
          testOrderValidDuration,
          testOrderFeeAmountBP
        )
      ).toBeForbidden()
    })

    it("allows cancelling orders", async () => {
      await expect(
        kit.asMember.cowSwap.orderSigner.unsignOrder.delegateCall(testOrder)
      ).not.toRevert()
    })
  })
})
