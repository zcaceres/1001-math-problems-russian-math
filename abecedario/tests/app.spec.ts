import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { collections, getCollection } from '../src/content/letters'

async function openMenu(page: Page) {
  await page.getByRole('button', { name: 'Menú de actividades' }).click()
  await expect(page.getByRole('dialog', { name: 'El abecedario de Penélope', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Menú de actividades' })).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('button', { name: 'Cerrar menú' })).toBeFocused()
}

async function selectMenuOption(page: Page, name: string) {
  await openMenu(page)
  await page.getByRole('button', { name, exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'El abecedario de Penélope', exact: true })).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Menú de actividades' })).toHaveAttribute('aria-expanded', 'false')
}

async function unlockFamilies(page: Page) {
  await selectMenuOption(page, 'Para familias')
  const button = page.getByRole('button', { name: 'Mantén presionado para entrar' })
  await button.focus()
  await page.keyboard.down('Space')
  await expect(page.getByRole('heading', { name: 'Crecer a su ritmo.' })).toBeVisible()
  await page.keyboard.up('Space')
}

test.beforeEach(async ({ page }) => {
  // Observe real media playback; do not mock audio or bypass autoplay policies.
  await page.addInitScript(() => {
    const NativeAudio = window.Audio
    window.Audio = class extends NativeAudio {
      constructor(source?: string) {
        super(source)
        this.addEventListener('playing', () => sessionStorage.setItem('last-audio', this.currentSrc))
      }
    }
  })
  await page.goto('/')
  await expect(page.locator('.title-screen')).toHaveCount(0)
})

test('opens with only the core interaction, navigation and a collapsed menu', async ({ page }) => {
  await expect(page).toHaveTitle('El abecedario de Penélope')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Explorar los sonidos')
  await expect(page.getByRole('button')).toHaveCount(5)
  await expect(page.getByRole('button', { name: 'Para familias' })).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Escuchar y encontrar', exact: true })).not.toBeVisible()
  await expect(page.getByRole('img', { name: 'Letra 1 de 5' })).toBeVisible()
  await expect(page.locator('header, footer')).toHaveCount(0)
  await expect(page.getByRole('img', { name: 'abeja', exact: true })).toBeVisible()
  await expect.poll(() => page.locator('img').evaluateAll((images: HTMLImageElement[]) => images.every((image) => image.complete && image.naturalWidth > 0))).toBe(true)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  expect(await page.evaluate(() => sessionStorage.getItem('last-audio'))).toBeNull()
})

test('plays separate human letter and word recordings on deliberate taps', async ({ page }) => {
  await page.getByRole('button', { name: 'Escuchar la letra a', exact: true }).click()
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('last-audio'))).toContain('/audio/a.mp3')
  await page.getByRole('button', { name: 'Escuchar la palabra abeja' }).click()
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('last-audio'))).toContain('/audio/abeja.mp3')
  await expect(page.getByRole('status')).not.toContainText('No pudimos')
})

