import * as d3 from "d3";
import { colorPalette } from "./colorPalette-trc";
import saveChart from "./saveChart";
import { getColors } from "./getColors";
import { saveJson } from "./saveJson";

//Set all the save button functions
window.saveChart = saveChart;
window.saveJson = saveJson;

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
