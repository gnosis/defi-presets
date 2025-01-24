import {
  getArbitrumOneSdk,
  getGnosisSdk,
  getMainnetSdk,
  getOptimismSdk,
  getBaseSdk,
} from "@gnosis-guild/eth-sdk-client"
import {
  Addressable,
  BaseContract,
  ContractTransaction,
  ContractTransactionResponse,
  FunctionFragment,
  isError,
  toBeHex,
} from "ethers"
import { createSigner, wallets } from "./wallets"
import { execThroughRole } from "./helpers"
import { ContractFactories, KnownContracts } from "@gnosis-guild/zodiac"
import { Chain } from "../src"

/** We need to skip over functions with "view" state mutability. We do this by matching the ethers ContractMethod type  */
interface StateMutatingContractMethod {
  (): Promise<ContractTransactionResponse>
  name: string
  fragment: FunctionFragment
  getFragment(): FunctionFragment
  populateTransaction(): Promise<ContractTransaction>
  staticCall(): Promise<any>
  send(): Promise<ContractTransactionResponse>
  estimateGas(): Promise<bigint>
  staticCallResult(): Promise<any>
}

type TestContract<C extends BaseContract> = {
  [key in Exclude<
    keyof C,
    "attach"
  >]: C[key] extends StateMutatingContractMethod
    ? C[key] & { delegateCall: C[key]["send"] }
    : C[key]
} & { attach(target: string | Addressable): C }

type EthSdk = {
  [key: string]: EthSdk | BaseContract
}

type TestKit<S extends EthSdk> = {
  [Key in keyof S]: S[Key] extends BaseContract
    ? TestContract<S[Key]>
    : S[Key] extends EthSdk // somehow it cannot infer that it cannot be a BaseContract here, so we use an extra conditional
    ? TestKit<S[Key]>
    : never
}

const mapSdk = <S extends EthSdk>(sdk: S, chain: Chain): TestKit<S> => {
  return Object.keys(sdk).reduce((acc, key) => {
    // for this check to work reliably, make sure ethers node_modules is not duplicated
    if (sdk[key] instanceof BaseContract) {
      acc[key] = makeTestContract(sdk[key] as BaseContract, chain)
    } else {
      acc[key] = mapSdk(sdk[key] as EthSdk, chain)
    }
    return acc
  }, {} as any)
}

const makeTestContract = <C extends BaseContract>(
  contract: C,
  chain: Chain
): TestContract<C> => {
  const rolesInterface =
    ContractFactories[KnownContracts.ROLES_V2].createInterface()

  const isWriteFunction = (prop: string) => {
    try {
      const func = contract.getFunction(prop)
      return (
        func.fragment.stateMutability === "nonpayable" ||
        func.fragment.stateMutability === "payable"
      )
    } catch (error) {
      if (!isError(error, "INVALID_ARGUMENT") || error.argument !== "key") {
        throw error
      }
      return false
    }
  }

  return new Proxy(contract, {
    get: (target, prop) => {
      if (prop === "attach") {
        return (addr: string | Addressable) =>
          makeTestContract(target.attach(addr), chain)
      }

      if (typeof prop === "string" && isWriteFunction(prop)) {
        const original = (target as any)[prop] as StateMutatingContractMethod

        const throughRoles =
          (operation: 1 | 0 = 0) =>
          async (...args: any[]) => {
            let overrides = undefined
            if (args.length > original.fragment.inputs.length) {
              overrides = args.pop()
            }
            const { value, ...overridesRest } = overrides || {}

            const data = contract.interface.encodeFunctionData(
              original.fragment,
              args
            ) as `0x${string}`
            try {
              return await execThroughRole(
                {
                  chain,
                  to: (await contract.getAddress()) as `0x${string}`,
                  data,
                  value: value && toBeHex(BigInt(value)),
                  operation: operation,
                },
                overridesRest
              )
            } catch (error: any) {
              if (typeof error !== "object") {
                throw error
              }

              // find the root cause error with errorSignature or revert data in the ethers error stack
              let rootError = error
              while (
                rootError.error &&
                !rootError.data &&
                !rootError.errorSignature
              ) {
                rootError = rootError.error
              }

              // re-throw if the error is not a revert
              if (
                !rootError.message.startsWith("execution reverted") &&
                !rootError.message.startsWith("call revert exception") &&
                !rootError.reason?.startsWith("execution reverted")
              ) {
                throw error
              }

              if (!rootError.errorSignature) {
                // Check if the error is a roles error
                const selector = rootError.data.slice(0, 10)
                let rolesError = undefined
                try {
                  rolesError = rolesInterface.getError(selector)
                } catch (e) {}
                if (rolesError) {
                  // Decode the revert data using Roles ABI. this will throw a better error
                  throw rolesInterface.makeError(
                    rootError.data,
                    rootError.transaction
                  )
                }

                // Not a Roles error, try decoding the call return data, this will decode the revert reason using the target contract's ABI and throw a better error
                throw contract.interface.makeError(
                  rootError.data,
                  rootError.transaction
                )
              }

              throw error
            }
          }

        const contractMethod = throughRoles(0) as any
        const { name, ...propsToCarryOver } = original
        Object.assign(contractMethod, propsToCarryOver)
        contractMethod.call = throughRoles(0)
        contractMethod.delegateCall = throughRoles(1)

        return contractMethod
      }

      return (target as any)[prop]
    },
  }) as any
}

const initEthKits = async () => {
  const avatarSdk = getMainnetSdk(await createSigner(Chain.eth, wallets.avatar))
  const memberSdk = mapSdk(avatarSdk, Chain.eth)
  return { asAvatar: avatarSdk, asMember: memberSdk }
}

const initGnoKits = async () => {
  const avatarSdk = getGnosisSdk(await createSigner(Chain.gno, wallets.avatar))
  const memberSdk = mapSdk(avatarSdk, Chain.gno)
  return { asAvatar: avatarSdk, asMember: memberSdk }
}

const initArb1Kits = async () => {
  const avatarSdk = getArbitrumOneSdk(
    await createSigner(Chain.arb1, wallets.avatar)
  )
  const memberSdk = mapSdk(avatarSdk, Chain.arb1)
  return { asAvatar: avatarSdk, asMember: memberSdk }
}

const initOethKits = async () => {
  const avatarSdk = getOptimismSdk(
    await createSigner(Chain.oeth, wallets.avatar)
  )
  const memberSdk = mapSdk(avatarSdk, Chain.oeth)
  return { asAvatar: avatarSdk, asMember: memberSdk }
}

const initBaseKits = async () => {
  const avatarSdk = getBaseSdk(await createSigner(Chain.base, wallets.avatar))
  const memberSdk = mapSdk(avatarSdk, Chain.base)
  return { asAvatar: avatarSdk, asMember: memberSdk }
}

export const eth = {} as any as Awaited<ReturnType<typeof initEthKits>>
export const gno = {} as any as Awaited<ReturnType<typeof initGnoKits>>
export const arb1 = {} as any as Awaited<ReturnType<typeof initArb1Kits>>
export const oeth = {} as any as Awaited<ReturnType<typeof initOethKits>>
export const base = {} as any as Awaited<ReturnType<typeof initBaseKits>>

beforeAll(async () => {
  Object.assign(eth, await initEthKits())
  Object.assign(gno, await initGnoKits())
  Object.assign(arb1, await initArb1Kits())
  Object.assign(oeth, await initOethKits())
  Object.assign(base, await initBaseKits())
})
