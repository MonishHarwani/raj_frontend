import { useState, useEffect, useCallback } from "react";

const useInfiniteScroll = (callback, deps = []) => {
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (!isFetching) return;
    fetchMoreData();
  }, [isFetching]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, deps);

  const handleScroll = () => {
    if (
      window.innerHeight + document.documentElement.scrollTop !==
        document.documentElement.offsetHeight ||
      isFetching
    )
      return;
    setIsFetching(true);
  };

  const fetchMoreData = useCallback(async () => {
    await callback();
    setIsFetching(false);
  }, [callback]);

  return [isFetching, setIsFetching];
};

export default useInfiniteScroll;
