# Draw with the mouse


```html
<script src="lib/d3.v5.js"></script>
<svg width="100%" height="500">
    <rect fill="#fff" width="100%" height="100%"></rect>
</svg>
```

```js
  const line = d3.line().curve(d3.curveBasis);

  const dragstarted = () => {
    const d = d3.event.subject;
    const active = svg.append("path").datum(d);

    let x0 = d3.event.x;
    let y0 = d3.event.y;

    d3.event.on("drag", () => {
      const x1 = d3.event.x, y1 = d3.event.y, dx = x1 - x0, dy = y1 - y0;
      // This is terribly inefficient; at the very least, consider rounding!
      if (dx * dx + dy * dy > 100) d.push([x0 = x1, y0 = y1]);
      else d[d.length - 1] = [x1, y1];
      active.attr("d", line);
    });
  };

  const svg = d3.select("svg").call(
    d3.drag()
      .container(function () {
        return this
      })
      .subject(() => {
        const p = [d3.event.x, d3.event.y];
        return [p, p];
      })
      .on("start", dragstarted)
  );
```

```css
path {
    fill: none;
    stroke: cornflowerblue;
    stroke-width: 5px;
    stroke-linejoin: round;
    stroke-linecap: round;
}

```
