import { parse } from "parse5";

function textContent(node) {
  if (node.nodeName === "#text") {
    return node.value ?? "";
  }

  return (node.childNodes ?? []).map(textContent).join("");
}

export function elementTextByAttribute(
  html,
  { tagName, attribute, value },
) {
  const stack = [parse(html)];

  while (stack.length > 0) {
    const node = stack.pop();
    const matchesElement = node?.tagName === tagName;
    const matchesAttribute = node?.attrs?.some(
      (item) => item.name === attribute && item.value === value,
    );

    if (matchesElement && matchesAttribute) {
      return textContent(node);
    }

    stack.push(...(node?.childNodes ?? []));
  }

  return null;
}
