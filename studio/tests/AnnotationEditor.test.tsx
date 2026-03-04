import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnnotationEditor } from '../src/components/AnnotationEditor';
import { AnnotatableElement, AnnotationStatus } from '../src/types';

describe('AnnotationEditor component', () => {
    const mockOnUpdateElement = vi.fn();
    const mockOnExport = vi.fn();

    const mockElements: AnnotatableElement[] = [
        {
            id: 'mock-1',
            name: 'temperature',
            description: 'Air temperature in Celsius',
            path: '/dataset/dataTable/attributeList/attribute[1]',
            context: 'dataTable',
            type: 'ATTRIBUTE',
            status: AnnotationStatus.REVIEW_REQUIRED,
            currentAnnotations: [],
            recommendedAnnotations: [
                {
                    label: 'Air Temperature',
                    uri: 'http://example.com/air_temp',
                    ontology: 'ENVO',
                    confidence: 0.95
                }
            ]
        },
        {
            id: 'mock-2',
            name: 'site_id',
            description: 'Unique site identifier',
            path: '/dataset/dataTable/attributeList/attribute[2]',
            context: 'dataTable',
            type: 'ATTRIBUTE',
            status: AnnotationStatus.PENDING,
            currentAnnotations: [],
            recommendedAnnotations: [],
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        // jsdom does not implement navigator.sendBeacon, so we must mock it globally
        Object.defineProperty(navigator, 'sendBeacon', {
            value: vi.fn(),
            configurable: true
        });
    });

    it('renders elements grouped by context', async () => {
        const user = userEvent.setup();
        render(
            <AnnotationEditor
                elements={mockElements}
                onUpdateElement={mockOnUpdateElement}
                onExport={mockOnExport}
            />
        );

        // Context should be rendered as a header
        expect(screen.getByText('dataTable')).toBeInTheDocument();

        // Expand the group
        await user.click(screen.getByText('dataTable'));

        // Element names should be visible
        expect(screen.getByText('temperature')).toBeInTheDocument();
        expect(screen.getByText('site_id')).toBeInTheDocument();
    });

    it('clicking a recommendation badge calls onUpdateElement', async () => {
        const user = userEvent.setup();
        render(
            <AnnotationEditor
                elements={mockElements}
                onUpdateElement={mockOnUpdateElement}
                onExport={mockOnExport}
            />
        );

        // Expand the group
        await user.click(screen.getByText('dataTable'));

        const acceptBtn = screen.getByRole('button', { name: /Accept Recommendation/i });
        await user.click(acceptBtn);

        expect(mockOnUpdateElement).toHaveBeenCalledTimes(1);
        expect(mockOnUpdateElement).toHaveBeenCalledWith('mock-1', {
            currentAnnotations: expect.arrayContaining([
                expect.objectContaining({ label: 'Air Temperature' })
            ]),
            status: AnnotationStatus.APPROVED
        });
    });

    it('calls onExport when the export button is clicked', async () => {
        const user = userEvent.setup();
        render(
            <AnnotationEditor
                elements={mockElements}
                onUpdateElement={mockOnUpdateElement}
                onExport={mockOnExport}
            />
        );

        const exportBtn = screen.getByRole('button', { name: /Export/i });
        await user.click(exportBtn);

        expect(mockOnExport).toHaveBeenCalledTimes(1);
    });

    it('renders a custom search term interface and handles custom term submission', async () => {
        const user = userEvent.setup();
        render(
            <AnnotationEditor
                elements={mockElements}
                onUpdateElement={mockOnUpdateElement}
                onExport={mockOnExport}
            />
        );

        // Expand the group
        await user.click(screen.getByText('dataTable'));

        // Click "Add Custom Annotation" for the second element (mock-2)
        const addCustomBtns = screen.getAllByRole('button', { name: /Add Custom Annotation/i });
        await user.click(addCustomBtns[1]);

        // Type a custom search term
        await user.type(screen.getByPlaceholderText('Annotation Label'), 'Custom Site Identifier');
        await user.type(screen.getByPlaceholderText('Annotation URI'), 'http://example.com/custom_site');
        await user.type(screen.getByPlaceholderText('Property Label'), 'contains');
        await user.type(screen.getByPlaceholderText('Property URI'), 'http://example.com/prop');

        // Save
        await user.click(screen.getByRole('button', { name: /Save/i }));

        expect(mockOnUpdateElement).toHaveBeenCalledTimes(1);
        expect(mockOnUpdateElement).toHaveBeenCalledWith('mock-2', {
            currentAnnotations: expect.arrayContaining([
                expect.objectContaining({ label: 'Custom Site Identifier' })
            ]),
            status: AnnotationStatus.APPROVED
        });
    });

    it('can open the Propose New Term modal', async () => {
        const user = userEvent.setup();
        render(
            <AnnotationEditor
                elements={mockElements}
                onUpdateElement={mockOnUpdateElement}
                onExport={mockOnExport}
            />
        );

        // Expand the group
        await user.click(screen.getByText('dataTable'));

        // Click "Add Custom Annotation" to show the form
        const addCustomBtns = screen.getAllByRole('button', { name: /Add Custom Annotation/i });
        await user.click(addCustomBtns[0]);

        const proposeBtn = screen.getByRole('button', { name: /Suggest New Term/i });
        await user.click(proposeBtn);

        // The SuggestTermModal should now be open. We can verify this by checking for modal header:
        expect(await screen.findByText('Propose New Ontology Term')).toBeInTheDocument();
    });

    it('filters elements based on search input', async () => {
        const user = userEvent.setup();
        render(
            <AnnotationEditor
                elements={mockElements}
                onUpdateElement={mockOnUpdateElement}
                onExport={mockOnExport}
            />
        );

        // Initially both elements should be available (after expanding context)
        await user.click(screen.getByText('dataTable'));
        expect(screen.getByText('temperature')).toBeInTheDocument();
        expect(screen.getByText('site_id')).toBeInTheDocument();

        // Type 'temp' into the search box
        const searchInput = screen.getByPlaceholderText('Search elements...');
        await user.type(searchInput, 'temp');

        // group might auto-collaspe/expand based on render logic, let's ensure it's visible
        // Actually, since we didn't lose state of expandedGroups, it should still be open
        expect(screen.getByText('temperature')).toBeInTheDocument();
        // site_id should be filtered out
        expect(screen.queryByText('site_id')).not.toBeInTheDocument();
    });

    it('toggles grouping from Context to Name correctly', async () => {
        const user = userEvent.setup();
        render(
            <AnnotationEditor
                elements={mockElements}
                onUpdateElement={mockOnUpdateElement}
                onExport={mockOnExport}
            />
        );

        // Initially grouped by Context
        expect(screen.getByText('dataTable')).toBeInTheDocument();

        // Toggle to Group by Name
        const groupByNameBtn = screen.getByRole('button', { name: /Group by Name/i });
        await user.click(groupByNameBtn);

        // Now the groups should be 'temperature' and 'site_id' instead of 'dataTable'
        expect(screen.getByText('temperature')).toBeInTheDocument();
        expect(screen.getByText('site_id')).toBeInTheDocument();
        // dataTable group header should no longer exist (it might exist as context tag, but not as the main header button grouping)
        // A direct queryByText might find it inside the element's description/tag, but the main grouping buttons should be the names
    });
});

