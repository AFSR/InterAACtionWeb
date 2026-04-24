# AugCom

Communication board app (Angular). Lets users build and use
personalised pictogram grids, with imported or free image banks.

## Upstream

<https://github.com/AFSR/AugCom-AFSR>

## Status

Not yet integrated. Plan:

1. Fork `AFSR/AugCom-AFSR` under AFSR.
2. Build the Angular app in CI (`npm ci && npm run build`) and publish
   the `dist/` output under `/apps/augcom/` on `interaactionweb.afsr.fr`.
3. Link from `portal/` once the build is reproducible from CI.

## Notes for the web build

- Upstream used a custom Chrome extension ("CORS Unblock") to let AugCom
  talk to sibling apps served on other ports. On the web we serve
  everything from a single origin, so no CORS workaround is needed.
