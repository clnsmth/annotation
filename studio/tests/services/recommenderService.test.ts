import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { recommenderService } from '../../src/services/recommenderService';
import { AnnotatableElement, AnnotationStatus } from '../../src/types';

describe('RecommenderService', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const mockElements: AnnotatableElement[] = [
        {
            id: 'dataset-1',
            type: 'DATASET',
            name: 'Dataset Level Skip',
            description: 'Should be ignored',
            path: 'dataset',
            context: 'Dataset Level',
            status: AnnotationStatus.PENDING,
            currentAnnotations: [],
            recommendedAnnotations: []
        },
        {
            id: 'mock-attr-1',
            type: 'ATTRIBUTE',
            name: 'temperature',
            description: 'Water temperature',
            path: '/dataset/dataTable/attribute',
            context: 'dataTable',
            status: AnnotationStatus.PENDING,
            currentAnnotations: [],
            recommendedAnnotations: []
        }
    ];

    it('returns true for isConfigured (local backend assumption)', () => {
        expect(recommenderService.isConfigured()).toBe(true);
    });

    it('filters out DATASET elements and sends the rest to backend', async () => {
        // Mock successful fetch
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve([
                {
                    id: 'mock-attr-1',
                    recommendations: [
                        { label: 'Water Temp', uri: 'http://example.com/water_temp', ontology: 'ENVO' }
                    ]
                }
            ])
        } as unknown as Response);

        const recommendationsMap = await recommenderService.getRecommendations(mockElements);

        expect(global.fetch).toHaveBeenCalledTimes(1);

        // Assert the shape of the grouped payload sent to fetch
        const fetchArgs = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
        const requestBody = JSON.parse(fetchArgs[1].body);

        // DATASET should not be in the request body
        expect(requestBody.DATASET).toBeUndefined();

        // ATTRIBUTE should be defined
        expect(requestBody.ATTRIBUTE).toBeDefined();
        expect(requestBody.ATTRIBUTE.length).toBe(1);
        expect(requestBody.ATTRIBUTE[0].id).toBe('mock-attr-1');

        // Verify the parsed map return
        expect(recommendationsMap.size).toBe(1);
        const attrRecs = recommendationsMap.get('mock-attr-1');
        expect(attrRecs).toBeDefined();
        expect(attrRecs![0].label).toBe('Water Temp');
    });

    it('gracefully handles network failures by returning an empty map', async () => {
        // Mock failing fetch
        global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

        // Suppress console error for clean test output
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        const recommendationsMap = await recommenderService.getRecommendations(mockElements);

        expect(recommendationsMap.size).toBe(0);
        expect(consoleSpy).toHaveBeenCalled();

        consoleSpy.mockRestore();
    });

    it('gracefully handles non-200 responses by returning an empty map', async () => {
        // Mock non-ok fetch
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error'
        } as unknown as Response);

        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

        const recommendationsMap = await recommenderService.getRecommendations(mockElements);

        expect(recommendationsMap.size).toBe(0);
        expect(consoleSpy).toHaveBeenCalled();

        consoleSpy.mockRestore();
    });
});
