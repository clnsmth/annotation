import { AnnotatableElement, OntologyTerm } from '../types';
import { getApiUrl } from '../config';

export class RecommenderService {

  isConfigured(): boolean {
    return true; // We assume the local backend is available
  }

  /**
   * Generates recommendations for a batch of elements by calling the backend service.
   */
  async getRecommendations(elements: AnnotatableElement[]): Promise<Map<string, OntologyTerm[]>> {
    // Group elements by type for the backend coordinator
    const groupedPayload: Record<string, Record<string, string | undefined>[]> = {};
    let totalCount = 0;

    elements.forEach(e => {
      // Exclude DATASET level elements from AI recommendations per requirements
      if (e.type === 'DATASET') return;

      // Map internal type 'COVERAGE' to 'GEOGRAPHICCOVERAGE' for the backend
      const key = e.type === 'COVERAGE' ? 'GEOGRAPHICCOVERAGE' : e.type;

      if (!groupedPayload[key]) {
        groupedPayload[key] = [];
      }

      groupedPayload[key].push({
        id: e.id,
        name: e.name,
        description: e.description,
        context: e.context,
        objectName: e.objectName, // Include the physical file name if available (e.g. for attributes)
        entityDescription: e.contextDescription, // Include context description (e.g. Entity Description for attributes)
        ...(e.type === 'COVERAGE' && {
          west: e.west,
          east: e.east,
          north: e.north,
          south: e.south,
          altitudeMinimum: e.altitudeMinimum,
          altitudeMaximum: e.altitudeMaximum,
          altitudeUnits: e.altitudeUnits,
          outerGRing: e.outerGRing,
          exclusionGRing: e.exclusionGRing,
        })
      });
      totalCount++;
    });

    if (totalCount === 0) {
      console.log('No eligible elements for annotation found (Dataset level filtered out).');
      return new Map();
    }

    // Payload is now the grouped object directly
    const url = getApiUrl('recommendations');

    console.log(`[RecommenderService] Preparing to POST ${totalCount} items (grouped by type) to ${url}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(groupedPayload)
      });

      if (!response.ok) {
        console.warn(`[RecommenderService] Backend returned status ${response.status}: ${response.statusText}`);
        return new Map();
      }

      const result = await response.json() as { id: string, recommendations: OntologyTerm[] }[];
      console.log('[RecommenderService] Response received:', result);

      const map = new Map<string, OntologyTerm[]>();

      if (Array.isArray(result)) {
        result.forEach(item => {
          if (item.id && Array.isArray(item.recommendations)) {
            map.set(item.id, item.recommendations);
          }
        });
      }

      return map;

    } catch (error) {
      console.error(`[RecommenderService] Failed to fetch recommendations from ${url}. Is the server running?`, error);
      return new Map();
    }
  }
}

export const recommenderService = new RecommenderService();
