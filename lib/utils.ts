import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// @theme의 --text-* / --shadow-* 이름. 기본 tailwind-merge는 이 글자 크기를 색으로,
// 이 그림자를 그림자 색으로 보아 뒤의 text-* / shadow-* 색에 지운다.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["micro", "caption", "tab", "nav"],
      shadow: [
        "pixel-xs",
        "pixel-sm",
        "pixel-md",
        "pixel-lg",
        "pixel-xl",
        "header-line",
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
