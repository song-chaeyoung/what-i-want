import { expect, test } from "@playwright/test";

const stepTexts = [
  "만들기",
  "선물 담기",
  "공유하기",
  "링크 보내기",
  "마음 받기",
  "메시지 도착",
] as const;

const viewports = [
  { name: "320px 100%", width: 320, height: 800, fontSize: null, shot: "100" },
  { name: "320px 150%", width: 320, height: 800, fontSize: "150%", shot: "150" },
  { name: "320px 200%", width: 320, height: 800, fontSize: "200%", shot: "200" },
  { name: "390px 100%", width: 390, height: 844, fontSize: null, shot: null },
  { name: "1280px 100%", width: 1280, height: 900, fontSize: null, shot: null },
] as const;

for (const viewport of viewports) {
  test(`home steps stay fully visible at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");
    const list = page.locator('ol[role="list"]');
    await expect(list).toBeVisible();

    if (viewport.fontSize) {
      await page.addStyleTag({
        content: `html { font-size: ${viewport.fontSize} !important; }`,
      });
    }

    const measured = await list.evaluate((element) => {
      const linesOf = (node: Element) => {
        const textNode = node.firstChild;
        const text = textNode?.textContent ?? "";
        if (!textNode || textNode.nodeType !== Node.TEXT_NODE || text.length === 0) {
          return [text.trim()];
        }
        const range = document.createRange();
        const fontSize = Number.parseFloat(getComputedStyle(node).fontSize) || 16;
        const lines: string[] = [];
        let start = 0;
        let lastTop: number | null = null;
        for (let index = 0; index < text.length; index += 1) {
          range.setStart(textNode, index);
          range.setEnd(textNode, index + 1);
          const top = range.getBoundingClientRect().top;
          if (lastTop !== null && top - lastTop > fontSize * 0.6) {
            lines.push(text.slice(start, index));
            start = index;
          }
          lastTop = top;
        }
        lines.push(text.slice(start));
        return lines.map((line) => line.trim()).filter((line) => line.length > 0);
      };

      const nodes = [...element.querySelectorAll("h2, p")].map((node) => {
        const style = getComputedStyle(node);
        const textNode = node.firstChild;
        const text = textNode?.textContent ?? "";
        let inkRight = 0;
        if (textNode && textNode.nodeType === Node.TEXT_NODE && text.length > 0) {
          const range = document.createRange();
          for (let index = 0; index < text.length; index += 1) {
            range.setStart(textNode, index);
            range.setEnd(textNode, index + 1);
            inkRight = Math.max(inkRight, range.getBoundingClientRect().right);
          }
        }
        return {
          text: node.textContent?.trim() ?? "",
          lines: linesOf(node),
          scrollWidth: node.scrollWidth,
          clientWidth: node.clientWidth,
          scrollHeight: node.scrollHeight,
          clientHeight: node.clientHeight,
          right: inkRight,
          textOverflow: style.textOverflow,
          whiteSpace: style.whiteSpace,
          wordBreak: style.wordBreak,
          overflowWrap: style.overflowWrap,
          overflowX: style.overflowX,
        };
      });
      const heading = document.querySelector("h1");
      return {
        nodes,
        viewport: document.documentElement.clientWidth,
        pageOverflow:
          document.documentElement.scrollWidth - document.documentElement.clientWidth,
        headingRight: heading ? Math.round(heading.getBoundingClientRect().right) : null,
      };
    });

    expect(measured.nodes.map((node) => node.text)).toEqual([...stepTexts]);
    for (const node of measured.nodes) {
      expect(node.textOverflow, node.text).not.toBe("ellipsis");
      expect(node.whiteSpace, node.text).not.toBe("nowrap");
      expect(node.wordBreak, node.text).toBe("keep-all");
      expect(node.overflowWrap, node.text).toBe("break-word");
      expect(node.overflowX, node.text).not.toBe("hidden");
      expect(node.scrollWidth, node.text).toBeLessThanOrEqual(node.clientWidth);
      expect(node.scrollHeight, node.text).toBeLessThanOrEqual(node.clientHeight);
      if (node.text.includes(" ") && node.lines.length > 1) {
        const words = node.text.split(/\s+/);
        for (const line of node.lines) {
          expect(words, `${node.text} -> ${node.lines.join(" | ")}`).toContain(line);
        }
      }
      expect(node.right, node.text).toBeLessThanOrEqual(measured.viewport + 1);
    }

    if (viewport.fontSize === null) {
      expect(measured.pageOverflow).toBeLessThanOrEqual(0);
      for (const node of measured.nodes) {
        expect(node.lines, node.text).toEqual([node.text]);
      }
    } else if (measured.pageOverflow > 0) {
      expect(measured.headingRight).not.toBeNull();
      expect(measured.headingRight! - measured.viewport).toBe(measured.pageOverflow);
    }

    if (viewport.shot) {
      await list.screenshot({
        path: `test-results/home-steps-320-${viewport.shot}.png`,
      });
    }
  });
}
