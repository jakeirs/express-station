import { useState, useCallback, useRef } from 'react';

/**
 * A custom hook for managing swipeable data with pagination and direction detection
 * @param {Object} options Configuration options for the hook
 * @param {Function} options.onFetchNext Function to fetch next page of data
 * @param {Function} options.onFetchPrevious Function to fetch previous page of data
 * @param {number} options.initialPage Starting page number (default: 1)
 * @param {boolean} options.enablePrefetch Whether to prefetch next/previous data (default: true)
 * @returns {Object} Hook state and handlers
 */
const useSwiperData = ({
  onFetchNext,
  onFetchPrevious,
  initialPage = 1,
  enablePrefetch = true,
}: {
  onFetchNext: any;
  onFetchPrevious: any;
  initialPage: any;
  enablePrefetch: any;
}) => {
  // Track current page and loading states
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use refs to track the latest loading state and prevent duplicate requests
  const loadingRef = useRef(false);
  const prefetchingRef = useRef(false);

  // Store the last swipe direction for context
  const [lastSwipeDirection, setLastSwipeDirection] = useState(null);

  /**
   * Handles data fetching with error handling and loading states
   */
  const fetchData = useCallback(
    async (direction, isPrefetch = false) => {
      // Prevent duplicate fetches and check loading state
      if (!isPrefetch && loadingRef.current) return;
      if (isPrefetch && prefetchingRef.current) return;

      const loadingStateRef = isPrefetch ? prefetchingRef : loadingRef;
      loadingStateRef.current = true;

      if (!isPrefetch) {
        setIsLoading(true);
        setError(null);
      }

      try {
        if (direction === 'next') {
          await onFetchNext(currentPage + 1);
          if (!isPrefetch) {
            setCurrentPage((prev) => prev + 1);
            setLastSwipeDirection('left');
          }
        } else {
          await onFetchPrevious(currentPage - 1);
          if (!isPrefetch) {
            setCurrentPage((prev) => prev - 1);
            setLastSwipeDirection('right');
          }
        }
      } catch (err) {
        if (!isPrefetch) {
          setError(err);
        }
        console.error('Error fetching data:', err);
      } finally {
        loadingStateRef.current = false;
        if (!isPrefetch) {
          setIsLoading(false);
        }
      }
    },
    [currentPage, onFetchNext, onFetchPrevious]
  );

  /**
   * Handles swipe events and triggers appropriate data fetching
   */
  const handleSwipe = useCallback(
    async (direction) => {
      await fetchData(direction === 'left' ? 'next' : 'previous');

      // Prefetch next/previous data if enabled
      if (enablePrefetch) {
        setTimeout(() => {
          fetchData(direction === 'left' ? 'next' : 'previous', true);
        }, 300);
      }
    },
    [fetchData, enablePrefetch]
  );

  return {
    currentPage,
    isLoading,
    error,
    lastSwipeDirection,
    handleSwipe,
    // Additional utility functions
    reset: useCallback(() => {
      setCurrentPage(initialPage);
      setLastSwipeDirection(null);
      setError(null);
    }, [initialPage]),
  };
};

export default useSwiperData;
