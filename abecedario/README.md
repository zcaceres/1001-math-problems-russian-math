# El abecedario de Penélope

A standalone, Spanish-first sound-exploration app for toddlers and their families.
The application lives in this directory; the repository's math content is untouched.

## Run

Use Bun 1.4.4 for package management and scripts. Keep Node.js 22.12+ installed
for the existing Vite, Vitest and Playwright CLIs.

```sh
cd abecedario
bun install --frozen-lockfile
bun run dev
```

`bun.lock` is the dependency lockfile; use `bun add` / `bun remove` when changing
dependencies and commit the updated lockfile. No npm lockfile is maintained.

Open the URL printed by Vite (normally http://localhost:5173). The dev server
also listens on the local network so an iPad on the same network can open the
computer's LAN address. Only use this on a trusted network.

```sh
bun run build
bun run preview
```

The production app is the static `dist/` directory. Relative asset URLs support
hosting in a subdirectory. No backend, API key, or external runtime service is
needed. Fonts, artwork and audio are bundled. It does not yet install a service
worker or promise offline operation.

## Deploy to Vercel

The Vercel project is `el-abecedario-de-penelope` in **Bold Conjectures**
(`zachs-projects-837afe60`). It uses the existing GitHub repository
`zcaceres/1001-math-problems-russian-math`.

`vercel.json` defines the framework, install command, build command and output
directory. Keep these in source control rather than overriding them separately.
The root directory and Node.js version are project-level settings:

| Setting | Value |
| --- | --- |
| Project name | `el-abecedario-de-penelope` |
| Root Directory | `abecedario` |
| Framework Preset | Vite |
| Install Command | `bun --version && bun install --frozen-lockfile` |
| Build Command | `bun run build` |
| Output Directory | `dist` |
| Node.js Version | `22.x` |
| Environment variables | None required |

The GitHub integration is connected. `main` is the production branch; pushes
to feature branches and pull requests create preview deployments. Prefer this
Git-based workflow for routine previews so each deployment matches a commit.

The app directory must exist on the branch being deployed. For production,
review and merge the app PR only after approval; a push to `main` triggers a
production deployment. Do not deploy the repository root or create a copy of
the app in a second repository.

Cloud builds use Vercel's bundled Bun directly and log its version before
installation. The frozen lockfile keeps dependency versions fixed; Bun 1.4.4
remains the locally tested version in `packageManager`. That field alone does
not pin the build container's Bun release. Avoid an extra `bunx bun@...`
bootstrap step in this environment. `bunVersion` controls function runtimes,
which this static app does not use.
See [Vercel's package-manager guidance](https://vercel.com/docs/package-managers)
and [root-directory settings](https://vercel.com/docs/builds/configure-a-build#root-directory).

No database, server functions, audio-generation service or API keys are needed
in Vercel. Existing recordings are deployed as static files. After deploying,
check the opening screen, letter/word playback and listening game on a physical
iPad in Safari. The current consonant recordings use letter names, as described below.

### Deploy a branch without promoting it

Run this from the **repository root**, not from `abecedario/`, because Vercel
applies the configured Root Directory to the uploaded source:

```sh
bunx vercel@67.0.0 deploy \
  --project el-abecedario-de-penelope \
  --scope zachs-projects-837afe60 \
  --local-config abecedario/vercel.json \
  --prod --skip-domain --yes
```

Vercel treats a new project's first deployment as production even when preview
is requested. `--skip-domain` stages that production build at its generated URL
without assigning production domains. Do not promote it or merge its PR until
that is explicitly approved. For later preview deployments, replace
`--prod --skip-domain` with `--environment preview`.

The repository's `.vercelignore` excludes the math source, local builds, test
reports and environment files from CLI uploads. The project also excludes files
outside `abecedario/` from the cloud build. Using `--project` avoids writing local
Vercel link metadata. CLI 67 is run through Bun without changing a globally
installed CLI. Keep deployment protection enabled; the generated URL may ask
you to sign in to the project's Vercel workspace.

## The experience

- **Brief opening:** the app name appears with a small growing sprout and gently
  staggered letters, then fades into exploration after 2.4 seconds. It plays once
  per page load, not when changing activities. Tap anywhere to skip; keyboard
  users can Tab to the entry button and press Enter or Space. Reduced motion
  shows a static title for 0.6 seconds instead. The opening is silent and keeps
  the underlying activity inaccessible until it finishes.
- **Full-screen canvas:** the child's screen contains only the current activity,
  large touch targets, and quiet navigation. There is no header, footer, letter
  shelf, decorative copy, or scrolling through the main activity.
- **Explorar:** one large letter and one familiar illustration. Tap the letter
  to hear its recorded reading, or the picture to hear the word. The bottom arrows move
  between letters; small dots indicate position. No reading is required.
- **Collapsible options:** the subtle three-dot button opens a native popover
  for activities, collections, direct letter selection, sound, and family
  controls. Selecting an option, tapping outside, or pressing Escape closes it.
  It stays out of the way while a child is using the activity.
- **Small collections:** the five vowels first; `m`, `p`, `s`, and `l` in a
  separate introductory consonant group. The complete 27-letter alphabet is
  deliberately not exposed in this first version.
- **Escuchar y encontrar:** listen, then choose between two letters. Trying the
  other letter repeats the target sound without punishment. A correct answer
  plays the word and shows a check; the next arrow starts another round.
  Feedback remains available to screen readers without requiring a child to
  read instructions. No autoplay, timers,
  scores, streaks, loud rewards or endless automatic progression.
- **Para familias:** hold the button for two seconds to access lowercase/
  uppercase preferences and the recording note. This is a gentle
  toddler guard, not a security boundary. Space or Enter also supports the hold.
- **Sound:** only one clip plays at a time. Navigation, opening settings, muting
  and backgrounding the page stop playback. Muting suppresses navigation audio;
  explicitly tapping a letter/picture or the listening button turns sound back
  on. Failed playback has a visible retry message.
- **Privacy:** no accounts, ads, analytics or third-party requests. The only
  stored preference is letter case, in this browser's `localStorage`. Blocking
  storage does not prevent use.

The interface supports touch, keyboard focus, screen readers, system reduced
motion, phones and tablets in both orientations, and device safe areas. The
popover requires a modern browser (Safari/iPadOS 17+ or current Chromium).
This fills the browser viewport; it does not force the browser's fullscreen API.
Listening remains an inherently auditory activity;
the exploration mode also presents the letter, word and illustration visually.

## Human-recorded audio

All **18 audio clips** come from the supplied `abecedario-recording.m4a`.
No synthesized voices, generated tones or browser speech synthesis remain.

The complete spoken readings are preserved. As approved for this version,
**m, p, s and l say “eme,” “pe,” “ese” and “ele”**, not isolated consonant
phonemes. Both exploration and the listening activity use these recordings.
The family note explains this; isolated sounds can be recorded later.
Human recording does not imply that the audio has been reviewed by an educator.

Each clip is cut at surrounding pauses, peak-matched to -6 dBFS before encoding,
and given 5 ms edge fades in the pauses to avoid clicks. Export is mono, 44.1 kHz,
128 kbps MP3. There are no pitch changes, time stretching or synthesized
replacements. Source-device metadata is not copied into the exported clips.

The original recording stays **outside the repository**, unchanged. Only the
selected clips are shipped. `scripts/audio-sources/recording.json` records its
SHA-256, the transcripts and cut times in decoded PCM seconds.
`recording-checksums.json` records the recipe fingerprint and exported clip
hashes, durations and peaks so tests catch missing, stale or mismatched audio.

| Letter | Letter recording | Word |
| --- | --- | --- |
| a | `a.mp3` | `abeja.mp3` |
| e | `e.mp3` | `elefante.mp3` |
| i | `i.mp3` | `iglu.mp3` (spoken “iglú”) |
| o | `o.mp3` | `oso.mp3` |
| u | `u.mp3` | `uvas.mp3` |
| m | `m.mp3` (“eme”) | `manzana.mp3` |
| p | `p.mp3` (“pe”) | `pato.mp3` |
| s | `s.mp3` (“ese”) | `sol.mp3` |
| l | `l.mp3` (“ele”) | `luna.mp3` |

### Regenerating the clips

From `abecedario/`, with Python 3 and `ffmpeg` installed:

```sh
python3 scripts/split-recording.py /path/to/abecedario-recording.m4a
```

The script verifies the source fingerprint, renders and checks all clips in a
temporary directory, then replaces `public/audio/*.mp3` and updates the clip
checksums. It does not modify or copy the original recording. A different source
file is rejected before any app audio changes. Recheck the cuts and update the
recipe deliberately when a new recording is supplied; do not reuse timestamps
blindly. Commit the recipe, generated checksums and exported clips together.
Raw M4A recordings are excluded from Git in this app and from Vercel uploads.

The source recording and conversion tools are **not** needed to run, test,
build or deploy the app. The former placeholder generator and synthetic source
clips have been removed so they cannot accidentally overwrite the human voice.

## Structure and a future iPad app

```text
src/content/letters.ts       Pure letter/collection data, no web dependencies
src/domain/listening.ts      Pure two-choice activity rules
src/audio/player.ts          AudioPlayer port and browser implementation
src/platform/assets.ts      Web-specific bundled-asset resolution
src/components/             Reusable interface pieces
src/App.tsx                  Activity state and web UI
public/images/               Original, scalable textured SVG illustrations
public/audio/                Replaceable MP3 recordings
```

A Capacitor shell can reuse the web UI and local assets. A later React Native
or SwiftUI app can reuse the content specification and audio assets, retain the
activity rules, and replace the browser player with a native audio adapter.
The web UI is not presented as a completed native application.

To expand toward all 27 letters, add reviewed entries to the content module,
matching illustration/audio assets, and small staged collections. Handle
context-dependent sounds (`c`, `g`, `r`, etc.) explicitly rather than incorrectly
assigning one universal sound to every letter. The current nine intentionally
avoid those complications.

## Validation

```sh
bun run build                  # Strict TypeScript and production bundle
bun run test                   # Content, activity rules, audio lifecycle
bunx playwright install chromium webkit
bun run test:e2e               # Desktop Chromium, iPad WebKit, phone Chromium
bun audit
```

Use `bun run test`, not `bun test`: the app keeps its existing Vitest suite
rather than switching to Bun's built-in test runner.

If Chrome is already installed, `PLAYWRIGHT_CHANNEL=chrome bun run test:e2e`
uses it for the Chromium projects; the iPad project still uses WebKit.

Browser tests exercise real MP3 playback, navigation, both collections, listening
retries, family controls, focus restoration, persisted and blocked storage,
missing-audio recovery, image loading, popover dismissal, touch interaction,
scroll-free layouts in both orientations, the opening animation and its skip/
reduced-motion behavior, and automated WCAG accessibility checks. Emulation is
not a substitute for final testing on a physical iPad or review of the sounds
by a Spanish educator.

## Asset credits

The nine SVG illustrations and interface icons were made for this project.
DM Sans, Fraunces and Quicksand are self-hosted under the SIL Open Font License;
their licenses are included alongside the font files in `src/assets/`.
