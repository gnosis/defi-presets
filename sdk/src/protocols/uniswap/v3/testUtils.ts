import { wallets } from "../../../../test/wallets"
import { stealErc20 } from "../../../../test/helpers"
import { contracts } from "../../../../eth-sdk/config"
import { eth as kit } from "../../../../test/kit"
import { Chain } from "../../../../src"

const E_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"

export const getPosition = async (nftId: bigint) => {
  return kit.asAvatar.uniswapV3.positionsNft.positions(nftId)
}

const getPoolAddress = async (token0: string, token1: string, fee: number) => {
  return await kit.asAvatar.uniswapV3.factory.getPool(token0, token1, fee)
}

const getPoolSlot0 = async (poolAddress: string) => {
  return await kit.asAvatar.uniswapV3.pool.attach(poolAddress).slot0()
}

export const calculateAmounts = async (
  tickLower: number,
  tickUpper: number,
  amount0Desired: bigint = 0n,
  amount1Desired: bigint = 0n,
  sqrtPriceX96?: bigint,
  nftId?: bigint
) => {
  if (!sqrtPriceX96) {
    if (!nftId) {
      throw new Error("sqrtPriceX96 is required if nftId is not provided")
    }
    const position = await getPosition(nftId)
    const poolAddress = await getPoolAddress(
      position[2],
      position[3],
      Number(position[4])
    )
    const slot0 = await kit.asAvatar.uniswapV3.pool.attach(poolAddress).slot0()
    sqrtPriceX96 = BigInt(slot0[0].toString())
  }

  const n1 = 1.0001 ** (tickUpper / 2)
  const n2 = 1.0001 ** (tickLower / 2)

  if (amount1Desired) {
    amount0Desired =
      (BigInt(amount1Desired) *
        BigInt(2 ** 96) *
        (BigInt(n1 * 2 ** 96) - sqrtPriceX96)) /
      (BigInt(Number(sqrtPriceX96) * n1) *
        (sqrtPriceX96 - BigInt(n2 * 2 ** 96)))
  } else {
    amount1Desired =
      (BigInt(amount0Desired) *
        BigInt(Number(sqrtPriceX96) * n1) *
        (sqrtPriceX96 - BigInt(n2 * 2 ** 96))) /
      (BigInt(2 ** 96) * (BigInt(n1 * 2 ** 96) - sqrtPriceX96))
  }

  const amount0Min = (amount0Desired * BigInt(99)) / BigInt(100) // 1% slippage for token0
  const amount1Min = (amount1Desired * BigInt(99)) / BigInt(100) // 1% slippage for token1

  return [amount0Desired, amount1Desired, amount0Min, amount1Min]
}

export const mintNFT = async (
  token0: `0x${string}`,
  token1: `0x${string}`,
  fee: number,
  amount0Desired: bigint = 0n,
  amount1Desired: bigint = 0n,
  throughRoles: boolean = false,
  stealAddress: `0x${string}` = "0x8eb8a3b98659cce290402893d0123abb75e3ab28"
) => {
  const asActor = throughRoles ? kit.asMember : kit.asAvatar

  let send = false
  let token0Decimals
  let token1Decimals
  if (token0 == E_ADDRESS) {
    send = true
    token0 = contracts.mainnet.weth
    token0Decimals = 18
  } else {
    token0Decimals = await kit.asAvatar.weth.attach(token0).decimals()
  }
  if (token1 == E_ADDRESS) {
    send = true
    token1 = contracts.mainnet.weth
    token1Decimals = 18
  } else {
    token1Decimals = await kit.asAvatar.weth.attach(token1).decimals()
  }

  const poolAddress = await getPoolAddress(token0, token1, fee)
  const slot0 = await getPoolSlot0(poolAddress)
  const sqrtPriceX96 = BigInt(slot0[0].toString())
  const sqrtPricen = (sqrtPriceX96 * BigInt(10 ** 18)) / BigInt(2 ** 96)
  const sqrtPrice = Number(sqrtPricen) / 10 ** 18
  const poolPrice =
    sqrtPrice ** 2 / 10 ** (Number(token1Decimals) - Number(token0Decimals))
  const tickSpacing = await kit.asAvatar.uniswapV3.pool
    .attach(poolAddress)
    .tickSpacing()

  const token0MinPrice = poolPrice * 0.9 // 10% token0 min price deviation
  const token0MaxPrice = poolPrice * 1.1 // 10% token0 max price deviation

  const tickLower =
    Math.ceil(
      (Math.log10(Number(token0MinPrice)) +
        (Number(token1Decimals) - Number(token0Decimals))) /
        Math.log10(1.0001) /
        Number(tickSpacing)
    ) * Number(tickSpacing)

  const tickUpper =
    Math.floor(
      (Math.log10(Number(token0MaxPrice)) +
        (Number(token1Decimals) - Number(token0Decimals))) /
        Math.log10(1.0001) /
        Number(tickSpacing)
    ) * Number(tickSpacing)

  const amounts = await calculateAmounts(
    tickLower,
    tickUpper,
    amount0Desired,
    amount1Desired,
    sqrtPriceX96
  )

  amount0Desired = amounts[0]
  amount1Desired = amounts[1]
  const amount0Min = amounts[2]
  const amount1Min = amounts[3]

  let value = 0n
  if (send == false) {
    await stealErc20(Chain.eth, token0, amount0Desired, stealAddress)
    await stealErc20(Chain.eth, token1, amount1Desired, stealAddress)
    await kit.asAvatar.weth
      .attach(token0)
      .approve(contracts.mainnet.uniswapV3.positionsNft, amount0Desired)
    await kit.asAvatar.weth
      .attach(token1)
      .approve(contracts.mainnet.uniswapV3.positionsNft, amount1Desired)
  } else {
    if (token0 == contracts.mainnet.weth) {
      value = amount0Desired
      await stealErc20(Chain.eth, token1, amount1Desired, stealAddress)
      await kit.asAvatar.weth
        .attach(token1)
        .approve(contracts.mainnet.uniswapV3.positionsNft, amount1Desired)
    } else {
      value = amount1Desired
      await stealErc20(Chain.eth, token0, amount0Desired, stealAddress)
      await kit.asAvatar.weth
        .attach(token0)
        .approve(contracts.mainnet.uniswapV3.positionsNft, amount0Desired)
    }
  }

  const mint = await asActor.uniswapV3.positionsNft.mint(
    {
      token0: token0,
      token1: token1,
      fee: fee,
      tickLower: tickLower,
      tickUpper: tickUpper,
      amount0Desired: amount0Desired,
      amount1Desired: amount1Desired,
      amount0Min: amount0Min,
      amount1Min: amount1Min,
      recipient: wallets.avatar,
      deadline: Math.floor(new Date().getTime() / 1000) + 1800,
    }
    // { value: value }
  )

  const ownedNfts = await kit.asAvatar.uniswapV3.positionsNft.balanceOf(
    wallets.avatar
  )
  let nftId = null
  if (ownedNfts > 0n) {
    nftId = await kit.asAvatar.uniswapV3.positionsNft.tokenOfOwnerByIndex(
      wallets.avatar,
      ownedNfts - 1n
    )
  }

  return nftId
}
