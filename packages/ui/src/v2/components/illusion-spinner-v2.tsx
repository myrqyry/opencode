import { For, splitProps, type ComponentProps } from "solid-js"
import "./illusion-spinner-v2.css"

const tiles = [
  [8, 8],
  [12, 6.5],
  [16, 8],
  [17.5, 12],
  [16, 16],
  [12, 17.5],
  [8, 16],
  [6.5, 12],
] as const

export function IllusionSpinnerV2(props: ComponentProps<"svg">) {
  const [local, rest] = splitProps(props, ["class", "classList", "width", "height"])

  return (
    <svg
      {...rest}
      class={local.class}
      classList={local.classList}
      width={local.width ?? 16}
      height={local.height ?? 16}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      data-component="illusion-spinner-v2"
      aria-hidden={rest["aria-hidden"] ?? "true"}
    >
      <rect data-ghost x="8" y="8" width="8" height="8" rx="1" />
      <g data-orbit>
        <For each={tiles}>
          {(tile, index) => (
            <g transform={`translate(${tile[0]} ${tile[1]})`}>
              <g data-counter>
                <rect
                  data-tile={index()}
                  x="-1.75"
                  y="-1.75"
                  width="3.5"
                  height="3.5"
                  rx=".48"
                />
              </g>
            </g>
          )}
        </For>
      </g>
      <rect data-core x="9.85" y="9.85" width="4.3" height="4.3" rx=".68" />
    </svg>
  )
}
