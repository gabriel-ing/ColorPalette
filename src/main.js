import * as d3 from "d3";
import { colorPalette } from "./colorPalette-trc";
import saveChart from "./saveChart";
import { getColors } from "./getColors";
import { saveJson } from "./saveJson";

import { plotColorBlind } from "./plotColorBlind";
import { colorPickerFormListener, setInitialState, getLightness } from "./utils";
// import { blinder } from "color-blinder";
//Set all the save button functions
window.saveChart = saveChart;
window.saveJson = saveJson;

window.colorBlindCheck = plotColorBlind;

document
  .getElementById("color-picker-form")
  .addEventListener("input", colorPickerFormListener);

window.copyHexToClipboard = () => {
  const hex = document.getElementById("picker-hex-box").value;
  navigator.clipboard.writeText(hex);
};

window.pickerUseBelow = () => {
  const hex = document.getElementById("picker-hex-box").value;
  document.getElementById("hex-input").value = hex;
};

//Set current state of input parameters:
const params = new URLSearchParams(window.location.search);
setInitialState(params);

// Create the list of colours and shades
const colors = getColors(params);
const lightness = getLightness(params)

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
