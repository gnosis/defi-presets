# DeFi Presets

Permission presets for [Zodiac Roles](https://github.com/gnosis/zodiac-modifier-roles) covering interactions with DeFi protocols.

https://presets.karpatkey.com

## Getting started

You can use DeFi Presets as a TypeScript SDK or via a REST API.
Below you can find simple examples for both.
For in-depth overview, refer to the [docs](https://presets.karpatkey.com/learn).

### TypeScript SDK

```
yarn add defi-presets
```

```typescript
import { apply, allow } from "defi-presets"

const calls = await apply(roleKey, [...allow.cowswap.swap(tokenIn, tokenOut)], {
  address: rolesModAddress,
  mode: "extend",
})
```

### REST API

```typescript
const res = await fetch(
  "https://presets.karpatkey.com/api/v1/eth:<MOD>/<ROLE>/allow/cowswap/swap?sell=<TOKEN_IN>&buy=<TOKEN_OUT>"
)
const calls = await res.json()
```

## Contribute

Install all dependencies:

```
yarn
```

Fetch ABIs and generate types for the sdk package:

```
yarn setup
```

Start app dev server and watch sources for changes:

```
yarn dev
```

Build sdk and app:

```
yarn build
```

### Recipes

#### Add a new protocol to the SKD

1. Create folder named after the protocol you wanna add in sdk/src/protocols.
2. Create a index.ts file in that folder.
3. For every chain that the protocol supports export an object under the chain prefix, e.g.:
   ```typescript
   export const eth = {}
   export const gno = {}
   ```
4. For every action that the protocol support add a key to each of the chain exports, e.g.:

   ```typescript
   export const eth = {
     deposit: () => [],
   }

   export const gno = {
     deposit: () => [],
   }
   ```

5. In sdk/src/protocols/index.ts, register the new protocol adding it to the exports for all the chains that it supports, e.g.:

   ```typescript
   import * as newProtocol from "./newProtocol"

   export const eth = {
     ..., // existing entries
     newProtocol: newProtocol.eth,
   } satisfies Record<string, ProtocolActions>

   export const gno = {
     ..., // existing entries
     newProtocol: newProtocol.gno,
   } satisfies Record<string, ProtocolActions>
   ```

6. Implement the functions, adhering to the general API for that action type and returning an array of `PresetAllowEntry[]`. See following section for guidance.

Note: For the new protocol functions to become available in the SDK playground, the changes must first be published to npm as a new version of the _defi-presets_ package.

#### Implement an allow function using the typed kit

1. Add entries for the contracts you want to allow calling to sdk/eth-sdk/config.ts. If there are multiple instances of the same contract, such as different pool instances, only add a single entry using any exemplary contract address, e.g.:
   ```typescript
   mainnet: {
     curve: {
       regularPool: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
     }
   }
   ```
2. Run `yarn setup`. This will automatically fetch the ABI for the listed contracts. In case this fails, you will have to manually add the ABI json file add the respective location in sdk/eth-sdk/abis.
3. Use the typed allow kit that has been generated:

   ```typescript
   import { allow } from "zodiac-roles-sdk/kit"

   const allowEntries = allow.curve.regularPool.exchange()
   ```

   In case VSCode IntelliSense does not reflect the newly added contract entries, restart the TypeScript server by pressing cmd+shift+p and selecting "TypeScript: Restart TS Server".

Note that you don't _have_ to use typed allow kits but you can always also author the allow entries manually.

#### Add a new protocol to the API

Once a protocol has been added to the SDK, a couple of extra steps are necessary to make it available also via the REST API.

1. Define the parameter schema for the protocol action. Create a schema file in the protocol folder (src/protocols/<name>/schema.ts) and add exports for every supported network and action:

   ```typescript
   export const eth = {
     deposit: z.object({ targets: z.enum(...) }),
   }

   export const gno = {
     deposit: z.object({ targets: z.enum(...) }),
   }
   ```

2. Register the protocol schema in sdk/src/protocols/schema.ts:

   ```typescript
   import * as newProtocol from "./newProtocol/schema"

   export const eth = {
     ..., // existing entries
     newProtocol: newProtocol.eth,
   } satisfies Record<string, ProtocolSchemas>

   export const gno = {
     ..., // existing entries
     newProtocol: newProtocol.gno,
   } satisfies Record<string, ProtocolSchemas>
   ```

3. Check that the new endpoints have been registered correctly, by opening https://localhost:3000/api-docs.
