import * as d3 from "d3";
import { colorPalette } from "./colorPalette-trc";
import { getHues } from "./getHues";

const width = 960;
const height = 500;
const nShades = 9;
const padding = 5;
let margin = { top: 20, right: 10, bottom: 0, left: 100 };


const svg = d3
  .select("#chart")
  .append("svg")
  .attr("id", "#chart-svg")
  .attr("preserveAspectRatio", "xMinYMin meet")
  // .attr("viewBox", "0 0 600 400")
  .attr("width", "100%")
  .attr("height", "100%");

const rotations = [330, 30, 120, 180, 240];
const originalColorHex = "#afdef4";

const colors = getHues(originalColorHex, rotations)
const palette = colorPalette()
  .baseColors(colors);

svg.call(palette);
