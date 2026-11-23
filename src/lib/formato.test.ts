import assert from "node:assert/strict";
import { test } from "node:test";
import { comSinal } from "./formato.ts";

test("Diferença em reais leva o sinal na frente, e zero não leva sinal", () => {
  assert.equal(comSinal(25013.4), "+R$ 25.013");
  assert.equal(comSinal(-1234), "−R$ 1.234");
  assert.equal(comSinal(0.2), "R$ 0");
  assert.equal(comSinal(2084.45, 2), "+R$ 2.084,45");
});
