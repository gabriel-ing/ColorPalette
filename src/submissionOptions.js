import { getHues } from "./getHues";
import { colorPalette } from "./colorPalette-trc";
import * as d3 from "d3";

export const createPaletteFromInitial = (event) => {
//   event.preventDefault();

  const originalColorHex = event.target.hexInput.value;
  if (!d3.color(originalColorHex)) {
    alert(
      `Error - ${originalColorHex} is not a hex colour, please input a valid colour`
    );
    return -1;
  }



  const rotationOptions = {
    default1: [-30, 30, 120, 180, 240],
    default2: [-60, 60, 150, 180, 210],
    analogous:[20, 40, 60, 80, 100],
    divergent: [60, 120, 180, 240, 300],
  };

  const svg = d3.select("#palette-svg");
  //   svg.append("rect").attr("width", 100).height("height", 100)
  //   console.log(svg)

  console.log(event.target.rotation.value)
  const rotations = rotationOptions[event.target.rotation.value]
  console.log(rotations)
  const colors = getHues(originalColorHex, rotations);
  const palette = colorPalette().baseColors(colors);

  svg.call(palette);
};

export const plotCustomPalette = (event)=>{
    // event.preventDefault();
    
    const hexListInput = event.target.hexList.value

    const svg = d3.select("#palette-svg");
    
    let colors = hexListInput.split(",").map(d=> d.trim())
    colors.forEach(color=>{
        
        // console.log(d3.color(color))
        if (!d3.color(color)){
            alert(`Error! ${color} is not a valid colour hex code, please enter valid colours.`)
            return -1
        }
    })
    colors = colors.map(d=> ({hex: d}))
    const palette = colorPalette().baseColors(colors);
  
    svg.call(palette);
    
}
