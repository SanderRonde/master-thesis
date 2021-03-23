/**
 * Metrics
 */
// 2, as used by the paper (A quality model for web components)
export const STRUCTURAL_COMPLEXITY_DEPTH = 2;
/**
 * Slowdown factor used for the load time of bundles
 */
export const SLOWDOWN_FACTOR = 10;
/**
 * Number of times to measure load time performance
 * before generating a report off of the avg
 */
export const LOAD_TIME_PERFORMANCE_MEASURES = 5;
/**
 * How long to wait before assuming a component has been fully
 * rendered (when gathering data on a fast version of the page)
 */
export const INITIAL_RENDER_WAIT_TIME = 5000;
/**
 * How long to wait before assuming a component has been fully
 * rendered (when measuring a slower version of the page)
 */
 export const MEASURED_RENDER_WAIT_TIME = 10000;