test('navigates both ways and changes the letter collection', async ({ page }) => {
  await page.getByRole('button', { name: 'Letra siguiente' }).click()
  await expect(page.getByRole('button', { name: 'Escuchar la letra e', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Letra anterior' }).click()
  await page.getByRole('button', { name: 'Letra anterior' }).click()
  await expect(page.getByRole('img', { name: 'uvas', exact: true })).toBeVisible()
  await selectMenuOption(page, 'Primeras consonantes')
  await expect(page.getByRole('img', { name: 'Letra 1 de 4' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Escuchar la letra m', exact: true })).toBeVisible()
  await selectMenuOption(page, 'Explorar s, sol')
  await expect(page.getByRole('img', { name: 'sol', exact: true })).toBeVisible()
  await selectMenuOption(page, 'Las vocales')
  await expect(page.getByRole('button', { name: 'Escuchar la letra a', exact: true })).toBeVisible()
})

test('mute stops audio and an explicit listen action restores it', async ({ page }) => {
  await selectMenuOption(page, 'Silenciar sonido')
  await openMenu(page)
  await expect(page.getByRole('button', { name: 'Activar sonido' })).toBeVisible()
  await page.getByRole('button', { name: 'Cerrar menú' }).click()
  await page.getByRole('button', { name: 'Letra siguiente' }).click()
  expect(await page.evaluate(() => sessionStorage.getItem('last-audio'))).toBeNull()
  await page.getByRole('button', { name: 'Escuchar la letra e', exact: true }).click()
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('last-audio'))).toContain('/audio/e.mp3')
  await openMenu(page)
  await expect(page.getByRole('button', { name: 'Silenciar sonido' })).toBeVisible()
})

test('listening activity allows retry and advances without scores or timers', async ({ page }) => {
  await selectMenuOption(page, 'Escuchar y encontrar')
  await expect(page.locator('.choice-card')).toHaveCount(2)
  await expect(page.locator('.choice-card').first()).toHaveAttribute('aria-disabled', 'true')
  await page.getByRole('button', { name: 'Escuchar la letra que buscamos' }).click()
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('last-audio'))).toMatch(/\/audio\/[aeiou]\.mp3$/)
  const target = await page.evaluate(() => sessionStorage.getItem('last-audio')!.match(/\/([aeiou])\.mp3$/)![1])
  const wrong = page.locator('.choice-card').filter({ hasNotText: target })
  await wrong.click()
  await expect(page.locator('.listen-content [aria-live]')).toHaveText('Escuchemos una vez más. Tú puedes.')
  await page.getByRole('button', { name: `Elegir ${target}`, exact: true }).click()
  await expect(page.locator('.found-check')).toBeVisible()
  await expect(page.locator('.listen-content [aria-live]')).toHaveText('¡La encontraste!')
  await page.getByRole('button', { name: 'Otro sonido' }).click()
  await expect(page.locator('.found-check')).toHaveCount(0)
  await expect(page.locator('.listen-content [aria-live]')).toHaveText('Primero, toca para escuchar')
  await page.getByRole('button', { name: 'Escuchar la letra que buscamos' }).click()
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('last-audio'))).not.toContain(`/audio/${target}.mp3`)
})

test('family controls require a hold and preserve case preferences', async ({ page }) => {
  await selectMenuOption(page, 'Para familias')
  await page.getByRole('button', { name: 'Mantén presionado para entrar' }).click()
  await expect(page.getByText('Así vemos las letras')).not.toBeVisible()
  await page.getByRole('button', { name: 'Cerrar espacio para familias' }).click()
  await unlockFamilies(page)
  await expect(page.getByText('Grabaciones de voz', { exact: true })).toBeVisible()
  await expect(page.locator('.audio-note')).toContainText('«eme», «pe», «ese» y «ele»')
  await page.getByRole('button', { name: /ABC Mayúsculas/ }).click()
  await page.getByRole('button', { name: 'Volver a descubrir' }).click()
  await expect(page.locator('.hero-letter')).toHaveText('A')
  await expect(page.getByRole('button', { name: 'Menú de actividades' })).toBeFocused()
  await page.reload()
  await expect(page.locator('.title-screen')).toHaveCount(0)
  await expect(page.locator('.hero-letter')).toHaveText('A')
  await selectMenuOption(page, 'Para familias')
  await expect(page.getByRole('heading', { name: 'Un espacio para familias.' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Menú de actividades' })).toBeFocused()
})

test('shows a retryable message when audio cannot load', async ({ page }) => {
  await page.route('**/audio/a.mp3', (route) => route.abort())
  await page.getByRole('button', { name: 'Escuchar la letra a', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('No pudimos reproducir')
  await page.unroute('**/audio/a.mp3')
  await page.getByRole('button', { name: 'Escuchar la letra a', exact: true }).click()
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('last-audio'))).toContain('/audio/a.mp3')
  await expect(page.getByRole('status')).not.toContainText('No pudimos')
})

test('all nine human-recorded pairs load and play without runtime errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  for (const collection of ['vowels', 'consonants'] as const) {
    await selectMenuOption(page, collections[collection].label)
    for (const letter of getCollection(collection)) {
      await expect(page.locator('.hero-letter')).toHaveText(letter.id)
      await expect(page.locator('.hero-illustration')).toBeVisible()
      await expect.poll(() => page.locator('.hero-illustration').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)
      for (const [label, audio] of [
        [`Escuchar la letra ${letter.id}`, letter.sound],
        [`Escuchar la palabra ${letter.word}`, letter.wordAudio],
      ]) {
        await page.evaluate(() => sessionStorage.removeItem('last-audio'))
        await page.getByRole('button', { name: label, exact: true }).click()
        await expect.poll(() => page.evaluate(() => sessionStorage.getItem('last-audio'))).toContain(`/audio/${audio}.mp3`)
      }
      await page.getByRole('button', { name: 'Letra siguiente' }).click()
    }
  }
  expect(errors).toEqual([])
})

test('remains usable when preference storage is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage is blocked') } })
  })
  await page.reload()
  await expect(page.locator('.title-screen')).toHaveCount(0)
  await expect(page.locator('.hero-letter')).toHaveText('a')
  await unlockFamilies(page)
  await page.getByRole('button', { name: /ABC Mayúsculas/ }).click()
  await page.getByRole('button', { name: 'Volver a descubrir' }).click()
  await expect(page.locator('.hero-letter')).toHaveText('A')
})

