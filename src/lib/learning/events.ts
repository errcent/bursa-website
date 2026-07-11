const LEARNING_CHANGE_EVENT = "bursa-learning-change";

/** Notify dashboard/catalog hooks to refetch enrollment progress. */
export function notifyLearningChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(LEARNING_CHANGE_EVENT));
}

export function subscribeLearningChange(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  window.addEventListener(LEARNING_CHANGE_EVENT, handler);
  return () => window.removeEventListener(LEARNING_CHANGE_EVENT, handler);
}
