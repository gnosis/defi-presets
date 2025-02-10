import * as aaveV2 from "./aave/v2"
import * as aaveV3 from "./aave/v3"
import * as ankr from "./ankr"
import * as aura from "./aura"
import * as balancer from "./balancer"
import * as compoundV2 from "./compound/v2"
// import * as compoundV3 from "./compound/v3"
import * as convex from "./convex"
import * as cowSwap from "./cowSwap"
import * as kelp from "./kelp"
import * as lido from "./lido"
import * as sky from "./sky"
import * as rocketPool from "./rocketPool"
import * as spark from "./spark"
import * as stader from "./stader"
import * as stakeWiseV2 from "./stakeWise/v2"
import * as stakeWiseV3 from "./stakeWise/v3"
import * as uniswapV3 from "./uniswap/v3"
import * as symbiotic from "./symbiotic"

import { annotateAll } from "./annotate"

// group all protocols actions by chain and wrap the functions to the resulting permissions sets are annotated
// IMPORTANT: API keys were rolled back to prevent breaking annotations in existing policies.
export const eth = annotateAll(
  {
    aave_v2: aaveV2.eth,
    aave_v3: aaveV3.eth,
    ankr: ankr.eth,
    aura: aura.eth,
    balancer: balancer.eth,
    compound_v2: compoundV2.eth,
    // compound_v3: compoundV3.eth,
    convex: convex.eth,
    cowswap: cowSwap.eth,
    kelp: kelp.eth,
    lido: lido.eth,
    sky: sky.eth,
    rocket_pool: rocketPool.eth,
    spark: spark.eth,
    stader: stader.eth,
    stakewise_v2: stakeWiseV2.eth,
    symbiotic: symbiotic.eth,
    stakewise_v3: stakeWiseV3.eth,
    uniswap_v3: uniswapV3.eth,
  },
  "eth"
)

export const gno = annotateAll(
  {
    aave_v3: aaveV3.gno,
    aura: aura.gno,
    balancer: balancer.gno,
    cowswap: cowSwap.gno,
    spark: spark.gno,
    stakewise_v3: stakeWiseV3.gno,
  },
  "gno"
)

export const arb1 = annotateAll(
  {
    aave_v3: aaveV3.arb1,
    aura: aura.arb1,
    balancer: balancer.arb1,
    cowswap: cowSwap.arb1,
  },
  "arb1"
)

export const oeth = annotateAll(
  {
    aave_v3: aaveV3.oeth,
    aura: aura.oeth,
    balancer: balancer.oeth,
  },
  "oeth"
)

export const base = annotateAll(
  {
    aave_v3: aaveV3.base,
    aura: aura.base,
    balancer: balancer.base,
  },
  "base"
)
