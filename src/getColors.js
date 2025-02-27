import { getHues } from "./getHues";
import * as d3 from "d3";

const setDefaultColors = (colors) => {
  const rotations = [60, 120, 180, 240, 300];
  const originalColorHex = "#7de888";
  const defaultColors = getHues(originalColorHex, rotations);
  return defaultColors;
};

const rotationOptions = {
  default1: [-30, 30, 120, 180, 240],
  default2: [-60, 60, 150, 180, 210],
  analogous: [20, 40, 60, 80, 100, 120],
  divergent: [60, 120, 180, 240, 300],
  goldenRatio: [32.5, 52.5, 85.0, 137.5, 222.5],
  goldenRatio2: [-32.5, -52.5, -85.0, -137.5, -222.5],
};
export function getColors(params) {
  let colors;
  if (params.get("hexInput") && params.get("rotation")) {
    let rotations;
    const hexInput = params.get("hexInput");
    if (!d3.color(hexInput)) {
      alert(
        `Error - ${hexInput} is not a hex colour, please input a valid colour`
      );
      colors = setDefaultColors();
      return colors;
    }

    if (params.get("rotation") === "custom") {
      rotations = params
        .get("customRotation")
        .split(",")
        .map((d) => Number(d.trim()));
      if (!rotations | (rotations.length === 1)) {
        alert("Please enter hue values as a comma separated list");
        colors = setDefaultColors();
        return colors;
      }
    } else {
      rotations = rotationOptions[params.get("rotation")];
    }

    colors = getHues(hexInput, rotations);
  } else if (params.get("hexList")) {
    const hexListInput = params.get("hexList");

    let colorList = hexListInput.split(",").map((d) => d.trim());
    colorList.forEach((color) => {
      // console.log(d3.color(color))
      if (!d3.color(color)) {
        alert(
          `Error! ${color} is not a valid colour hex code, please enter valid colours.`
        );
        colors = setDefaultColors();
        return colors;
      }
    });
    colors = colorList.map((d) => ({ hex: d }));
  } else {
    colors = setDefaultColors();
  }
  return colors;
}
