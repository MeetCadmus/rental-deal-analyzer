// Test-facing barrel: re-exports domain + infrastructure so ported tests can do
// `import * as M from "../../test/barrel"` exactly like the old single-module harness.
export * from "../domain";
export * from "../infrastructure/csv";
export * from "../infrastructure/listing";
export * from "../infrastructure/ai";
export * from "../infrastructure/storage/dealRepository";
