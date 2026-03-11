import { describe, it, expect, vi, beforeEach } from 'vitest';
import { documentService } from '../documentService';
import { config } from '../../config';
import { AnnotatableElement } from '../../types';

// Mock the global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('DocumentService', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should successfully post a file and return parsed elements', async () => {
        const mockTargets: Partial<AnnotatableElement>[] = [
           { id: '1', name: 'Test Target' }
        ];

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockTargets
        });

        // Create a fake file
        const fileContent = "dummy xml content";
        const file = new File([fileContent], "test.xml", { type: "text/xml" });

        const result = await documentService.getTargets(file);

        // Verify result matches mock
        expect(result).toEqual(mockTargets);

        // Verify fetch was called correctly
        expect(mockFetch).toHaveBeenCalledTimes(1);
        const [url, options] = mockFetch.mock.calls[0];

        // Should use the config targets endpoint URL
        expect(url).toContain(config.api.endpoints.targets);
        expect(options.method).toBe('POST');
        
        // Assert it's sending FormData and the file is in it
        expect(options.body).toBeInstanceOf(FormData);
        const formData = options.body as FormData;
        expect(formData.get('file')).toBe(file);
    });

    it('should throw an error if the backend request fails', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            statusText: 'Internal Server Error',
            json: async () => ({ detail: 'Something broke' }) // simulate FastAPI default error payload
        });

        const file = new File(["bad"], "bad.xml", { type: "text/xml" });

        await expect(documentService.getTargets(file)).rejects.toThrow('Backend Error undefined: Something broke');
    });
});
