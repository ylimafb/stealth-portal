# Phase 5 supported-site smoke test

This verifies the first usable adapter contract: one reviewed HTTPS upstream origin; ordinary links and assets; relative same-origin `fetch`; browser storage; bounded forms/JSON/SSE where the upstream provides them. It does **not** establish compatibility with unrelated public sites, WebSockets, cross-origin APIs, or login flows.

## Prepare a harmless upstream

`examples/adapter-fixture/` is an owned static site. Publish the repository through GitHub Pages, then open its fixture URL normally, for example `https://YOURNAME.github.io/bookmarklet-browser/examples/adapter-fixture/`. The exact path depends on your Pages configuration. The target `Origin` is only `https://YOURNAME.github.io/`; the fixture path is entered in the portal address bar. The fixture uses no third-party resources, passwords, or external APIs. GitHub Pages is only the upstream test site; it cannot host the Windows backend.

## Configure the Windows service

Build with `npm.cmd run build`. Use a public HTTPS portal hostname and one account-specific adapter base with wildcard DNS/TLS. Create an access key with `dotnet run --project backend/Portal.Proxy/Portal.Proxy.csproj -- --issue-key` and a stable account label with `--issue-host-label`. Put only the key hash in ignored `backend/Portal.Proxy/appsettings.Local.json`; keep the raw key private. Example values below are placeholders:

```json
{
  "Relay": {
    "PortalOrigin": "https://portal.example.com/",
    "EnforceConfiguredHosts": true,
    "Accounts": [{
      "Id": "tester",
      "KeySha256": "REPLACE_WITH_64_HEX_HASH",
      "AdapterHostLabel": "REPLACE_WITH_32_LOWERCASE_HEX_LABEL"
    }],
    "Targets": [{
      "Id": "fixture",
      "Origin": "https://YOURNAME.github.io/",
      "AdapterEnabled": true,
      "AdapterOrigin": "https://fixture-adapter.example.com/"
    }]
  }
}
```

The actual browser adapter host is `https://<label>.fixture-adapter.example.com/`, not the base host. Keep the portal and adapter hostnames under the same HTTPS site (`example.com` in this example): the adapter session cookie uses `SameSite=Strict`. Configure HTTPS ingress for the portal and this adapter hostname, preserving `Host` and forwarding to the loopback Windows service. A portal-only tunnel does not publish the adapter. Do not expose Kestrel's HTTP port directly to the Internet.

## Exercise the build

1. Start the Windows service with `powershell -ExecutionPolicy Bypass -File tools/start-portal.ps1`. Keep the terminal open and verify `/health` through the public HTTPS portal URL.
2. Open `/portal.html` on the portal hostname. In **Settings → Advanced**, connect using the access key. The bookmarklet is not required for this hosted smoke test.
3. Enter the fixture URL in the portal address bar. It may display normally in the iframe; that is expected and remains the default transport.
4. Open the floating gear's **Embedding options** action. It now requests a fresh adapter plan even when the iframe worked. Select **Try adapter**. A separate tab should land on the account-specific adapter hostname after a one-time ticket redirect.
5. Confirm “Relative JSON request succeeded”, open the details link and return, and write/read a storage marker. The browser address should remain on the account-specific adapter hostname. If you have a second account, run the separate `/__portal/isolation-check` procedure in [the backend guide](../backend/README.md).

If the plan is unavailable, inspect the upstream response with `tools/check-embed.ps1` and read the adapter reason. A site can be reachable yet unsupported by the policy-preserving transformer. Do not remove its CSP, framing headers, or `no-transform` directive to force this test.

## What is and is not tested

The fixture proves only static navigation and a relative JSON request in a real browser once the steps above are run. Backend tests separately exercise bounded POST/PUT/PATCH/DELETE, cookies, and finite SSE using an injected upstream fixture. GitHub Pages cannot provide an SSE or WebSocket endpoint. These checks are not capacity certification or a security review.
