export const detectChildrenReplacement = (
  parentDiv: HTMLElement,
  childSelector: string,
  callback: (currentChildrens: HTMLElement[]) => void
) => {
  // Keep track of the previous matching children
  let previousChildrens = Array.from(parentDiv.querySelectorAll(childSelector));

  // Create a MutationObserver instance
  const observer = new MutationObserver((mutations) => {
    // Check if any mutations involve childList changes
    const hasChildListChanges = mutations.some((mutation) => mutation.type === 'childList');

    if (hasChildListChanges) {
      // Get the current matching children
      const currentChildrens = Array.from(parentDiv.querySelectorAll<HTMLElement>(childSelector));

      // Check if different children now exist
      const childrenChanged =
        previousChildrens.length !== currentChildrens.length ||
        !previousChildrens.every((child, index) => child === currentChildrens[index]);

      if (!childrenChanged) return;

      callback(currentChildrens);

      previousChildrens = currentChildrens;
    }
  });

  // Configuration for the observer
  const config = {
    childList: true, // Watch for child additions/removals
    subtree: true, // Watch the entire subtree for changes
  };

  // Start observing
  observer.observe(parentDiv, config);

  return observer;
};
