import { wrap } from "./wrapText";

export const colorPalette = () => {
  let baseColors;
  let margin = { top: 20, right: 10, bottom: 0, left: 120 };
  let shades = [95,90,80,70,60,50,40,30,20,10]
  
  let padding = 10;
  const my = (selection) => {
    // console.log(selection);
    let nShades = shades.length;

    const width = selection.node().getBoundingClientRect().width;
    const height = selection.node().getBoundingClientRect().height;
    selection.attr("viewBox", `0 0 ${width} ${height}`);

    // console.log(baseColors);
    const tooltip = d3.select("#tooltip");

    const cols = selection
      .selectAll(".columns")
      .data(baseColors)
      .join("g")
      .attr("class", "columns")
      .attr(
        "transform",
        (d, i) =>
          `translate(${
            (i * (width - margin.left - margin.right)) / baseColors.length +
            margin.left
          },0)`
      );

    const yPos = (d, i) =>
      (i * (height - margin.top - margin.bottom)) / (nShades + 1) + margin.top;

    let columnWidth =
      (width - margin.left - margin.right) / baseColors.length - padding;
    let rectHeight = height / (nShades + 1) - padding;
    const rows = cols
      .selectAll("g")
      .data((column) => {
        console.log(column)
        const color = d3.color(column.hex);
        const hsl = d3.hsl(color);


        const colors = shades.map((d) => {
          //   const textColor = d3.hsl(colorScale(d));
          //   textColor.s = 0;
          //   textColor.l = 1-textColor.l
          const c = hsl.copy()
          c.l = d/100
          return {
            // i: d,
            baseColor: column.hex,
            rgb: c.formatRgb(),
            lightness: `${d}%`,
            hex: c.formatHex(),
            textColor: d3.hsl(c).l > 0.6 ? "#363636" : "#e6e6e6",
          };
        });

        colors.unshift({
          // i: hsl.l > 0.5 ? 0 : nShades,
          baseColor: "True",
          rgb: d3.color(column.hex).formatRgb(),
          hex: column.hex,
          lightness: "n/a",
          textColor: d3.hsl(column.hex).l > 0.5 ? "#363636" : "#e6e6e6",
        });
        console.log(colors)
        return colors;
      })
      .join("g")
      .attr("class", "column-row")
      .attr("transform", (d, i) => `translate(0, ${yPos(d, i)})`);

    rows
      .selectAll("rect")
      .data((node) => [node])
      .join("rect")
      .attr("class", "color-square")
      .attr("width", columnWidth)
      .attr("height", rectHeight)
      .attr("stroke", "#c9c9c9")
      .attr("stroke-width", 0.5)
      .attr("y", 0)
      .attr("fill", (d) => d.rgb)
      .on("click", (event, d) => {
        console.log(d);
        navigator.clipboard.writeText(d.hex);

        tooltip.html(`${d.hex} <br>Copied to clipboard!`);
        tooltip
          .style("opacity", 1)
          .style("border", `1px solid black`)
          .style("color", d.textColor)
          .style("background-color", d.hex)
          .style("left", `${event.pageX}px`)
          .style("top", `${event.pageY}px`);

        tooltip.transition().duration(800).delay(10).style("opacity", 0);
      });

    rows
      .selectAll("text")
      .data((node) => [node])
      .join("text")
      .attr("class", "hex-label")
      .attr("fill", (d) => d.textColor)
      .attr("y", rectHeight - padding)
      .attr("x", padding)
      .text((d) => d.hex);
    selection
      .selectAll("line")
      .data([null])
      .join("line")
      .attr("y1", yPos(0, 1) - padding / 2)
      .attr("y2", yPos(0, 1) - padding / 2)
      .attr("x1", margin.left)
      .attr("x2", width - margin.right - padding)
      .attr("stroke-width", 1)
      .attr("stroke", "black");

    cols
      .selectAll(".column-label")
      .data((column) => [column])
      .join("text")
      .attr("class", "column-label label")
      .attr("x", columnWidth / 2)
      .attr("text-anchor", "middle")
      .attr("y", margin.top - 5)
      .text((d) => d.colorName);

    // const labelScale = d3
    //   .scaleLinear()
    //   .domain([0, nShades - 1])
    //   .range([90, 10]);
    const rowLabels = shades
      .map((d) => `${d.toFixed(0)}%`);
    rowLabels.unshift("Base Colours");
    selection
      .selectAll(".row-label")
      .data(rowLabels)
      .join("text")
      .attr("x", margin.left - padding)
      .attr("class", "row-label label")
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .attr("text-align", "middle")
      .attr("dy", "0.1em")
      .attr("y", (d, i) => yPos(d, i) + rectHeight / 2)
      .text((d) => d);
    // .call(wrap, 50);
    selection
      .selectAll(".lightness-label")
      .data([null])
      .join("text")
      .attr("class", "lightness-label label")
      .attr("x", 5)
      .attr("y", (height - margin.top - rectHeight) / 2 + rectHeight)
      .attr(
        "transform",
        `rotate(-90,${margin.left / 3},${
          (height - margin.top - rectHeight) / 2 + rectHeight
        }  )`
      )
      .text("Lightness");
  };

  my.baseColors = function (_) {
    return arguments.length ? ((baseColors = _), my) : baseColors;
  };
  my.margin = function (_) {
    return arguments.length ? ((margin = _), my) : margin;
  };
  my.padding = function (_) {
    return arguments.length ? ((padding = _), my) : padding;
  };
  my.shades = function (_) {
    return arguments.length ? ((shades = _), my) : shades;
  };
  return my;
};
