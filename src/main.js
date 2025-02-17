import * as d3 from "d3";
import { colorPalette } from "./colorPalette-trc";
import { getHues } from "./getHues";
import saveChart from "./saveChart";
import {
  createPaletteFromInitial,
  plotCustomPalette,
} from "./submissionOptions";
import { getColors } from "./getColors";

window.saveChart = saveChart;
window.createPaletteFromInitial = createPaletteFromInitial;
window.plotCustomPalette = plotCustomPalette;




const params = new URLSearchParams(window.location.search);
const colors = getColors(params);
console.log(colors);
// console.log(colors);
const svg = d3
  .select("#palette")
  .append("svg")
  .attr("id", "palette-svg")
  .attr("preserveAspectRatio", "xMinYMin meet")
  // .attr("viewBox", "0 0 600 400")
  .attr("width", "100%")
  .attr("height", "100%");

const palette = colorPalette().baseColors(colors);

svg.call(palette);