test('exploration, listening, popover and family settings pass automated accessibility checks', async ({ page }) => {
  test.setTimeout(60000)
  const check = async () => {
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    expect(results.violations.map((violation) => ({
      id: violation.id,
      nodes: violation.nodes.map((node) => ({ target: node.target, failure: node.failureSummary })),
    }))).toEqual([])
  }
  for (const collection of ['Las vocales', 'Primeras consonantes']) {
    await selectMenuOption(page, collection)
    const count = collection === 'Las vocales' ? 5 : 4
    for (let index = 0; index < count; index++) {
      await check()
      await page.getByRole('button', { name: 'Letra siguiente' }).click()
    }
  }
  await openMenu(page)
  await check()
  await page.getByRole('button', { name: 'Escuchar y encontrar', exact: true }).click()
  await page.getByRole('button', { name: 'Escuchar la letra que buscamos' }).click()
  await check()
  await unlockFamilies(page)
  await check()
})

test('both activities fit the viewport without scrolling in either orientation', async ({ page }) => {
  for (const [width, height] of [[1024, 768], [768, 1024], [320, 568], [844, 390]]) {
    await page.setViewportSize({ width, height })
    for (const mode of ['Explorar', 'Escuchar y encontrar']) {
      await selectMenuOption(page, mode)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true)
      for (const button of await page.getByRole('button').all()) {
        const box = await button.boundingBox()
        expect(box).not.toBeNull()
        expect(box!.x).toBeGreaterThanOrEqual(0)
        expect(box!.y).toBeGreaterThanOrEqual(0)
        expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1)
        expect(box!.y + box!.height).toBeLessThanOrEqual(height + 1)
        expect(box!.width).toBeGreaterThanOrEqual(44)
        expect(box!.height).toBeGreaterThanOrEqual(44)
      }
    }
  }
})

test('popover dismisses by outside tap, Escape and close, preserving the current letter', async ({ page, browserName }) => {
  await page.getByRole('button', { name: 'Letra siguiente' }).click()
  await openMenu(page)
  await page.mouse.click(4, 100)
  await expect(page.getByRole('dialog', { name: 'El abecedario de Penélope', exact: true })).not.toBeVisible()
  await openMenu(page)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Menú de actividades' })).toBeFocused()
  await expect(page.getByRole('button', { name: 'Menú de actividades' })).toHaveAttribute('aria-expanded', 'false')
  // WebKit follows Safari's default: Option-Tab includes non-text controls.
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
  await expect(page.getByRole('button', { name: 'Escuchar la letra e', exact: true })).toBeFocused()
  await openMenu(page)
  await page.getByRole('button', { name: 'Cerrar menú' }).click()
  await expect(page.getByRole('button', { name: 'Menú de actividades' })).toBeFocused()
  await expect(page.locator('.hero-letter')).toHaveText('e')
})

test('touch users can play audio and select an activity from the popover', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Touch interaction is exercised by the iPad and phone projects.')
  await page.getByRole('button', { name: 'Escuchar la letra a', exact: true }).tap()
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('last-audio'))).toContain('/audio/a.mp3')
  await page.getByRole('button', { name: 'Menú de actividades' }).tap()
  await page.getByRole('button', { name: 'Escuchar y encontrar', exact: true }).tap()
  await expect(page.locator('.choice-card')).toHaveCount(2)
  await expect(page.getByRole('dialog', { name: 'El abecedario de Penélope', exact: true })).not.toBeVisible()
})

test('the full Spanish app name fits the menu on narrow screens', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await openMenu(page)
  await expect(page.getByRole('heading', { name: 'El abecedario de Penélope', exact: true })).toBeVisible()
  const menu = page.getByRole('dialog', { name: 'El abecedario de Penélope', exact: true })
  expect(await menu.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
  const title = await page.locator('#menu-title').boundingBox()
  const close = await page.getByRole('button', { name: 'Cerrar menú' }).boundingBox()
  expect(title!.x + title!.width).toBeLessThanOrEqual(close!.x)
  expect(close!.width).toBeGreaterThanOrEqual(44)
})
