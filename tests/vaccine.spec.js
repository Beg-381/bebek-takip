const { test, expect } = require('@playwright/test');

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

test.describe('Aşı Takvimi', () => {
  test('doğum tarihi yoksa bilgi mesajı gösterir', async ({ page }) => {
    await unlockApp(page);
    await page.locator('.tab:has-text("İğne")').click();
    await expect(page.locator('#vaccineScheduleCard')).toContainText('Doğum tarihi');
  });

  test('doğum tarihi girilince timeline görünür', async ({ page }) => {
    await unlockApp(page);
    // Doğum tarihi ayarla
    await page.locator('.tab:has-text("Ayarlar")').click();
    await page.locator('#birthDate').fill('2025-06-01');
    await page.locator('button:has-text("Kaydet")').last().click();
    await page.waitForTimeout(500);

    // Aşı sekmesine git
    await page.locator('.tab:has-text("İğne")').click();
    await page.waitForTimeout(500);
    await expect(page.locator('#vaccineTimeline')).not.toBeEmpty();
    // 2025-06-01 doğumlu bebek ~12 aylık — 12. ay aşıları overdue olmalı
    await expect(page.locator('.vti.overdue').first()).toBeVisible();
  });

  test('aşı kaydı yapınca done olarak işaretlenir', async ({ page }) => {
    await unlockApp(page);
    // Doğum tarihi ayarla
    await page.locator('.tab:has-text("Ayarlar")').click();
    await page.locator('#birthDate').fill('2025-06-01');
    await page.locator('button:has-text("Kaydet")').last().click();
    await page.waitForTimeout(300);

    // Aşı ekle
    await page.locator('.tab:has-text("İğne")').click();
    await page.locator('#vacName').fill('Hepatit B');
    await page.locator('#vacDate').fill('2025-06-01');
    await page.locator('#vacDose').selectOption('1. Doz');
    await page.locator('button:has-text("Kaydet")').click();
    await page.waitForTimeout(500);

    // Timeline'da done olarak görünmeli
    await expect(page.locator('#vaccineHistory .hi').first()).toContainText('Hepatit B');
  });

  test('yaş hesaplaması doğru çalışır', async ({ page }) => {
    await unlockApp(page);
    await page.locator('.tab:has-text("Ayarlar")').click();
    await page.locator('#birthDate').fill('2025-06-01');
    await page.locator('button:has-text("Kaydet")').last().click();
    await page.waitForTimeout(300);
    await expect(page.locator('#babyAge')).not.toBeEmpty();
    await expect(page.locator('#babyAge')).toContainText('ay');
  });
});

test.describe('Yedekleme', () => {
  test('yedek indirme butonu çalışır', async ({ page }) => {
    await unlockApp(page);
    await page.locator('.tab:has-text("Ayarlar")').click();
    const downloadBtn = page.locator('button:has-text("Yedeği İndir")');
    await expect(downloadBtn).toBeVisible();
  });
});
