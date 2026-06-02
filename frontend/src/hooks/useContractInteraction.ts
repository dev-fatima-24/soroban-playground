import { useState, useCallback } from 'react';

interface CreateInteractionParams {
  studentId?: string;
  contractName: string;
  contractAddress?: string;
  functionName: string;
  parameters?: any;
  network?: string;
}

interface UpdateInteractionParams {
  result?: any;
  status?: 'pending' | 'success' | 'failed' | 'reverted';
  transactionHash?: string;
  blockNumber?: string;
  gasUsed?: string;
  executionTime?: number;
  errorMessage?: string;
  errorDetails?: any;
}

export function useContractInteraction(apiUrl: string = '/api') {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Create a new contract interaction record
   */
  const createInteraction = useCallback(
    async (params: CreateInteractionParams): Promise<string | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${apiUrl}/contract-interactions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          throw new Error('Failed to create interaction record');
        }

        const data = await response.json();
        return data.id;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Failed to create interaction:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiUrl]
  );

  /**
   * Update an existing interaction record with results
   */
  const updateInteraction = useCallback(
    async (interactionId: string, params: UpdateInteractionParams): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${apiUrl}/contract-interactions/${interactionId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          throw new Error('Failed to update interaction record');
        }

        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Failed to update interaction:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [apiUrl]
  );

  /**
   * Track a complete contract interaction from start to finish
   */
  const trackInteraction = useCallback(
    async <T,>(
      params: CreateInteractionParams,
      executionFn: () => Promise<T>
    ): Promise<T | null> => {
      const startTime = Date.now();

      // Create interaction record
      const interactionId = await createInteraction(params);

      if (!interactionId) {
        throw new Error('Failed to create interaction record');
      }

      try {
        // Execute the contract interaction
        const result = await executionFn();
        const executionTime = Date.now() - startTime;

        // Update with success
        await updateInteraction(interactionId, {
          result,
          status: 'success',
          executionTime,
        });

        return result;
      } catch (err) {
        const executionTime = Date.now() - startTime;
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';

        // Update with failure
        await updateInteraction(interactionId, {
          status: 'failed',
          executionTime,
          errorMessage,
          errorDetails: err,
        });

        throw err;
      }
    },
    [createInteraction, updateInteraction]
  );

  return {
    createInteraction,
    updateInteraction,
    trackInteraction,
    loading,
    error,
  };
}
