const { test, expect } = require('@playwright/test');

// PIN'i atlayıp uygulamayı açan yardımcı
async function unlockApp(page) {
  await page.goto('/');
  const already = await page.evaluate(() => localStorage.getItem('bb_pin_ok'));
  if (already !== '1') {
    await page.locator('#pinOverlay button:has-text("2")').click();
    await page.locator('#pinOverlay button:has-text("1")').click();
    await page.locator('#pinOverlay button:has-text("0")').click();
    await page.locator('#pinOverlay button:has-text("5")').click();
    await page.waitForTimeout(600);
  }
}

test.describe('PIN Kilidi', () => {
  test('uygulama açılır ve PIN ekranı görünür', async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
    await expect(page.locator('#pinOverlay')).toBeVisible();
    await expect(page.locator('#pinOverlay')).not.toHaveClass(/hidden/);
  });

  test('doğru PIN uygulamayı açar', async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
    await page.locator('#pinOverlay button:has-text("2")').click();
    await page.locator('#pinOverlay button:has-text("1")').click();
    await page.locator('#pinOverlay button:has-text("0")').click();
    await page.locator('#pinOverlay button:has-text("5")').click();
    await page.waitForTimeout(600);
    await expect(page.locator('#page-emzirme')).toBeVisible();
  });

  test('yanlış PIN hata gösterir', async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
    await page.locator('#pinOverlay button:has-text("1")').click();
    await page.locator('#pinOverlay button:has-text("1")').click();
    await page.locator('#pinOverlay button:has-text("1")').click();
    await page.locator('#pinOverlay button:has-text("1")').click();
    await page.waitForTimeout(400);
    await expect(page.locator('#pinError')).not.toBeEmpty();
  });

  test('daha önce giriş yapıldıysa PIN atlanır', async ({ page }) => {
    await page.evaluate(() => { localStorage.setItem('bb_pin_ok', '1'); });
    await page.goto('/');
    await expect(page.locator('#pinOverlay')).toHaveClass(/hidden/);
  });
});

test.describe('Emzirme Sayacı', () => {
  test('sol tarafa basınca sayaç başlar', async ({ page }) => {
    await unlockApp(page);
    await page.locator('#leftBtn').click();
    await expect(page.locator('#activeSection.running')).toBeVisible();
    await expect(page.locator('#stopBtn')).toBeVisible();
    await page.waitForTimeout(1500);
    const time = await page.locator('#leftTime').textContent();
    expect(time).not.toBe('00:00');
  });

  test('durdurunca geçmişe kayıt düşer', async ({ page }) => {
    await unlockApp(page);
    await page.locator('#leftBtn').click();
    await page.waitForTimeout(1000);
    await page.locator('#stopBtn').click();
    await expect(page.locator('#feedHistory .hi').first()).toBeVisible();
  });
});

test.describe('Bez Takibi', () => {
  test('ıslak bez kaydı eklenir', async ({ page }) => {
    await unlockApp(page);
    await page.locator('.tab:has-text("Bez")').click();
    await page.locator('button:has-text("Islak")').click();
    await expect(page.locator('#diaperHistory .hi').first()).toBeVisible();
    await expect(page.locator('#diaperCd')).not.toHaveText('—');
  });
});

test.describe('Karanlık Mod', () => {
  test('dark mode toggle çalışır', async ({ page }) => {
    await unlockApp(page);
    await page.locator('#darkBtn').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.locator('#darkBtn').click();
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'dark');
  });
});

test.describe('Sekme Geçişleri', () => {
  test('tüm sekmeler açılır', async ({ page }) => {
    await unlockApp(page);
    const tabs = ['Bez', 'Uyku', 'Kilo/Boy', 'Analiz', 'Ateş', 'İğne', 'Notlar', 'Ayarlar'];
    for (const tab of tabs) {
      await page.locator(`.tab:has-text("${tab}")`).click();
      await page.waitForTimeout(200);
    }
  });
});
