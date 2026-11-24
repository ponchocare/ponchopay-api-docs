# PonchoPay API docs

The PonchoPay API documentation, built with [Astro Starlight](https://starlight.astro.build) and
published to GitHub Pages.

Progress on the move from Notion is tracked in [PLAN.md](PLAN.md).

## Develop

```bash
pnpm install
pnpm dev
```

The site runs at http://localhost:4321/ponchopay-api-docs/.

## Write content

Pages live in `src/content/docs/` as Markdown (`.md`) or MDX (`.mdx`, when you need components such
as tabs). The file path is the URL: `src/content/docs/endpoints/initiate-payment.mdx` is
`/endpoints/initiate-payment/`.

- Link between pages with root-relative links, such as `/objects/payment/`. The base path is added
  at build time.
- Use `<Endpoint>` (`src/components/Endpoint.astro`) at the top of endpoint pages and `<Event>`
  (`src/components/Event.astro`) at the top of webhook pages.
- See "Conventions for ported pages" in [PLAN.md](PLAN.md).

## Deploy

Pushing to `main` builds and deploys the site with `.github/workflows/deploy.yml`. In the repo's
**Settings → Pages**, set the source to **GitHub Actions**.

To use a custom domain, add `public/CNAME` with the domain and set `SITE_URL` and `BASE_PATH: /`
in the workflow.
