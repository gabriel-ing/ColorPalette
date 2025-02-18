import * as d3 from "d3";
import { colorPalette } from "./colorPalette-trc";
import saveChart from "./saveChart";
import { getColors } from "./getColors";
import { saveJson } from "./saveJson";

import { plotColorBlind } from "./plotColorBlind";
// import { blinder } from "color-blinder";
//Set all the save button functions
window.saveChart = saveChart;
window.saveJson = saveJson;

window.colorBlindCheck = plotColorBlind;

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
// console.log(params.get("customLightness"))

let lightness;
let customLightnessId = "custom-lightness"
if (params.get("hexList")){
  customLightnessId = "custom-lightness1"
}
if (params.get("customLightness")) {
  document.getElementById(customLightnessId).value =
    params.get("customLightness");
  lightness = params
    .get("customLightness")
    .split(",")
    .map((d) => Number(d.trim()));
} else {
  lightness = [95, 90, 80, 70, 60, 50, 40, 30, 20, 10];
}
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
const palette = colorPalette().baseColors(colors).shades(lightness);
svg.call(palette);
