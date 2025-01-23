import * as aaveV2 from "./aave/v2/schema"
import * as aaveV3 from "./aave/v3/schema"
import * as ankr from "./ankr/schema"
import * as aura from "./aura/schema"
import * as balancer from "./balancer/schema"
import * as compoundV2 from "./compound/v2/schema"
// import * as compoundV3 from "./compound/v3/schema"
import * as convex from "./convex/schema"
import * as cowSwap from "./cowSwap/schema"
import * as lido from "./lido/schema"
import * as sky from "./sky/schema"
import * as rocketPool from "./rocketPool/schema"
import * as spark from "./spark/schema"
import * as stader from "./stader/schema"
import * as stakeWiseV2 from "./stakeWise/v2/schema"
import * as symbiotic from "./symbiotic/schema"
import * as stakeWiseV3 from "./stakeWise/v3/schema"
import * as uniswapV3 from "./uniswap/v3/schema"
import { ProtocolSchemas } from "../types"

// group all protocols schemas by chain
// IMPORTANT: API keys were rolled back to prevent breaking annotations in existing policies.
export const eth = {
  aave_v2: aaveV2.eth,
  aave_v3: aaveV3.eth,
  ankr: ankr.eth,
  aura: aura.eth,
  balancer: balancer.eth,
  compound_v2: compoundV2.eth,
  // compound_v3: compoundV3.eth,
  convex: convex.eth,
  cowswap: cowSwap.eth,
  lido: lido.eth,
  sky: sky.eth,
  rocket_pool: rocketPool.eth,
  spark: spark.eth,
  stader: stader.eth,
  stakewise_v2: stakeWiseV2.eth,
  symbiotic: symbiotic.eth,
  stakewise_v3: stakeWiseV3.eth,
  uniswap_v3: uniswapV3.eth,
} satisfies ProtocolSchemas

export const gno = {
  aave_v3: aaveV3.gno,
  aura: aura.gno,
  balancer: balancer.gno,
  cowswap: cowSwap.gno,
  spark: spark.gno,
  stakewise_v3: stakeWiseV3.gno,
} satisfies ProtocolSchemas

export const arb1 = {
  aave_v3: aaveV3.arb1,
  aura: aura.arb1,
  balancer: balancer.arb1,
  cowswap: cowSwap.arb1,
} satisfies ProtocolSchemas

export const oeth = {
  aave_v3: aaveV3.oeth,
  aura: aura.oeth,
  balancer: balancer.oeth,
} satisfies ProtocolSchemas

export const base = {
  aave_v3: aaveV3.base,
  aura: aura.base,
  balancer: balancer.base,
} satisfies ProtocolSchemas
