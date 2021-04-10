/**
 * ================================================
 * 							Development options
 * ================================================
 */
/**
 * Whether this is running in development mode
 */
const DEVELOPMENT_DEFAULT = true;
export const DEVELOPMENT = DEVELOPMENT_DEFAULT
	? !process.argv.includes('--prod') && process.env.ENV !== 'production'
	: false;
const KEEP_PROFILES_DEFAULT = true;
/**
 * Whether to store images taken during the render time tests
 */
export const KEEP_PROFILES = DEVELOPMENT && KEEP_PROFILES_DEFAULT;

/**
 * ================================================
 * 							Metrics
 * ================================================
 */
/**
 * 2, as used by the paper (A quality model for web components)
 */
export const STRUCTURAL_COMPLEXITY_DEPTH = 2;
/**
 * Slowdown factor used for the load time of bundles
 */
export const SLOWDOWN_FACTOR_LOAD_TIME = DEVELOPMENT ? 1 : 10;
/**
 * Slowdown factor used for the render time of bundles
 */
export const SLOWDOWN_FACTOR_RENDER_TIME = DEVELOPMENT ? 1 : 5;
/**
 * Number of times to measure load time performance
 * before generating a report off of the avg
 */
export const LOAD_TIME_PERFORMANCE_MEASURES = DEVELOPMENT ? 1 : 5;
/**
 * How long to wait before assuming a component has been fully
 * rendered (when measuring a slower version of the page)
 */
export const MAX_MEASURED_RENDER_WAIT_TIME = 800 * SLOWDOWN_FACTOR_RENDER_TIME;
/**
 * How long to wait after the `requestIdleCallback` callback
 * has been fired by the browser
 */
export const WAIT_AFTER_IDLE_TIME = 1000;
/**
 * The maximum number of pixels a frame is allowed to
 * differ from the target frame before being marked as
 * the same
 */
export const GOLDEN_FRAME_MAX_DIFF_PIXELS = 0;
/**
 * The number of times to measure render time performance
 * for the same component, allowing for some stabilization
 */
export const RENDER_TIME_MEASURES = DEVELOPMENT ? 1 : 5;
/**
 * The height of the frame for the render time test
 */
export const RENDER_TIME_HEIGHT = 1080;
/**
 * The width of the frame for the render time test
 */
export const RENDER_TIME_WIDTH = 1920;
/**
 * How many pxiels to crop out from the top of the
 * render time page
 */
export const RENDER_TIME_CROP = 200;

const PUPPETEER_DEFAULT_NAVIGATION_TIMEOUT = 30000;
/**
 * How long puppeteer should wait before a navigation
 * times out
 */
export const NAVIGATION_TIMEOUT = Math.max(
	PUPPETEER_DEFAULT_NAVIGATION_TIMEOUT,
	Math.max(SLOWDOWN_FACTOR_LOAD_TIME, SLOWDOWN_FACTOR_RENDER_TIME) * 12000
);
/**
 * How many times to try testing the render time
 * before failing
 */
export const RENDER_TIME_TRIES = 3;