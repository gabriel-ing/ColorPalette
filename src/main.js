import * as d3 from "d3";
import { colorPalette } from "./colorPalette-trc";
import { getHues } from "./getHues";
import saveChart from "./saveChart";
import { createPaletteFromInitial,plotCustomPalette } from "./submissionOptions";


window.saveChart = saveChart;
window.createPaletteFromInitial = createPaletteFromInitial
window.plotCustomPalette = plotCustomPalette
const width = 960;
const height = 500;
const nShades = 9;
const padding = 5;
let margin = { top: 20, right: 10, bottom: 0, left: 100 };


const svg = d3
  .select("#palette")
  .append("svg")
  .attr("id", "palette-svg")
  .attr("preserveAspectRatio", "xMinYMin meet")
  // .attr("viewBox", "0 0 600 400")
  .attr("width", "100%")
  .attr("height", "100%");

const rotations = [-30, 30, 120, 180, 240];
const originalColorHex = "#afdef4";

const colors = getHues(originalColorHex, rotations)
const palette = colorPalette()
  .baseColors(colors);

svg.call(palette);
