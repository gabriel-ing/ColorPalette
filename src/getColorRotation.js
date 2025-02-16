export function getColorByHueRotation(originalColor, theta) {
    let complementObject = d3.hsl(originalColor);
    complementObject.h += theta;
    // console.log(complementObject);
    return {
      colorName: `hue + ${theta}°`,
      hex: complementObject.formatHex(),
      colorObject: complementObject,
    };
  }
  