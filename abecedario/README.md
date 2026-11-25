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
| Install Command | `bunx bun@1.4.4 install --frozen-lockfile` |
| Build Command | `bunx bun@1.4.4 run build` |
| Output Directory | `dist` |
| Node.js Version | `22.x` |
| Environment variables | None required |

The app directory must exist on the branch being deployed. For production,
review and merge the app PR first, then use `main` as the production branch.
Once the GitHub integration is connected, subsequent pull requests can receive
preview deployments and pushes to the production branch trigger production
deployments. Import the existing repository; do not deploy the repository root
or create a copy of the app in a second repository.

The two commands explicitly pin Bun for both installation and building.
Vercel detects `bun.lock`, but its default Bun release comes from the build
container; `packageManager` alone does not pin that release. `bunVersion`
controls function runtimes, which this static app does not use.
See [Vercel's Bun version guidance](https://vercel.com/docs/package-managers#pinning-a-bun-version)
and [root-directory settings](https://vercel.com/docs/builds/configure-a-build#root-directory).

No database, server functions, audio-generation service or API keys are needed
in Vercel. Existing recordings are deployed as static files. After deploying,
check the opening screen, letter/word playback and listening game on a physical
iPad in Safari. The audio remains prototype material as described below.

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
  to hear its sound, or the picture to hear the word. The bottom arrows move
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
  uppercase preferences and the prototype-audio disclosure. This is a gentle
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

## Important: temporary audio

**All shipped audio is prototype material, not reviewed phonics instruction.**
The family area states this explicitly. Do not use this build as finished
educational material until the recordings and examples have been reviewed.

- Words and the five vowels were synthesized using the local macOS **Paulina
  (Spanish (Mexico))** voice.
- The four consonants are now **speech-derived clips of the same Mexican Spanish
  voice**, not generated musical tones or white noise. `/m/` comes from a spoken
  “mmm”; `/p/`, `/s/`, and `/l/` are cropped from the beginnings of “papá,” “sopa,”
  and “luna,” before the following vowel. `/p/` is deliberately a brief release,
  not a sustained tone, “pe,” or “puh.” The short `/s/` and `/l/` clips use a
  small pitch-preserving slowdown.
- The exact source recordings, hashes and crop boundaries are checked in under
  `scripts/audio-sources/`. This prevents changes to an installed OS voice from
  silently shifting a crop into a vowel. These are still **unreviewed TTS-derived
  placeholders**, not recordings by a human Spanish educator.
- No browser speech synthesis is used. Playback uses the bundled MP3 files,
  avoiding differences between installed device voices.

### Replacing the audio

Replace the files in `public/audio/`, keeping the filenames:

| Letter | Isolated sound | Word |
| --- | --- | --- |
| a | `a.mp3` | `abeja.mp3` |
| e | `e.mp3` | `elefante.mp3` |
| i | `i.mp3` | `iglu.mp3` (spoken “iglú”) |
| o | `o.mp3` | `oso.mp3` |
| u | `u.mp3` | `uvas.mp3` |
| m | `m.mp3` | `manzana.mp3` |
| p | `p.mp3` | `pato.mp3` |
| s | `s.mp3` | `sol.mp3` |
| l | `l.mp3` | `luna.mp3` |

Use a consistent Latin American Spanish speaker and comfortable, matched
volume. Record the **phoneme, not the letter's name**; do not add an extra vowel
to consonants. Have a Spanish early-literacy educator review the isolated
sounds and words. After review, update the disclosure in
`src/components/FamilyDialog.tsx` and this document to describe the actual
recordings.

For development only, `python3 scripts/generate-placeholder-audio.py`
regenerates the word/vowel placeholders on macOS with the Paulina voice and
rebuilds consonants from their pinned source recordings using `ffmpeg`.
Add `--consonants-only` to rebuild only the four consonants (requires `ffmpeg`,
not macOS or `say`). Running either command overwrites its corresponding bundled
audio. It is **not** required to run or build the app. When replacing the source
speech, inspect the phoneme boundaries again; do not reuse crop times blindly.

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
