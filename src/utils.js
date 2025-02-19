export const colorPickerFormListener = (event) => {
  const hue = document.getElementById("hue-slider").value;
  const saturation = document.getElementById("saturation-slider").value;
  const lightness = document.getElementById("lightness-slider").value;

  const selectedColor = d3.hsl(hue, saturation, lightness);
  document.getElementById("picker-hex-box").value = selectedColor.formatHex();

  document.getElementById("color-picker-palette").style.backgroundColor =
    selectedColor.formatHex();
};

export function setInitialState(params) {
  const hex = params.get("hexInput");
  const hue = d3.hsl(hex);
  const [h, s, l] = [hue.h, hue.s, hue.l];
  console.log(h, s, l);
  document.getElementById("color-picker-palette").style.backgroundColor = hex;
  document.getElementById("hue-slider").value = h;
  const outputH = document.getElementById("hue-slider").nextElementSibling;
  outputH.value = h.toFixed(0);

  document.getElementById("saturation-slider").value = s;
  const outputS =
    document.getElementById("saturation-slider").nextElementSibling;
  outputS.value = s.toFixed(2);

  document.getElementById("lightness-slider").value = l;
  const outputL =
    document.getElementById("lightness-slider").nextElementSibling;
  outputL.value = l.toFixed(2);
  document.getElementById("picker-hex-box").value = hex;

  document.getElementById("hex-input").value = hex;
  params.get("rotation")
    ? (document.getElementById(params.get("rotation")).checked = true)
    : console.log(params.get("rotation"));

  document.getElementById("hex-list").value = params.get("hexList");

  params.get("rotation") === "custom"
    ? (document.getElementById("custom-rotation").value =
        params.get("customRotation"))
    : null;
}

export function getLightness(params) {
  let lightness;
  let customLightnessId = "custom-lightness";
  if (params.get("hexList")) {
    customLightnessId = "custom-lightness1";
  }
  if (params.get("customLightness")) {
    document.getElementById(customLightnessId).value =
      params.get("customLightness");
    lightness = params
      .get("customLightness")
      .split(",")
      .map((d) => Number(d.trim()));
  } else {
    lightness = [95, 80, 60, 40, 20, 10];
  }
  return lightness;
}
