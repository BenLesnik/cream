# Kerb

A map-first property search for Australia, in the spirit of realestate.com.au and domain.com.au. Listings are loaded live from the [Domain API](https://developer.domain.com.au/) for whatever part of the map you're looking at, and nearly everything about the interface can be customised.

## Running it

```bash
npm install
cp .env.example .env.local   # add your Domain credentials
npm run dev
```

Open http://localhost:3000.

Without Domain credentials the app still works: it runs on a generated demo dataset of suburbs across every capital city and a few regional centres, and shows a banner saying so.

### Domain API credentials

Create a project at [developer.domain.com.au](https://developer.domain.com.au/), enable the **Listings Management** / **Agents & Listings** package and add either:

| Variable | Notes |
| --- | --- |
| `DOMAIN_API_KEY` | API key, sent as `X-Api-Key`. Simplest option. |
| `DOMAIN_CLIENT_ID` / `DOMAIN_CLIENT_SECRET` | OAuth client credentials. Takes precedence over the API key. Tokens are cached until expiry. |
| `DOMAIN_SCOPES` | Optional, defaults to `api_listings_read`. |

Credentials never reach the browser. The client talks to the app's own route handlers, which call Domain:

- `POST /api/search` maps filters and the visible map area (or a drawn polygon) to `POST /v1/listings/residential/_search`. Responses are cached in memory for five minutes to stay within Domain's daily quota.
- `GET /api/listings/:id` fetches `GET /v1/listings/{id}` for the detail view, merged with the cached search summary.
- `GET /api/geocode` handles place autocomplete (suburbs, postcodes, streets) via OpenStreetMap's Photon geocoder, limited to Australia.

If Domain rejects a request (bad credentials, rate limit), the app falls back to demo listings and says why.

## Features

**Search**
- Buy, Rent and Sold modes.
- Results refresh as you pan and zoom. You can switch that off and use "Search this area" instead.
- Draw a polygon on the map to search a custom area, with the outside dimmed.
- Location autocomplete for suburbs, postcodes, streets and cities, with recent searches.
- Filters for price (with a histogram of prices in view), beds (min and max), baths, parking, property type, land size, 26 features, keywords, new or established, listed within, open homes, auctions, under offer, priced only, floorplan and video.
- Sort by featured, newest, price, next open home, auction date, bedrooms or land size.
- Every search is reflected in the URL, so it can be shared or bookmarked.

**Map**
- Price pins that merge into clusters (with each cluster's average price) when zoomed out.
- Five base maps: light, streets, detailed with 3D buildings, dark and satellite.
- Density or relative-price heatmap.
- Pin labels can show price, bedrooms or plain dots.
- 3D tilt, "near me", and highlighting kept in sync between pins and cards.

**Listings**
- Photo carousels on cards. The detail drawer adds a full-screen lightbox with keyboard navigation.
- Inspections and auctions can be added to your calendar as `.ics` files.
- Mortgage repayments (weekly, fortnightly or monthly) with a stamp duty estimate, or a rent breakdown for rentals.
- Agent contact details and similar homes nearby.
- Shortlist with notes and CSV export, saved searches, hidden listings, viewed history and a side-by-side compare of up to four homes.

**Customisation** (saved in local storage)
- Light, dark or system theme, and six accent colours.
- Layout as list + map, list only or map only. The list can sit on the left or right, and the panel can be resized.
- Row or grid cards, comfortable or compact density.
- Market snapshot panel, suburb on cards and photo previews on hover can each be toggled.
- Compact or full prices; land in m², hectares or acres.
- Default deposit, interest rate and loan term.

**Keyboard shortcuts**: `/` search, `F` filters, `B`/`R`/`S` mode, `L` layout, `D` draw, `H` heatmap, `T` theme, `,` customise, `?` help.

## Stack

Next.js (App Router), React 19, TypeScript, Tailwind CSS v4, MapLibre GL, Supercluster, Zustand and Radix primitives. Base maps come from CARTO, OpenFreeMap and Esri.
