import { eth } from "."
import { wallets } from "../../../../test/wallets"
import { applyPermissions, stealErc20 } from "../../../../test/helpers"
import { contracts } from "../../../../eth-sdk/config"
import { parseUnits, parseEther } from "ethers"
import { eth as kit } from "../../../../test/kit"
import { mintNFT, getPosition, calculateAmounts } from "./testUtils"
import { Chain } from "../../../../src"

const stealAddress = "0x8eb8a3b98659cce290402893d0123abb75e3ab28"
const collectMaxAmount = 340282366920938463463374607431768211455n

describe("uniswapV3", () => {
  describe("deposit (with targets)", () => {
    beforeAll(async () => {
      await kit.asAvatar.weth.deposit({ value: parseEther("10") })

      const nftId = await mintNFT(
        contracts.mainnet.usdc,
        contracts.mainnet.weth,
        3000,
        0n,
        1000000000000000000n
      )
      const nftIdRes = Number(nftId || 0)
      console.log("Initial NFT Id: ", nftIdRes)
      console.log({
        targets: [nftIdRes.toString()],
        tokens: [contracts.mainnet.dai, contracts.mainnet.usdc],
        fees: ["0.01%"],
      })
      await applyPermissions(
        Chain.eth,
        await eth.deposit({
          targets: [nftIdRes.toString()],
          tokens: [contracts.mainnet.dai, contracts.mainnet.usdc],
          fees: ["0.01%"],
        })
      )
    }, 30000)

    it("mint new position only with `tokens` and `fees`", async () => {
      await expect(
        mintNFT(
          contracts.mainnet.dai,
          contracts.mainnet.usdc,
          100,
          1000000000000000000000n,
          0n,
          true
        )
      ).not.toRevert()
      await expect(
        mintNFT(
          contracts.mainnet.dai,
          contracts.mainnet.usdt,
          100,
          1000000000000000000000n,
          0n,
          true
        )
      ).toBeForbidden()
      await expect(
        mintNFT(
          contracts.mainnet.dai,
          contracts.mainnet.usdc,
          500,
          1000000000000000000000n,
          0n,
          true
        )
      ).toBeForbidden()
    }, 30000)

    it("only increase liquidity of the avatars' NFT", async () => {
      await stealErc20(
        Chain.eth,
        contracts.mainnet.usdc,
        parseUnits("50000", 6),
        stealAddress
      )
      await expect(
        kit.asMember.usdc.approve(
          contracts.mainnet.uniswapV3.positionsNft,
          parseUnits("50000", 6)
        )
      ).not.toRevert()
      await expect(
        kit.asMember.weth.approve(
          contracts.mainnet.uniswapV3.positionsNft,
          parseEther("10")
        )
      ).not.toRevert()
      const nftId =
        await kit.asAvatar.uniswapV3.positionsNft.tokenOfOwnerByIndex(
          wallets.avatar,
          0
        )
      const position = await getPosition(nftId)
      const [amount0Desired, amount1Desired, amount0Min, amount1Min] =
        await calculateAmounts(
          Number(position[5]),
          Number(position[6]),
          0n,
          1000000000000000000n,
          undefined,
          nftId
        )
      console.log({
        tokenId: nftId,
        amount0Desired: amount0Desired,
        amount1Desired: amount1Desired,
        amount0Min: amount0Min,
        amount1Min: amount1Min,
        deadline: Math.floor(new Date().getTime() / 1000) + 1800,
      })
      await expect(
        kit.asMember.uniswapV3.positionsNft.increaseLiquidity(
          {
            tokenId: nftId,
            amount0Desired: amount0Desired,
            amount1Desired: amount1Desired,
            amount0Min: amount0Min,
            amount1Min: amount1Min,
            deadline: Math.floor(new Date().getTime() / 1000) + 1800,
          }
          // { value: amount1Desired } No ETH sending allowed.
        )
      ).not.toRevert()
      // await expect(
      //   kit.asMember.uniswapV3.positionsNft.refundETH()
      // ).not.toRevert()
      await expect(
        kit.asMember.uniswapV3.positionsNft.increaseLiquidity(
          {
            tokenId: 1, // invalid nftId
            amount0Desired: amount0Desired,
            amount1Desired: amount1Desired,
            amount0Min: amount0Min,
            amount1Min: amount1Min,
            deadline: Math.floor(new Date().getTime() / 1000) + 1800,
          }
          // { value: amount1Desired } No ETH sending allowed.
        )
      ).toBeForbidden()
    })

    it("decrease liquidity and collect using WETH", async () => {
      const nftId =
        await kit.asAvatar.uniswapV3.positionsNft.tokenOfOwnerByIndex(
          wallets.avatar,
          0
        )
      const position = await getPosition(nftId)
      await expect(
        kit.asMember.uniswapV3.positionsNft.decreaseLiquidity({
          tokenId: nftId,
          liquidity: position[7] / 2n,
          amount0Min: 0,
          amount1Min: 0,
          deadline: Math.floor(new Date().getTime() / 1000) + 1800,
        })
      ).not.toRevert()
      await expect(
        kit.asMember.uniswapV3.positionsNft.collect({
          tokenId: nftId,
          amount0Max: collectMaxAmount,
          amount1Max: collectMaxAmount,
          recipient: wallets.avatar,
        })
      ).not.toRevert()
      await expect(
        kit.asMember.uniswapV3.positionsNft.collect({
          tokenId: nftId,
          amount0Max: collectMaxAmount,
          amount1Max: collectMaxAmount,
          recipient: wallets.member,
        })
      ).toBeForbidden()
    })
  })
})
