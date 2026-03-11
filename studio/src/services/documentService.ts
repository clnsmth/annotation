import { AnnotatableElement } from '../types';
import { getApiUrl } from '../config';

export class DocumentService {
  /**
   * Upload an EML file to the backend to get a canonical list of annotatable targets.
   *
   * @param file - The raw File object provided by the user upload
   */
  async getTargets(file: File): Promise<AnnotatableElement[]> {
    const url = getApiUrl('targets');
    console.log(`[DocumentService] Fetching canonical targets from backend: ${url}`);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = response.statusText;
        try {
          const errData = await response.json();
          if (errData && errData.detail) errorMessage = errData.detail;
        } catch (e) {
          // Ignore JSON parse error on generic error payloads
        }
        throw new Error(`Backend Error ${response.status}: ${errorMessage}`);
      }

      const elements = await response.json();
      console.log(`[DocumentService] Received ${elements.length} targets from backend.`);
      return elements as AnnotatableElement[];
    } catch (error) {
      console.error('[DocumentService] Failed to fetch targets.', error);
      throw error;
    }
  }

  /**
   * Helper designed to mock a File upload for the local dev "Load Example Data" case
   * which comes straight from a string in memory rather than a file input.
   *
   * @param xmlContent - Raw XML string
   * @param filename   - Filename to give the simulated file
   */
  async getTargetsFromString(xmlContent: string, filename: string): Promise<AnnotatableElement[]> {
    const blob = new Blob([xmlContent], { type: 'text/xml' });
    const file = new File([blob], filename, { type: 'text/xml' });
    return this.getTargets(file);
  }
}

export const documentService = new DocumentService();
