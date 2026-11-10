# Image briefs (for Codex)

Images the site needs that have **not** been generated yet. For each entry, generate the image,
save it at the exact path, then run `npm run build`. The site picks each file up automatically;
until a file exists, the page falls back to the photo listed under "Fallback".

General rules for every image:
- **WebP**, exact pixel size given, sRGB, quality ~80, under 400 KB.
- Photorealistic industrial / recycling-yard photography, natural light, believable detail.
- **No text, no letters or numbers, no logos, no watermarks, no brand names, no flags.**
- No people's faces in focus (workers in hi-vis are fine at a distance or from behind).
- Brand colours are deep green (#14532d / #2a7a4b) and safety yellow (#f8c537): small touches
  (a yellow excavator, green-painted steel, hi-vis) are welcome, never a colour cast.

---

## Homepage banner (hero slideshow)

Used full-width behind white text. On desktop the text sits on the **left ~45%**; on phones the
image is cropped to a tall **centre strip** (~30% of the width). So for every banner:
- keep the **main subject in the centre-right**, with the centre third still showing the subject;
- keep the **left side calm and darker** (shadow, out-of-focus background, sky) so text stays readable;
- the site adds a dark gradient on top, so don't make the image itself dark overall.

Size: **2400 × 1200 px** (2:1), WebP.

### 1. Metal scrap
- **Path:** `public/images/hero/hero-metal-scrap.webp`
- **Fallback (current):** `/media/2026/01/steel-rail-scrap-seo-1200x1200-1.jpg`
- **Alt text (already set):** Used rails and HMS steel scrap
- **Prompt:**
  > Wide photograph of a large outdoor scrap metal yard at golden hour: a towering, orderly pile of heavy melting steel scrap and cut railway rails in rust browns and steel greys fills the centre-right of the frame, a yellow material-handling grab crane partly visible behind it, soft dust in the warm light. The left third of the frame falls into soft shadow and an out-of-focus background of stacked scrap bales under an overcast sky, calm and uncluttered. Shot on a 35mm lens at eye level, shallow depth of field on the left, crisp detail on the metal textures, realistic, high dynamic range. No text, no logos, no people in focus.

### 2. Metal ingots
- **Path:** `public/images/hero/hero-metal-ingots.webp`
- **Fallback (current):** `/media/2025/10/copper-inqot.jpeg`
- **Alt text (already set):** Stacked copper ingots
- **Prompt:**
  > Wide photograph inside a clean metals warehouse: neat interlocking stacks of copper and aluminium ingots on steel pallets in the centre-right, the copper glowing warm orange next to the cool silver aluminium, strapping bands visible. The left third shows the dim, softly blurred warehouse aisle with high racking and a faint shaft of daylight, dark and calm. Industrial overhead lighting, 50mm lens, slight low angle, realistic metallic reflections, high detail. No text, no stamps or markings on the ingots, no logos.

### 3. Timber logs
- **Path:** `public/images/hero/hero-timber-logs.webp`
- **Fallback (current):** `/media/2025/10/larch-logs-scaled-1.jpg`
- **Alt text (already set):** Stacked larch wood logs
- **Prompt:**
  > Wide photograph of a timber export yard: a long, tidy stack of large hardwood logs with their cut ends facing the camera in the centre-right, showing warm growth rings in honey and reddish tones, a few logs with bark. The left third is a softly blurred background of a port yard with stacked shipping containers in muted green and grey under a pale morning sky. Natural soft light, 35mm lens, realistic wood texture, gentle depth of field. No text, no paint marks or numbers on the logs, no logos.

### 4. Copper cable & wire scrap
- **Path:** `public/images/hero/hero-copper-cable.webp`
- **Fallback (current):** `/media/2026/01/insulated-copper-wire-scrap-seo-1200x1200-1.jpg`
- **Alt text (already set):** Insulated copper cable scrap
- **Prompt:**
  > Wide close-up photograph of a bale and loose pile of recycled copper wire and cut insulated power cables in the centre-right: bright stripped copper strands in orange and gold beside thick black cable sections showing copper cores in cross-section. The left third fades into a dark, out-of-focus recycling warehouse background with soft bokeh from overhead lights. Moody industrial lighting with a warm key light on the copper, 85mm lens, shallow depth of field, very detailed, realistic. No text, no logos, no labels on the cables.

### 5. Plastic scrap
- **Path:** `public/images/hero/hero-plastic-scrap.webp`
- **Fallback (current):** `/media/2026/01/clear_pet_scrap_seo_1200.jpg`
- **Alt text (already set):** Clear PET plastic scrap
- **Prompt:**
  > Wide photograph in a plastics recycling facility: large compressed bales of clear and light-blue PET bottles and rolled LDPE film stacked in the centre-right, with a heap of clean shredded plastic flakes in the foreground catching the light. The left third is a softly blurred, darker view down the facility with a conveyor line and a forklift in safety yellow far in the background. Bright but soft industrial daylight from high windows, 35mm lens, realistic, crisp detail on the plastic textures. No text, no labels or brand names on bottles, no logos.
