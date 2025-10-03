## Urban Planner (NASA Hackathon) – Project Guide

This app gives city planners two things:

- City Insights (current conditions)
- Future Vision (forward-looking forecasts and planning tools)

It is built with Next.js (App Router), TailwindCSS, and a small set of chart/map libraries. Some views are powered by static demo data; when available, NASA-derived data is shown (clearly labeled). The goal is a clear, planner-friendly UI with rich visuals.

### How data flows

- City selection is stored in a cookie so the app opens on your last city.
- The main page (`app/page.js`) holds the selected country/city and renders one of three views:
  - City Insights
  - Future Vision
  - Urban Benchmarking
- Each view receives the selected city and renders its own dashboard.

### Where “current” data comes from (City Insights)

- For all cities, we ship static data for AQI, trends, land use, and quick stats.
- For cities with NASA sample data (e.g., New York, Mumbai), the app can show NASA-derived time series labeled “Real data”.
  - `hooks/use-nasa-data.js` wraps loading/transforming the NASA sample dataset for the charts/gauge.
  - `components/NASAPollutionChart.js` and `components/NASAAQIGauge.js` visualize those series.
  - Other cities fall back to static demo charts (`components/PollutionChart.js`, `components/AQIGauge.js`).
- The city map (`components/CityMap.js`):
  - In City Insights we render a clean “overview” with a simple boundary ring (no markers)
    by passing `mode="overview"`.
  - In detailed mode (used elsewhere), we add synthetic satellite-inspired markers/zones for Pollution/Heat/Flood layers to explain how overlays would look using NASA data (AOD/LST/GPM/SRTM).

### Where “future” data comes from (Future Vision)

- The Future Vision view is intentionally static/deterministic for now, but city-specific:
  - AQI forecast series are derived from the selected city’s historical trend and simple seasonal adjustments.
  - Heat Island growth estimates use the city’s heat score to produce LST and hotspot area projections.
  - Urban Sprawl projections use the city’s land-use split to create forward curves for Urban/Green/Other shares.
  - Planner Briefing text (What to Expect) is generated from per-city stats (pollution/heat/flood/green share).
  - The Risk Scenario Map contains a Baseline/Green Policy/Infra Growth toggle (UI only at present).
  - Site Suitability & Availability provides a simple form + map with static “Suitable/Conditional/Avoid” zones to illustrate how a siting workflow would feel.

### NASA datasets mentioned and how we use them

- We reference these NASA sources conceptually:
  - Air quality: MODIS/VIIRS AOD; TEMPO/OMI for trace gases
  - Heat: MODIS LST, Landsat thermal, ASTER temperature
  - Flood: GPM precipitation (rainfall), SRTM (elevation)
  - Land cover: Landsat (multi-year)
- In this repo:
  - Charts under “NASA” components use local sample data through `use-nasa-data`. They are labeled “Real data”.
  - All other visuals are static, derived from the selected city’s static info and mock datasets. These are labeled “Static”.

#### Datasets and Bands (what each raster means)

- MODIS AOD (e.g., MCD19A2 – MAIAC)
  - Key fields: `Optical_Depth_047` (AOD @ 0.47µm), `Optical_Depth_055` (AOD @ 0.55µm), `AOD_QA`/`AOD_Uncertainty`
  - Use: AOD (~550 nm) correlates with column aerosol load; we downscale/transform to AQI proxies for trend/forecast visuals
  - Resolution/tempo: 1 km, daily/8-day composites; global

- VIIRS AOD (Deep Blue/DT)
  - Key fields: `AOD_550_Dark_Target`, `AOD_550_Deep_Blue`, quality flags
  - Use: Complements MODIS AOD; better urban/peri-urban coverage in some cases
  - Resolution/tempo: 750 m–1 km, daily

- MODIS LST (e.g., MOD11A2/MYD11A2)
  - Key bands: `LST_Day_1km`, `LST_Night_1km` (Kelvin, scale factor), `QC_Day`/`QC_Night`
  - Use: Day/Night land surface temperature for heat island growth tracking and hotspot area estimation
  - Resolution/tempo: 1 km, 8‑day composites

- GPM IMERG (precipitation)
  - Key fields: `precipitationCal`, `precipitationUncal` (mm/hr), `precipitationAccumulation`
  - Use: Rainfall intensity/anomalies for flood susceptibility (paired with elevation/slope)
  - Resolution/tempo: ~0.1° (~10 km) down to ~0.1° gridded, half‑hourly/daily

