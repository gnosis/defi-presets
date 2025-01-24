import { eth } from "."
import { wallets } from "../../../test/wallets"
import { applyPermissions } from "../../../test/helpers"
import { queryCdps, queryIlk, queryProxy } from "./utils"
import { ZeroAddress, encodeBytes32String, parseEther } from "ethers"
import { eth as kit } from "../../../test/kit"
import { Chain } from "../../../src"

const getProxy = async () => {
  const proxyAddress = await queryProxy(wallets.avatar as `0x${string}`)
  console.log({ proxyAddress, avatar: wallets.avatar })
  const proxy = kit.asMember.sky.dsProxy.attach(proxyAddress)
  return proxy
}

const openSkyCdp = async ({ ilk }: { ilk: string }) => {
  // build proxy if it doesn't exist yet
  if ((await queryProxy(wallets.avatar as `0x${string}`)) === ZeroAddress) {
    await kit.asAvatar.sky.proxyRegistry["build()"]()
  }

  const proxyAddress = await queryProxy(wallets.avatar as `0x${string}`)
  const proxy = kit.asAvatar.sky.dsProxy.attach(proxyAddress)
  console.log("ILK from gemjoin", await kit.asAvatar.sky.gemJoin.ilk())

  console.log("encoding", encodeBytes32String("ETH-A"))

  console.log(
    "Open data: ",
    await kit.asAvatar.sky.proxyActions.getAddress(),
    await kit.asAvatar.sky.cdpManager.getAddress(),
    ilk,
    await proxy.getAddress(),
    proxyAddress
  )

  const tx = await proxy["execute(address,bytes)"](
    await kit.asAvatar.sky.proxyActions.getAddress(),
    kit.asAvatar.sky.proxyActions.interface.encodeFunctionData("open", [
      await kit.asAvatar.sky.cdpManager.getAddress(),
      ilk,
      await proxy.getAddress(),
    ])
  )
  console.log((await tx.wait())!.logs)

  console.log("After open()")
  return (await queryCdps((await proxy.getAddress()) as `0x${string}`))[0]
}

describe("sky", () => {
  describe("deposit", () => {
    let cdp: bigint

    beforeAll(async () => {
      cdp = await openSkyCdp({
        ilk: "0x4554482d41000000000000000000000000000000000000000000000000000000",
      })

      console.log("cdpID: ", cdp)
      console.log(
        "applied permissions",
        await eth.deposit({ avatar: wallets.avatar as `0x${string}` })
      )
      await applyPermissions(
        Chain.eth,
        await eth.deposit({ avatar: wallets.avatar as `0x${string}` })
      )
    })

    it("allows depositing ETH to an existing cdp", async () => {
      const proxy = await getProxy()
      console.log("proxy address", await proxy.getAddress())
      // eth-sdk config powers different "kits":
      // sdk - doing stuff directly in the name of whatever wallet you init it with
      // testKit - doing stuff through the test roles in the name of the avatar
      // allow - returning permissions to do that call through the test role (allowing the respective testKit... call)

      const ilk = await queryIlk(cdp)
      console.log(
        "Data",
        await kit.asAvatar.sky.cdpManager.getAddress(),
        ilk.gemJoin,
        cdp
      )
      await expect(
        proxy["execute(address,bytes)"](
          await kit.asAvatar.sky.proxyActions.getAddress(),
          kit.asAvatar.sky.proxyActions.interface.encodeFunctionData(
            "lockETH",
            [await kit.asAvatar.sky.cdpManager.getAddress(), ilk.gemJoin, cdp]
          ),
          { value: parseEther("1000") }
        )
      ).not.toRevert()

      // make sure permissions really only allow to lock to our own CDPs
      await expect(
        proxy["execute(address,bytes)"](
          await kit.asAvatar.sky.proxyActions.getAddress(),
          kit.asAvatar.sky.proxyActions.interface.encodeFunctionData(
            "lockETH",
            [await kit.asAvatar.sky.cdpManager.getAddress(), ilk.gemJoin, 123]
          ),
          { value: parseEther("1000") }
        )
      ).toBeForbidden()
    })
  })
})
