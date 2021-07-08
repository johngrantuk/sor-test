## Overview

Basic test scaffold to test implementations of SOR.

Trade files in `./src/tradeFiles` contain trade information along with pool data. Test files (i.e. `./test/compare.ts`) will run through each trade and run specified tests against SOR implementations.

SOR implementations are found in `./src/implementations`. These are basic wrappers around an SOR, i.e. sorV1, sorV2, that accept trade information from file and return `Result` in common format that can then be tested against using test files. Any new SOR implementations can be easily added by creating new implementation file based on existing.

## Run Tests

Currently has basic test checking sorV2 result is greater than or equal to sorV1.

Run: `$ yarn compare`

New tests can be added by replicating `compare.ts` and updating `assertResults` function as needed.