import { getRole } from '../../commons/aria';
import { isVisibleToScreenReaders } from '../../commons/dom';
import { accessibleTextVirtual, sanitize } from '../../commons/text';
import { querySelectorAllFilter } from '../../core/utils';

// Roles whose owned elements form a "set" in the sense of WAI-ARIA's
// "Authors SHOULD only mark one element in a set of elements as current".
// Rows are left out so that the cells of one grid or table form one set.
const setRoles = [
  'list',
  'listbox',
  'menu',
  'menubar',
  'tablist',
  'tree',
  'treegrid',
  'grid',
  'table',
  'radiogroup',
  'toolbar',
  'navigation',
  'group'
];

const tokens = ['page', 'step', 'location', 'date', 'time', 'true'];

/**
 * Get the aria-current token of an element. Unknown values are treated as
 * "true", as WAI-ARIA requires.
 * @param {VirtualNode} vNode
 * @return {String|null} The token, or null if the element is not current
 */
export function getCurrentToken(vNode) {
  const value = (vNode.attr('aria-current') ?? '').trim().toLowerCase();
  if (value === '' || value === 'false') {
    return null;
  }
  return tokens.includes(value) ? value : 'true';
}

/**
 * Get the nearest ancestor that groups its descendants into a set, crossing
 * shadow DOM boundaries. An element with no such ancestor forms a set with
 * its siblings only, so unrelated widgets on a page are not compared.
 * @param {VirtualNode} vNode
 * @return {VirtualNode}
 */
export function getCurrentSet(vNode) {
  let ancestor = vNode.parent;
  while (ancestor) {
    if (setRoles.includes(getRole(ancestor, { noPresentational: true }))) {
      return ancestor;
    }
    ancestor = ancestor.parent;
  }
  return vNode.parent ?? vNode;
}

function getName(vNode) {
  return sanitize(accessibleTextVirtual(vNode)).toLowerCase();
}

function getHref(vNode) {
  const href = vNode.attr('href');
  if (href === null) {
    return null;
  }
  try {
    return new window.URL(href, document.baseURI).href;
  } catch {
    return href;
  }
}

/**
 * Check whether another element in the same set is marked as current with
 * the same token, and differs from this one in accessible name or href.
 * Elements with the same name and href are duplicates of one another, such
 * as two links to the current page, and are allowed.
 *
 * @memberof checks
 * @param {HTMLElement} node
 * @param {Object} options
 * @param {Boolean} options.anyToken Compare elements regardless of their aria-current token
 * @param {VirtualNode} virtualNode
 * @return {Boolean} True if another, different element in the set is current
 */
export default function ariaCurrentUniqueInSetEvaluate(
  node,
  options,
  virtualNode
) {
  const token = getCurrentToken(virtualNode);
  const set = getCurrentSet(virtualNode);
  const name = getName(virtualNode);
  const href = getHref(virtualNode);

  const others = querySelectorAllFilter(
    set,
    '[aria-current]',
    vNode =>
      vNode !== virtualNode &&
      getCurrentToken(vNode) !== null &&
      (options?.anyToken || getCurrentToken(vNode) === token) &&
      getCurrentSet(vNode) === set &&
      isVisibleToScreenReaders(vNode) &&
      (getName(vNode) !== name || getHref(vNode) !== href)
  );

  const role = getRole(set, { noPresentational: true });
  this.data({
    role: setRoles.includes(role) ? role : 'parent element',
    token
  });
  this.relatedNodes(others.map(vNode => vNode.actualNode));
  return others.length > 0;
}
