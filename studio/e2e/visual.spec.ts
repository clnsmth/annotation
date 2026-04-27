import { test, expect } from '@playwright/test';
import mockTargets from './mock-targets.json' assert { type: 'json' };
test.describe('Annotation Studio Visual Regression', () => {
    test('verifies UI components match baseline snapshots', async ({ page }) => {
        // 1. Session Persistence Warning (Pre-landing)
        await page.goto('/');
        await expect(page.locator('text=Welcome to EDI Annotation Studio')).toBeVisible();
        await expect(page).toHaveScreenshot('session-persistence-modal.png', { fullPage: true });
        
        // Dismiss the modal to reach the Landing Screen
        await page.getByRole('button', { name: 'Got it' }).click();

        // 2. Landing Screen (Upload)
        await expect(page.locator('text=Upload EML Metadata')).toBeVisible();
        await expect(page).toHaveScreenshot('landing-screen.png', { fullPage: true });

        // 2. Editor Screen (with example data)
        // Mock targets endpoint since backend is not running
        await page.route('http://localhost:8001/api/documents/targets', async route => {
            await route.fulfill({ json: mockTargets });
        });

        await page.getByRole('button', { name: 'Load Example Data' }).click();
        await expect(page.getByRole('button', { name: 'Review & Export' })).toBeVisible({ timeout: 10000 });

        // Expand the accordion to ensure consistent rendering height
        await page.getByText('SurveyResults', { exact: true }).first().click();
        await expect(page).toHaveScreenshot('editor-screen.png', { fullPage: true });

        // 3. Add Custom Annotation Screen (Expanded row)
        await page.getByRole('button', { name: 'Add Custom Annotation' }).first().click();
        await expect(page.getByPlaceholder('Property Label')).toBeVisible();
        await expect(page).toHaveScreenshot('add-custom-annotation.png', { fullPage: true });

        // Close the custom annotation to keep screen clean
        // It doesn't have a close button but it closes when we submit or we can just open suggest term

        // 4. Suggest Term Modal
        await page.getByRole('button', { name: 'Suggest New Term' }).click();
        await expect(page.locator('text=Propose New Ontology Term')).toBeVisible();
        await expect(page).toHaveScreenshot('suggest-term-modal.png', { fullPage: true });

        // Close modal
        await page.getByRole('button', { name: 'Cancel' }).last().click();

        // 5. Export Screen
        await page.getByRole('button', { name: 'Review & Export' }).click();
        await expect(page.locator('text=Annotation Complete!')).toBeVisible();
        await expect(page).toHaveScreenshot('export-screen.png', { fullPage: true });

        // 6. Start New Annotation Screen (Dialog)
        await page.getByRole('button', { name: 'Annotate Another File' }).click();
        await expect(page.locator('text=Start New Annotation?')).toBeVisible();
        await expect(page).toHaveScreenshot('start-new-annotation-modal.png', { fullPage: true });
    });
});
