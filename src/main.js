import * as d3 from "d3";
import { colorPalette } from "./colorPalette-trc";
import saveChart from "./saveChart";
import { getColors } from "./getColors";
import { saveJson } from "./saveJson";
import { simulate } from "@bjornlu/colorblind";
import * as blinder from "color-blind";
// import { blinder } from "color-blinder";
//Set all the save button functions
window.saveChart = saveChart;
window.saveJson = saveJson;

window.colorBlindCheck = (cbType) => {
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
    // const rgb = d3.rgb(d.hex);
    // const cb = simulate(rgb, cbType);
    // const newColor = d3.color(`rgb(${cb.r}, ${cb.g}, ${cb.b})`).formatHex();
    // d.hex = blinder.protanomaly(d.hex);
    d.hex = getCBColor(d.hex);
    return d;
  });
  console.log(colors, cbColors);
  const cbPalette = colorPalette().baseColors(cbColors);
  cbSvg.call(cbPalette);
};

// Get current parameters
const params = new URLSearchParams(window.location.search);

//Set current state of input parameters:
document.getElementById("hex-input").value = params.get("hexInput");
params.get("rotation")
  ? (document.getElementById(params.get("rotation")).checked = true)
  : console.log(params.get("rotation"));
document.getElementById("hex-list").value = params.get("hexList");
params.get("rotation") === "custom"
  ? (document.getElementById("custom-rotation").value =
      params.get("customRotation"))
  : null;

// Create the list of colours
const colors = getColors(params);

// Append the svg
const svg = d3
  .select("#palette")
  .append("svg")
  .attr("id", "palette-svg")
  .attr("preserveAspectRatio", "xMinYMin meet")
  .attr("width", "100%")
  .attr("height", "100%");

// Create the image with the palette object
const palette = colorPalette().baseColors(colors);
svg.call(palette);
