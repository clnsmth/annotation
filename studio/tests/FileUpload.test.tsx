import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { FileUpload } from '../src/components/FileUpload';

describe('FileUpload component', () => {
    it('renders the core elements when no error is present', () => {
        render(<FileUpload onFileLoaded={vi.fn()} onLoadExample={vi.fn()} />);

        expect(screen.getByText('Upload EML Metadata')).toBeInTheDocument();
        expect(screen.getByText(/Drag and drop your \.xml file here/i)).toBeInTheDocument();
        expect(screen.getByText('Select XML File')).toBeInTheDocument();
        expect(screen.getByText('Load Example Data')).toBeInTheDocument();
        expect(screen.getByText('Enable AI Recommendations')).toBeInTheDocument();
    });

    it('renders an error message when the error prop is provided', () => {
        const errorMessage = 'Invalid XML format';
        render(<FileUpload onFileLoaded={vi.fn()} onLoadExample={vi.fn()} error={errorMessage} />);

        expect(screen.getByText('Upload Failed')).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('calls onLoadExample when the example button is clicked', async () => {
        const user = userEvent.setup();
        const handleLoadExample = vi.fn();

        render(<FileUpload onFileLoaded={vi.fn()} onLoadExample={handleLoadExample} />);

        const loadExampleBtn = screen.getByRole('button', { name: /load example data/i });
        await user.click(loadExampleBtn);

        // Check if it's called. The default is skipRecommendations=true (AI off)
        expect(handleLoadExample).toHaveBeenCalledTimes(1);
        expect(handleLoadExample).toHaveBeenCalledWith(true);
    });

    it('toggles the AI recommendations switch state', async () => {
        const user = userEvent.setup();
        const handleLoadExample = vi.fn();

        render(<FileUpload onFileLoaded={vi.fn()} onLoadExample={handleLoadExample} />);

        const uiSwitch = screen.getByRole('checkbox');
        // Default is AI off (checked=false)
        expect(uiSwitch).not.toBeChecked();

        // Click the label to toggle AI on
        const toggleLabel = screen.getByText('Enable AI Recommendations');
        await user.click(toggleLabel);

        // The visual switch checkbox should now be checked (meaning AI is ON, skipRecommendations is false)
        expect(uiSwitch).toBeChecked();

        const loadExampleBtn = screen.getByRole('button', { name: /load example data/i });
        await user.click(loadExampleBtn);

        // If AI is on, skipRecommendations should be false when calling onLoadExample
        expect(handleLoadExample).toHaveBeenCalledWith(false);
    });

    it('handles file upload securely', async () => {
        const user = userEvent.setup();
        const handleFileLoaded = vi.fn();

        render(<FileUpload onFileLoaded={handleFileLoaded} onLoadExample={vi.fn()} />);

        const file = new File(['<eml><dataset></dataset></eml>'], 'test.xml', { type: 'text/xml' });
        const fileInput = screen.getByLabelText('Select XML File'); // Label text wraps the input

        // Wait for file upload
        await user.upload(fileInput, file);

        // FileReader is asynchronous in the component, so we must wait and check for side-effects
        // Since FileReader is used, we have to use a small timeout to let it resolve, or mock FileReader
        await new Promise(resolve => setTimeout(resolve, 50));

        expect(handleFileLoaded).toHaveBeenCalledTimes(1);
        expect(handleFileLoaded).toHaveBeenCalledWith('test.xml', '<eml><dataset></dataset></eml>', true); // AI off by default
    });
});
