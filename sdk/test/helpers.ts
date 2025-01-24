import { Permission, PermissionSet } from "zodiac-roles-sdk"
import {
  BigNumberish,
  Contract,
  Interface,
  Overrides,
  parseEther,
  toBeHex,
} from "ethers"

import { wallets, createSigner } from "./wallets"
import { getProvider } from "./provider"
import { createApply } from "../src/apply"
import { getRolesMod, testRoleKey } from "./rolesMod"
import { Chain } from "../src"
import { CHAIN_ID } from "../src/provider"

export const applyPermissions = async (
  chain: Chain,
  permissions: (Permission | PermissionSet | Promise<PermissionSet>)[]
) => {
  const apply = createApply(CHAIN_ID[chain]) // chainId here won't matter (since we pass currentTargets and currentAnnotations no subgraph queries will be made)
  const mod = await getRolesMod(chain)
  const calls = await apply(testRoleKey, permissions, {
    address: (await mod.getAddress()) as `0x${string}`,
    mode: "replace",
    log: console.debug,
    currentTargets: [],
    currentAnnotations: [],
  })

  console.log(`Applying permissions with ${calls.length} calls`)
  const ownerSigner = await createSigner(chain, wallets.owner)
  // let nonce = await ownerSigner.getNonce()

  await Promise.all(
    calls.map(async (call, i) => {
      try {
        return await ownerSigner.sendTransaction({
          ...call,
          // nonce: nonce++,
        })
      } catch (e: any) {
        console.error(`Error applying permissions in call #${i}:`, call)
        if (e.error?.error?.data) {
          const iface = new Interface([
            {
              inputs: [],
              name: "NotBFS",
              type: "error",
            },
            {
              inputs: [
                {
                  internalType: "uint256",
                  name: "index",
                  type: "uint256",
                },
              ],
              name: "UnsuitableChildCount",
              type: "error",
            },
            {
              inputs: [
                {
                  internalType: "uint256",
                  name: "index",
                  type: "uint256",
                },
              ],
              name: "UnsuitableChildTypeTree",
              type: "error",
            },
            {
              inputs: [
                {
                  internalType: "uint256",
                  name: "index",
                  type: "uint256",
                },
              ],
              name: "UnsuitableCompValue",
              type: "error",
            },
            {
              inputs: [
                {
                  internalType: "uint256",
                  name: "index",
                  type: "uint256",
                },
              ],
              name: "UnsuitableParameterType",
              type: "error",
            },
            {
              inputs: [
                {
                  internalType: "uint256",
                  name: "index",
                  type: "uint256",
                },
              ],
              name: "UnsuitableParent",
              type: "error",
            },
            {
              inputs: [],
              name: "UnsuitableRootNode",
              type: "error",
            },
            {
              inputs: [
                {
                  internalType: "uint256",
                  name: "index",
                  type: "uint256",
                },
              ],
              name: "UnsupportedOperator",
              type: "error",
            },
            {
              inputs: [
                {
                  components: [
                    {
                      internalType: "uint8",
                      name: "parent",
                      type: "uint8",
                    },
                    {
                      internalType: "enum ParameterType",
                      name: "paramType",
                      type: "ParameterType",
                    },
                    {
                      internalType: "enum Operator",
                      name: "operator",
                      type: "Operator",
                    },
                    {
                      internalType: "bytes",
                      name: "compValue",
                      type: "bytes",
                    },
                  ],
                  internalType: "struct ConditionFlat[]",
                  name: "conditions",
                  type: "tuple[]",
                },
              ],
              name: "enforce",
              outputs: [],
              stateMutability: "pure",
              type: "function",
            },
          ])
          const error = iface.getError(e.error.error.data.slice(0, 10))
          if (error) {
            console.error(
              "Integrity check failed with:",
              error.name,
              iface.decodeErrorResult(error, e.error.error.data)
            )
            throw new Error(`Integrity check failed with: ${error.name}`)
          }
        }
        throw e
      }
    })
  )

  console.log("Permissions applied")
}

export const execThroughRole = async (
  {
    chain,
    to,
    data,
    value,
    operation = 0,
  }: {
    chain: Chain
    to: `0x${string}`
    data?: `0x${string}`
    value?: `0x${string}`
    operation?: 0 | 1
  },
  overrides?: Overrides
) =>
  (await getRolesMod(chain))
    .connect(await createSigner(chain, wallets.member))
    .execTransactionWithRole(
      to,
      value || 0,
      data || "0x",
      operation,
      testRoleKey,
      true,
      overrides || {}
    )

const erc20Interface = new Interface([
  "function transfer(address to, uint amount) returns (bool)",
])

export const stealErc20 = async (
  chain: Chain,
  token: `0x${string}`,
  amount: BigNumberish,
  from: `0x${string}`
) => {
  const provider = getProvider(chain)

  // Impersonate the token holder and give a little gas stipend
  await provider.send("anvil_impersonateAccount", [from])
  await provider.send("anvil_setBalance", [from, toBeHex(parseEther("1"))])

  // Get the token contract with impersonated signer
  const contract = new Contract(
    token,
    erc20Interface,
    await provider.getSigner(from)
  )

  // Transfer the requested amount to the avatar
  await contract.transfer(wallets.avatar, amount)

  // Stop impersonating
  await provider.send("anvil_stopImpersonatingAccount", [from])
}

export async function advanceTime(chain: Chain, seconds: number) {
  const provider = getProvider(chain)
  await provider.send("evm_increaseTime", [seconds])
  await provider.send("evm_mine", [])
}
