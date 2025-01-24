import {
  ContractAddresses,
  ContractFactories,
  KnownContracts,
  calculateProxyAddress,
  deployAndSetUpModule,
} from "@gnosis-guild/zodiac"
import { createSigner, wallets } from "./wallets"
import { getProvider } from "./provider"
import { AbiCoder, Contract, encodeBytes32String } from "ethers"
import { Chain } from "../src"

const defaultAbiCoder = AbiCoder.defaultAbiCoder()

export const testRoleKey = encodeBytes32String("TEST-ROLE") as `0x${string}`

const SALT =
  "0x0000000000000000000000000000000000000000000000000000000000000000"

const predictRolesModAddress = async () => {
  const encodedInitParams = defaultAbiCoder.encode(
    ["address", "address", "address"],
    [wallets.owner, wallets.avatar, wallets.avatar]
  )

  const moduleSetupData = ContractFactories[KnownContracts.ROLES_V2]
    .createInterface()
    .encodeFunctionData("setUp", [encodedInitParams])

  return calculateProxyAddress(
    ContractFactories[KnownContracts.FACTORY].connect(
      ContractAddresses[1][KnownContracts.FACTORY],
      await createSigner(Chain.eth, wallets.deployer)
    ) as unknown as Contract,
    ContractAddresses[1][KnownContracts.ROLES_V2],
    moduleSetupData,
    SALT
  )
}

export async function deployRolesMod(chain: Chain) {
  const deployerSigner = await createSigner(chain, wallets.deployer)
  const { expectedModuleAddress, transaction } = await deployAndSetUpModule(
    KnownContracts.ROLES_V2,
    {
      types: ["address", "address", "address"],
      values: [wallets.owner, wallets.avatar, wallets.avatar],
    },
    deployerSigner.provider,
    Number((await getProvider(chain).getNetwork()).chainId),
    SALT
  )

  if (expectedModuleAddress !== (await predictRolesModAddress())) {
    throw new Error(
      `Roles mod address deployment unexpected, expected ${predictRolesModAddress()}, actual: ${expectedModuleAddress}`
    )
  }

  try {
    await deployerSigner.sendTransaction(transaction)
  } catch (e) {
    console.error(e)
  }

  console.log(`Roles mod deployed on ${chain} at ${expectedModuleAddress}`)
}

export const getRolesMod = async (chain: Chain) => {
  return ContractFactories[KnownContracts.ROLES_V2].connect(
    await predictRolesModAddress(),
    await createSigner(Chain.eth, wallets.owner)
  )
}

export async function setupRole(chain: Chain) {
  const rolesMod = await getRolesMod(chain)
  await rolesMod.assignRoles(
    wallets.member,
    [encodeBytes32String("TEST-ROLE")],
    [true]
  )
  console.log(`Created TEST-ROLE on ${chain} role with member:`, wallets.member)
}
