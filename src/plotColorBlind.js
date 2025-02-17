import { colorPalette } from "./colorPalette-trc";
import { getColors } from "./getColors";
import * as blinder from "color-blind";

export const plotColorBlind = (cbType) => {
  // const cbDiv = d3.select("body").append("div").attr("class", "palette");
  let getCBColor;
  if (cbType === "deuteranomaly") {
    getCBColor = (hex) => blinder.deuteranomaly(hex);
  } else if (cbType === "protanomaly") {
    getCBColor = (hex) => blinder.protanomaly(hex);
  } else if (cbType === "protanopia") {
    getCBColor = (hex) => blinder.protanopia(hex);
  } else if (cbType === "deuteranopia") {
    getCBColor = (hex) => blinder.deuteranopia(hex);
  }
  const cbDiv = d3.select("#cb-chart");

  let cbSvg;
  cbSvg = cbDiv.select("svg");
  //   console.log(cbSvg.node());

  if (!cbSvg.node()) {
    cbSvg = cbDiv
      .append("svg")
      .attr("id", "colorBlindPalette-svg")
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("width", "100%")
      .attr("height", "100%");
  }

  //   console.log(blinder.protanomaly("#42dead"))

  let params1 = new URLSearchParams(window.location.search);
  const newColors = getColors(params1);
  const cbColors = newColors.map((d) => {
    d.hex = getCBColor(d.hex);
    return d;
  });
  
  const cbPalette = colorPalette().baseColors(cbColors);
  cbSvg.call(cbPalette);
};
