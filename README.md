# KORWAQ — Corporate Website

Official corporate website for KORWAQ, built with HTML5, CSS3, and Vanilla JavaScript.

## Stack

- HTML5, CSS3, Vanilla JavaScript (ES Modules)
- GitHub Pages + Cloudflare
- JSON-based i18n (Turkish / English)

## Local Development

```bash
python -m http.server 9001
```

Visit `http://localhost:9001`

## Pages

| Page | Path |
|------|------|
| Home | `/index.html` |
| About | `/about.html` |
| Solutions | `/solutions.html` |
| Blog | `/blog.html` |
| Careers | `/careers.html` |
| Contact | `/contact.html` |
| Privacy | `/privacy.html` |
| 404 | `/404.html` |

## Architecture

- **CSS**: Modular layers imported via `style.css`
- **Partials**: Reusable HTML loaded via JavaScript (`assets/partials/`)
- **i18n**: `tr.json` / `en.json` with `data-i18n` attributes
- **Default language**: Turkish (`localStorage`: `korwaq-lang`)

## Deployment (GitHub Pages)

1. Push to GitHub repository
2. Enable GitHub Pages (branch: `main`, folder: `/root`)
3. Connect domain via Cloudflare DNS

## Status

All modules complete — Header, Hero, Why KORWAQ, Solutions, About, Updates, CTA, Footer, and all inner pages.

## License

Proprietary — KORWAQ. All rights reserved.
