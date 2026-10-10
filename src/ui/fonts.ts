/**
 * Faces used on the device skin (both SIL OFL 1.1, self-hosted by Vite; see THIRD_PARTY_NOTICES.md):
 * - Source Sans 3 (variable, upright and italic): key legends, green 2nd legends, the wordmark and
 *   the LCD indicators. A humanist sans close to the device's printing.
 * - STIX Two Text italic: the serif math letters on the keys (x, n, π, and the yzt / abc of the
 *   variable key) and in the green legends (the x of 10ˣ, eˣ and ˣ√).
 */
import "@fontsource-variable/source-sans-3/wght.css";
import "@fontsource-variable/source-sans-3/wght-italic.css";
// The all-subsets file: it carries unicode-range, so only the latin and greek files (x, n, π) load.
import "@fontsource/stix-two-text/500-italic.css";
