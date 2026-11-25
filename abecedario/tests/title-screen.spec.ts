import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.use({ reducedMotion: 'no-preference' })

async function openWithPausedClock(page: Page) {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') })
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'))
  await page.goto('/')
}

test('animates the title, then opens exploration silently after a brief delay', async ({ page }) => {
  const audioRequests: string[] = []
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.endsWith('.mp3')) audioRequests.push(request.url())
  })
  await openWithPausedClock(page)
  await expect(page.getByRole('heading', { name: 'El abecedario de Penélope', exact: true })).toBeVisible()
  await expect(page.getByRole('button')).toHaveCount(1)
  await expect(page.locator('.app-shell')).toHaveAttribute('inert', '')
  await expect(page.locator('.title-letter')).toHaveCount(8)
  expect(await page.locator('.title-letter').first().evaluate((letter) => getComputedStyle(letter).animationName)).toBe('title-letter-arrive')

  await page.clock.runFor(2399)
  await expect(page.locator('.title-screen')).toHaveCount(1)
  await page.clock.runFor(1)
  await expect(page.locator('.title-screen')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Explorar los sonidos', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Escuchar el sonido de a', exact: true })).toBeVisible()
  await expect(page.locator('.app-shell')).not.toHaveAttribute('inert', '')
  expect(audioRequests).toEqual([])
})

test('a tap can skip the title without playing the letter underneath', async ({ page, isMobile }) => {
  const audioRequests: string[] = []
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.endsWith('.mp3')) audioRequests.push(request.url())
  })
  await openWithPausedClock(page)
  const skip = page.getByRole('button', { name: 'Entrar al abecedario' })
  if (isMobile) await skip.tap()
  else await skip.click()
  await expect(page.locator('.title-screen')).toHaveCount(0)
  await expect(page.locator('.hero-letter')).toHaveText('a')
  await page.clock.runFor(3000)
  expect(audioRequests).toEqual([])
})

test('keyboard entry moves focus into exploration and the title does not replay in menus', async ({ page, browserName }) => {
  await openWithPausedClock(page)
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
  await expect(page.getByRole('button', { name: 'Entrar al abecedario' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: 'Escuchar el sonido de a', exact: true })).toBeFocused()
  await page.getByRole('button', { name: 'Menú de actividades' }).click()
  await page.getByRole('button', { name: 'Escuchar y encontrar', exact: true }).click()
  await page.getByRole('button', { name: 'Menú de actividades' }).click()
  await page.getByRole('button', { name: 'Explorar', exact: true }).click()
  await expect(page.locator('.title-screen')).toHaveCount(0)
  await page.reload()
  await expect(page.locator('.title-screen')).toHaveCount(1)
})

test('reduced motion shows the complete static title and enters sooner', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openWithPausedClock(page)
  expect(await page.locator('.title-letter').first().evaluate((letter) => ({
    animation: getComputedStyle(letter).animationName,
    opacity: getComputedStyle(letter).opacity,
  }))).toEqual({ animation: 'none', opacity: '1' })
  await page.clock.runFor(599)
  await expect(page.locator('.title-screen')).toHaveCount(1)
  await page.clock.runFor(1)
  await expect(page.locator('.title-screen')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Escuchar el sonido de a', exact: true })).toBeVisible()
})

test('the opening cannot get stuck when fonts fail and animations are disabled', async ({ page }) => {
  await page.route('**/*.woff2', (route) => route.abort())
  await openWithPausedClock(page)
  await page.addStyleTag({ content: '* { animation: none !important; }' })
  await page.clock.runFor(2400)
  await expect(page.locator('.title-screen')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Escuchar el sonido de a', exact: true })).toBeVisible()
})

test('the opening fits phones and both tablet orientations and remains accessible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  // Hold only the opening deadline for the static audit. Freezing every timer
  // would also freeze Axe's own asynchronous checks. Timing is tested above.
  await page.addInitScript(() => {
    const setTimeout = window.setTimeout.bind(window)
    window.setTimeout = ((handler: TimerHandler, delay?: number, ...args: unknown[]) =>
      setTimeout(handler, delay === 600 ? 60000 : delay, ...args)) as typeof window.setTimeout
  })
  await page.goto('/')
  await expect(page.locator('.title-screen')).toHaveCount(1)
  for (const [width, height] of [[320, 568], [844, 390], [768, 1024], [1024, 768]]) {
    await page.setViewportSize({ width, height })
    const title = await page.locator('.title-composition').boundingBox()
    expect(title!.x).toBeGreaterThanOrEqual(0)
    expect(title!.y).toBeGreaterThanOrEqual(0)
    expect(title!.x + title!.width).toBeLessThanOrEqual(width)
    expect(title!.y + title!.height).toBeLessThanOrEqual(height)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true)
  }
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(results.violations.map((violation) => ({ id: violation.id, targets: violation.nodes.map((node) => node.target) }))).toEqual([])
  await expect(page.locator('.title-screen')).toHaveCount(1)
})
