import { test, expect } from '@playwright/test';

test.describe('Annotation Studio End-to-End', () => {
    test('completes the full annotation flow', async ({ page }) => {
        // 1. Navigate to the App
        await page.goto('/');

        // 2. Verify Upload Screen
        await expect(page.locator('text=Upload EML Metadata')).toBeVisible();

        // 3. Toggle AI Recommendations On
        // First, mock the backend response since we aren't running the fastAPI engine in E2E
        await page.route('http://localhost:8000/api/recommendations', async route => {
            const json = [
                {
                    id: 'cfe0601b-e76b-4f34-8a5a-655db3b0491c', // ID of SurveyID attribute in example_eml.xml
                    recommendations: [
                        { label: 'E2E Survey ID Term', uri: 'http://example.com/e2e_survey', ontology: 'ENVO', confidence: 0.95 }
                    ]
                }
            ];
            await route.fulfill({ json });
        });

        // The toggle is mapped to the label "Enable AI Recommendations"
        const aiToggleLabel = page.locator('text=Enable AI Recommendations');
        const aiToggleInput = aiToggleLabel.locator('..').locator('input[type="checkbox"]');

        // Ensure it's enabled 
        // Wait for it to be visible first
        await aiToggleLabel.waitFor();
        const isChecked = await aiToggleInput.isChecked();
        if (!isChecked) {
            // We click the label since the input is hidden via class="sr-only"
            await aiToggleLabel.click();
        }
        // 4. Load Example Data
        await page.getByRole('button', { name: 'Load Example Data' }).click();

        // 5. Wait for the processing to finish and Editor to appear
        // It should say "Review & Export" when the editor is ready
        await expect(page.getByRole('button', { name: 'Review & Export' })).toBeVisible({ timeout: 10000 });

        // 6. Interact with the Editor

        // Expand the "SurveyResults" context group so its children are visible
        await page.getByText('SurveyResults', { exact: true }).click();

        // 6a. Search functionality
        await page.getByPlaceholder('Search elements...').fill('AirTemperature');
        await expect(page.getByText('AirTemperature_F')).toBeVisible();
        await page.getByPlaceholder('Search elements...').fill(''); // clear search

        // 6b. Grouping functionality
        // First collapse SurveyResults to ensure children are hidden
        await page.getByText('SurveyResults', { exact: true }).first().click();
        await expect(page.getByText('AirTemperature_F')).not.toBeVisible();

        // Switch to Group by Name
        await page.getByRole('button', { name: 'Group by Name' }).click();

        // AirTemperature_F should now be visible as its own group header
        await expect(page.getByText('AirTemperature_F', { exact: true })).toBeVisible();

        // Switch back to Group by Entity
        await page.getByRole('button', { name: 'Group by Entity' }).click(); // switch back

        // Expand the "SurveyResults" context group (state resets after grouping toggle)
        await page.getByText('SurveyResults', { exact: true }).click();

        // 7. Verify AI Recommendations are visible
        // Since AI is enabled, the mock API in E2E (or real API if running backend) should return something.
        // Actually, in E2E, the real local backend needs to be running for geminiService to work, 
        // or we're just testing the UI flow. We'll wait to see if any recommendation badge appears.
        // We expect the text "Accept Recommendation" or a specific ontology term badge to be visible.
        // If the backend isn't mocked, this depends on whether the `engine` is running. 
        // For a robust E2E test without requiring the python backend, we should intercept the network request
        // and provide mock recommendations!

        // Wait for the recommendation to appear (mocked)
        await expect(page.getByRole('button', { name: /Accept Recommendation/i })).toBeVisible();

        // Accept the recommendation
        await page.getByRole('button', { name: /Accept Recommendation/i }).first().click();

        // Verify it moved from recommended to current annotations
        // We can check the presence of the check mark or the fact that the recommend button is gone.

        // 8. Add a custom annotation
        await page.getByRole('button', { name: 'Add Custom Annotation' }).first().click();

        // Fill the custom annotation form
        // Note: The placeholders are 'Property Label', 'Property URI', 'Annotation Label', 'Annotation URI'
        await page.getByPlaceholder('Property Label').fill('Contains Measurement');
        await page.getByPlaceholder('Property URI').fill('http://example.com/contains');
        await page.getByPlaceholder('Annotation Label').fill('Custom E2E Term');
        await page.getByPlaceholder('Annotation URI').fill('http://example.com/e2e');

        // 8a. Test Suggest New Term Modal
        await page.route('http://localhost:8000/api/proposals', async route => {
            await route.fulfill({ status: 200, json: { status: 'success' } });
        });
        await page.getByRole('button', { name: 'Suggest New Term' }).click();

        await page.getByPlaceholder('e.g., Soil Type, Land Use, Sensor Model, or specific ontology (ENVO, SWEET)').fill('ENVO');
        // Fill description and email to meet validation requirements
        await page.getByPlaceholder('What is this term and what distinguishes it from similar concepts?').fill('This is an E2E test description that is at least 10 chars.');
        await page.getByPlaceholder('name@institution.edu').fill('test@example.com');
        await page.getByRole('button', { name: 'Submit Proposal' }).click();

        // Verify success and close modal
        await expect(page.locator('text=Suggestion Submitted!')).toBeVisible();
        await page.getByRole('button', { name: 'Close' }).click();

        // Resume adding custom annotation
        await page.getByRole('button', { name: 'Save' }).click();

        // Verify the custom term was added
        await expect(page.getByText('Custom E2E Term').first()).toBeVisible();

        // 9. Export the annotated EML
        await page.getByRole('button', { name: 'Review & Export' }).click();

        // Wait for the completion screen
        await expect(page.locator('text=Annotation Complete!')).toBeVisible();

        // 10. Start a new file (reset)
        await page.getByRole('button', { name: 'Annotate Another File' }).click();
        await page.getByRole('button', { name: 'Yes, Start New' }).click();

        // Verify we're back to the start
        await expect(page.locator('text=Upload EML Metadata')).toBeVisible();
    });
});
