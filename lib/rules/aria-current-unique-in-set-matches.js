/**
 * Match elements whose aria-current value marks them as current, i.e. any
 * value other than an empty string or "false" (ASCII case-insensitive).
 */
function ariaCurrentUniqueInSetMatches(node, virtualNode) {
  const value = virtualNode.attr('aria-current').trim().toLowerCase();
  return value !== '' && value !== 'false';
}

export default ariaCurrentUniqueInSetMatches;
