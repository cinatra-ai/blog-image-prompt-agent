// Pins the declared item members of this agent's `prompts` bridge output.
//
// The runtime asks the model for exactly the shape this agent declares: an
// object level with NO declared members is sent closed and empty, so an answer
// carries nothing there. `prompts` therefore has to declare the members its
// consumers read — the BlogImagePrompt shape locked in the generate node's own
// operating instructions: { placement, prompt, rationale }.
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

const oas = JSON.parse(
  readFileSync(fileURLToPath(new URL("../cinatra/oas.json", import.meta.url)), "utf8"),
);

const MEMBERS = ["placement", "prompt", "rationale"];

function outputsOf(holder) {
  assert.ok(Array.isArray(holder?.outputs), "expected an outputs array");
  return holder.outputs;
}

function promptsOutput(holder, where) {
  const found = outputsOf(holder).find((output) => output?.title === "prompts");
  assert.ok(found, `expected a 'prompts' output on ${where}`);
  return found;
}

function assertDeclaredMembers(output, where) {
  const items = output?.json_schema?.items;
  assert.ok(items, `${where}: prompts declares no json_schema.items`);
  assert.equal(items.type, "object", `${where}: prompts items are not an object level`);
  assert.ok(
    items.properties && typeof items.properties === "object",
    `${where}: prompts items declare no members (free-form); the request can promise nothing about them`,
  );
  assert.deepEqual(
    Object.keys(items.properties).sort(),
    [...MEMBERS].sort(),
    `${where}: prompts items must declare exactly the BlogImagePrompt members`,
  );
  for (const member of MEMBERS) {
    assert.equal(
      items.properties[member].type,
      "string",
      `${where}: prompts item member '${member}' must be declared a string`,
    );
  }
  assert.deepEqual(
    [...(items.required ?? [])].sort(),
    [...MEMBERS].sort(),
    `${where}: prompts items must require every BlogImagePrompt member`,
  );
}

test("the generate bridge node declares the prompts item members", () => {
  const generate = oas["$referenced_components"]?.generate;
  assert.equal(generate?.component_type, "ApiNode", "expected the generate ApiNode");
  assertDeclaredMembers(promptsOutput(generate, "the generate node"), "the generate node");
});

test("the end node carries the same declared prompts item members", () => {
  const end = oas["$referenced_components"]?.end;
  assert.equal(end?.component_type, "EndNode", "expected the end EndNode");
  assertDeclaredMembers(promptsOutput(end, "the end node"), "the end node");
});

test("the flow output carries the same declared prompts item members", () => {
  assertDeclaredMembers(promptsOutput(oas, "the flow output"), "the flow output");
});
