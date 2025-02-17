import { select } from "d3";
export const saveJson = () => {
  const palette = select("#palette-svg");
  const outputColors = {};
  const baseColors = palette
    .selectAll("rect")
    .data()
    .map((d) => ({
      baseColor: d.baseColor,
      rgb: d.rgb,
      hex: d.hex,
      lightness: d.lightness,
    }));

  const baseColorsJSON = JSON.stringify(baseColors,null, 2);

  const colorsBlob = new Blob([baseColorsJSON], { type: "application/json" });
  const fileURL = URL.createObjectURL(colorsBlob);
  const downloadLink = document.createElement("a");
  downloadLink.href = fileURL;
  downloadLink.download = `color-palette.json`;
  document.body.appendChild(downloadLink);

  downloadLink.click();
};
