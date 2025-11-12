## From EntryPoint v0.6 to v0.7

This guide walks you through upgrading an existing Safe wallet configured with `safeModulesVersion` **0.2.0** (EntryPoint **v0.6**) to the **0.3.0** module set that targets EntryPoint **v0.7**.

### 1. Enable the v0.7 module
Run the `src/protocol-kit/enable-module.ts` script after updating its constants (or wiring ENV vars) so that:
- `safeAddress` points to your Safe
- `moduleAddress` is `0x75cf11467937ce3F2f357CE24ffc3DBF8fD5c226`

This attaches the Safe 4337 v0.3.0 module.

### 2. Set the fallback handler
Execute `src/protocol-kit/set-fallback-handler.ts` with the same Safe address and fallback handler address:
- `fallbackHandlerAddress` = `0x75cf11467937ce3F2f357CE24ffc3DBF8fD5c226`

Both steps must succeed for the Safe to support EntryPoint v0.7.

### 3. Verify the migration
Check that the module exposes the expected entry point:

```bash
cast call 0x234A8E69f15179e38706CAd12550AfD8dbE3b6a3 \
  "SUPPORTED_ENTRYPOINT()" \
  --rpc-url RPC_URL
```

- A **v0.7** entry point address confirms the fallback handler switch.
- If you still see the **v0.6** entry point, rerun the enable + fallback scripts.

To inspect the enabled modules programmatically you can also run:
- `src/protocol-kit/get-safe-version.ts`