- SRTM (elevation)
  - Key field: `elevation` (meters)
  - Use: Elevation/slope/flow direction derivations for runoff/flood risk and site screening
  - Resolution: 30 m (SRTM1) / 90 m (SRTM3)

- Landsat 8/9 (OLI/TIRS) – land cover & indices
  - Useful bands: `B2` Blue, `B3` Green, `B4` Red, `B5` NIR, `B6` SWIR1, `B7` SWIR2, `B10/B11` TIRS (thermal)
  - Common indices: NDVI = (NIR−Red)/(NIR+Red), NDBI = (SWIR−NIR)/(SWIR+NIR), NDWI = (Green−NIR)/(Green+NIR)
  - Use: Urban sprawl (impervious growth), green loss, thermal context
  - Resolution/tempo: 30 m (optical), 100 m (thermal resampled to 30 m), 16‑day

How these bands map to the app’s visuals

- AQI trend/forecast: AOD @ 0.55µm (MODIS/VIIRS) → aggregated over the urban extent → smoothed time series; compared to AQI bins
- Heat growth: MODIS LST Day/Night → anomalies and hotspot area (km²) tracked over years
- Flood susceptibility (concept/UI): GPM accumulation + SRTM slopes → zones (Low/Med/High) for explanation
- Sprawl: Landsat indices (NDVI↓, NDBI↑) → urban% vs green% time curves

### Key components and files

- `app/page.js`: app shell, city cookie handling, view switching, and passing props
- `components/CityInsights.js`: current status dashboard
- `components/FutureVision.js`: future forecasts, planner briefing, site suitability tool
- `components/UrbanBenchmarking.js`: benchmarking placeholder
- `components/Sidebar.js`: navigation and change city action
- `components/CityMap.js`: Leaflet map (overview and detailed modes)
- `components/PlannerSiteMap.js` + `PlannerSiteMapLeaflet.js`: site suitability map with colored zones
- Charts:
  - `components/NASAPollutionChart.js`, `components/NASAAQIGauge.js` (NASA sample data)
  - `components/PollutionChart.js`, `components/UrbanExpansionChart.js` (static/D3)
  - `components/ui/chart.jsx`: thin helpers for Recharts styling
- Hooks:
  - `hooks/use-nasa-data.js`: loads/transforms local NASA-like sample data, provides stats/trend
- Utilities:
  - `lib/cookies.js`: read/write selected city

### Libraries used and why

- Next.js (App Router): routing, server/client components
- TailwindCSS: fast, consistent styling
- Framer Motion: subtle entrance/transition animations
- Recharts: robust, responsive charts for line/area/bar overlays
- D3: custom charts (e.g., Urban Expansion visualization) and custom SVG work
- React Leaflet + Leaflet: interactive maps with overlays and markers
- lucide-react: lightweight icon set

### Design choices

- Clear labels: Every card shows a small badge “Static” or “Real data”.
- Planner-first copy: The Future Vision text focuses on “what, where, what to do next” rather than ML jargon.
- Scrollable cards: Charts and descriptions scroll within cards to keep the layout compact.
- Scenario selector lives in the map card to keep context visible.
- City selectors match between City Insights and Future Vision for consistency.

### How to run

```bash
npm install
npm run dev
# open http://localhost:3000
```

No secrets are required for the static demo. If you later add real APIs, keep keys in `.env.local` and read them via Next.js runtime config.

### How to add a new city

1. Add static info to the `MOCK_CITIES` object in `app/page.js` (AQI, trend, stats, land use).
2. (Optional) Provide NASA sample time series compatible with `use-nasa-data` if you want “Real data” charts.
3. The Future Vision charts/briefing will automatically derive city-specific projections from the static stats.

### How to swap the synthetic boundary with a real boundary

`CityMap` accepts `mode="overview"`. To use a real polygon:

- Load a GeoJSON for the city and pass the polygon coordinates into `CityMap` (you can extend the component to accept a `boundary` prop and render it instead of the synthetic ring).

### Directory layout (high level)

- `app/` – Next.js app router pages and API routes
- `components/` – UI components (dashboards, maps, charts)
- `hooks/` – custom React hooks
- `lib/` – helpers (cookies, utils)
- `public/` – static files and sample data

### Notes on NASA data processing (future work)

When connected to real datasets, preprocessing typically involves:

- GDAL/Rasterio: reprojection, resampling, tiling
- Feature engineering: NDVI, slopes, lags, rolling averages
- Models: ARIMA/LSTM for time series; GBM/RF for risk scoring; CNN/XGBoost for land cover/sprawl
- Storage/API: indexed by time/location; Next.js API routes can serve tiles/series

This demo includes the UI and data flow shape to plug these in later.

