function getColorByHueRotation(originalColor, theta) {
  let complementObject = d3.hsl(originalColor);
  complementObject.h += theta;
  // console.log(complementObject);
  return {
    colorName: theta > 0 ? `+${theta}°` : `${theta}°`,
    hex: complementObject.formatHex(),
    colorObject: complementObject,
  };
}

export const getHues = (originalHex, rotations) => {
  const originalColor = {
    colorName: "Original Colour",
    hex: originalHex,
  };

  originalColor["colorObject"] = d3.color(originalColor.hex);
  const baseColors = [];
  baseColors.push(originalColor);

  rotations.forEach((theta) => {
    baseColors.push(getColorByHueRotation(originalColor.colorObject, theta));
  });
  return baseColors;
};
