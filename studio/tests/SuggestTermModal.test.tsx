import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SuggestTermModal } from '../src/components/SuggestTermModal';

describe('SuggestTermModal component', () => {
    const mockOnClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('does not render when isOpen is false', () => {
        render(<SuggestTermModal isOpen={false} onClose={mockOnClose} />);
        expect(screen.queryByText('Propose New Ontology Term')).not.toBeInTheDocument();
    });

    it('renders correctly when isOpen is true', () => {
        render(<SuggestTermModal isOpen={true} onClose={mockOnClose} />);
        expect(screen.getByText('Propose New Ontology Term')).toBeInTheDocument();
    });

    it('shows validation errors when submitting an empty form', async () => {
        const user = userEvent.setup();
        render(<SuggestTermModal isOpen={true} onClose={mockOnClose} />);

        const submitBtn = screen.getByRole('button', { name: /submit proposal/i });
        await user.click(submitBtn);

        // Check for validation errors
        expect(await screen.findByText('Target vocabulary must be at least 2 characters.')).toBeInTheDocument();
        expect(screen.getByText('Term label must be at least 2 characters.')).toBeInTheDocument();
        expect(screen.getByText('Description must be at least 10 characters.')).toBeInTheDocument();
        expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument();
    });

    it('shows validation errors for invalid ORCID URLs', async () => {
        const user = userEvent.setup();
        render(<SuggestTermModal isOpen={true} onClose={mockOnClose} />);

        // Fill out required valid fields
        await user.type(screen.getByPlaceholderText(/e\.g\., Soil Type/i), 'ENVO');
        await user.type(screen.getByPlaceholderText(/e\.g\., Oligotrophic Peatland/i), 'Valid Label');
        await user.type(screen.getByPlaceholderText(/What is this term/i), 'Valid description that is long enough.');
        await user.type(screen.getByPlaceholderText(/name@institution\.edu/i), 'test@example.com');

        // Add invalid ORCID
        await user.type(screen.getByPlaceholderText(/https:\/\/orcid\.org/i), 'invalid-orcid-format');

        const submitBtn = screen.getByRole('button', { name: /submit proposal/i });
        await user.click(submitBtn);

        expect(screen.getByText('Invalid ORCID URL format (e.g., https://orcid.org/0000-0000-0000-0000).')).toBeInTheDocument();
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('submits successfully with a valid ORCID URL', async () => {
        const user = userEvent.setup();
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ success: true })
        } as unknown as Response);

        render(<SuggestTermModal isOpen={true} onClose={mockOnClose} />);

        // Fill out required valid fields
        await user.type(screen.getByPlaceholderText(/e\.g\., Soil Type/i), 'ENVO');
        await user.type(screen.getByPlaceholderText(/e\.g\., Oligotrophic Peatland/i), 'Valid Label');
        await user.type(screen.getByPlaceholderText(/What is this term/i), 'Valid description that is long enough.');
        await user.type(screen.getByPlaceholderText(/name@institution\.edu/i), 'test@example.com');

        // Add valid ORCID
        await user.type(screen.getByPlaceholderText(/https:\/\/orcid\.org/i), 'https://orcid.org/0000-0001-2345-6789');

        const submitBtn = screen.getByRole('button', { name: /submit proposal/i });
        await user.click(submitBtn);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });
        expect(await screen.findByText('Suggestion Submitted!')).toBeInTheDocument();
    });

    it('calls onClose when cancel or close button is clicked', async () => {
        const user = userEvent.setup();
        render(<SuggestTermModal isOpen={true} onClose={mockOnClose} />);

        const cancelBtn = screen.getByRole('button', { name: /cancel/i });
        await user.click(cancelBtn);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('submits successfully and shows success screen', async () => {
        const user = userEvent.setup();
        // Mock fetch
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ success: true })
        } as unknown as Response);

        render(<SuggestTermModal isOpen={true} onClose={mockOnClose} initialTermLabel="TestLabel" />);

        // Fill out form
        await user.type(screen.getByPlaceholderText(/e\.g\., Soil Type/i), 'ENVO');
        // The suggest term label should be pre-filled via initialTermLabel, but let's clear and retype it safely just in case, or verify it
        const termLabelInput = screen.getByPlaceholderText(/e\.g\., Oligotrophic Peatland/i);
        expect(termLabelInput).toHaveValue('TestLabel');

        await user.type(screen.getByPlaceholderText(/What is this term/i), 'This is a test description longer than 10 characters.');
        await user.type(screen.getByPlaceholderText(/name@institution\.edu/i), 'test@example.com');

        // Submit
        const submitBtn = screen.getByRole('button', { name: /submit proposal/i });
        await user.click(submitBtn);

        // Verify fetch was called correctly
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        const fetchArgs = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(fetchArgs[0]).toBe('http://localhost:8000/api/proposals');
        const requestBody = JSON.parse(fetchArgs[1].body);
        expect(requestBody.target_vocabulary).toBe('ENVO');
        expect(requestBody.term_details.label).toBe('TestLabel');
        expect(requestBody.submitter_info.email).toBe('test@example.com');

        // Verify success screen is shown
        expect(await screen.findByText('Suggestion Submitted!')).toBeInTheDocument();

        // Verify closing from success screen
        const closeBtn = screen.getByRole('button', { name: /close/i });
        await user.click(closeBtn);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
});
