# Bundled Windows core

Pinned official client core: **Leadaxe/sing-box-lx v1.14.2-lx.11**, Windows amd64.

- Release/source: https://github.com/Leadaxe/sing-box-lx/releases/tag/v1.14.2-lx.11
- Revision: `3d3d3db3a2ccef3b1a8eb71b831ed2461c54b94d`
- Official ZIP SHA256: `0a63389570c675aa7a8820c0e0a61fa8c7a7f3346dcec9773b67bbcfc551bc85`
- Bundled `sing-box.exe` SHA256: `1bf6c329963fbb6e4e80079f28e2079c0a6c3a860e8bdecf9a4dfc7f5bfa6b0f`

Upgraded in Windows 2.0.35 because 1.14.0-lx.15 rejects the VLESS `encryption` field required by encrypted subscription nodes. XHTTP remains supported. Only the core executable is used; the release's optional Naive/Cronet DLL is not included because this app does not expose that outbound.

The core inherits GPL-3.0; see the upstream source repository and included license notice. Private subscription keys and test fixtures are excluded from the app bundle.
