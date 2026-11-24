/**
 * Prefixes root-relative links in Markdown and MDX content with the site's base path, so pages
 * can link to "/objects/payment/" and still work when the site is served from a sub-path such as
 * https://ponchocare.github.io/ponchopay-api-docs/.
 *
 * Handles plain Markdown links (<a href>) and the `href` prop of MDX components such as
 * <LinkCard href="/..." />.
 *
 * @param {{ base?: string }} options
 */
export function rehypeBaseLinks({ base = '/' } = {}) {
  const prefix = base.replace(/\/+$/, '');

  /** @param {unknown} href */
  const shouldPrefix = (href) =>
    Boolean(prefix) &&
    typeof href === 'string' &&
    href.startsWith('/') &&
    !href.startsWith('//') &&
    !href.startsWith(`${prefix}/`);

  /** @param {any} node */
  const visit = (node) => {
    if (node.type === 'element' && node.tagName === 'a' && shouldPrefix(node.properties?.href)) {
      node.properties.href = prefix + node.properties.href;
    }
    if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
      for (const attribute of node.attributes ?? []) {
        if (attribute.name === 'href' && shouldPrefix(attribute.value)) {
          attribute.value = prefix + attribute.value;
        }
      }
    }
    node.children?.forEach(visit);
  };

  return (/** @type {any} */ tree) => visit(tree);
}
