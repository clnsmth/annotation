import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from '../src/App';

// Mock the recommenderService to prevent actual network calls during tests
vi.mock('../src/services/recommenderService', () => ({
    recommenderService: {
        getRecommendations: vi.fn().mockResolvedValue(new Map())
    }
}));
// Mock the documentserivce to prevent network parsing requests
vi.mock('../src/services/documentService', () => ({
    documentService: {
        getTargets: vi.fn().mockResolvedValue([]),
        getTargetsFromString: vi.fn().mockResolvedValue([]),
        exportDocument: vi.fn().mockResolvedValue('<eml:eml></eml:eml>')
    }
}));

describe('App Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Mock URL methods used in export
        global.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/mock-url');
        global.URL.revokeObjectURL = vi.fn();

        // jsdom doesn't support sendBeacon which might be called if we accepted a rec
        Object.defineProperty(navigator, 'sendBeacon', {
            value: vi.fn(),
            configurable: true
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('completes the full happy path flow (Upload -> Editor -> Export -> Reset)', async () => {
        const user = userEvent.setup();
        render(<App />);

        // Step 1: Upload Step
        expect(screen.getByText('Upload EML Metadata')).toBeInTheDocument();

        // Click "Load Example Data" (AI is off by default so recommenderService won't even be called)
        const loadExampleBtn = screen.getByRole('button', { name: /Load Example Data/i });
        await user.click(loadExampleBtn);

        // It should transition to parsing/consulting quickly, then show AnnotationEditor
        // We wait for the "Review & Export" button which proves AnnotationEditor rendered
        const reviewExportBtn = await screen.findByRole('button', { name: /Review & Export/i }, { timeout: 2000 });
        expect(reviewExportBtn).toBeInTheDocument();

        // Step 2: Annotation Step
        // Let's pretend the user reviewed elements and is ready to export
        await user.click(reviewExportBtn);

        // Step 3: Export Step
        // It should now show "Annotation Complete!"
        expect(await screen.findByText('Annotation Complete!')).toBeInTheDocument();

        // Verify Download Button works
        const downloadBtn = screen.getByRole('button', { name: /Download EML/i });
        await user.click(downloadBtn);
        expect(global.URL.createObjectURL).toHaveBeenCalledTimes(1);

        // Click "Annotate Another File"
        const startNewBtn = screen.getByRole('button', { name: /Annotate Another File/i });
        await user.click(startNewBtn);

        // The confirmation modal should appear
        expect(await screen.findByText('Start New Annotation?')).toBeInTheDocument();

        // Confirm reset
        const confirmBtn = screen.getByRole('button', { name: /Yes, Start New/i });
        await user.click(confirmBtn);

        // Step 4: Back to Upload Step
        expect(await screen.findByText('Upload EML Metadata')).toBeInTheDocument();
    });

    it('displays an error message when file parsing fails', async () => {
        const user = userEvent.setup();
        render(<App />);

        // We mock documentService.getTargets to simulate a backend parsing error
        const parseSpy = vi.spyOn(await import('../src/services/documentService').then(m => m.documentService), 'getTargets').mockImplementation(() => {
            return Promise.reject(new Error('Backend Error 422: EML version 2.1 detected.'));
        });

        // Suppress the console.error from the component to keep test output clean
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        expect(fileInput).not.toBeNull();

        const file = new File(['<eml/>'], 'bad.xml', { type: 'text/xml' });
        await user.upload(fileInput, file);

        // After parsing fails, it should show the error message inside the FileUpload component.
        expect(await screen.findByText(/EML version 2.1 detected/i)).toBeInTheDocument();

        parseSpy.mockRestore();
        consoleSpy.mockRestore();
    });
});
