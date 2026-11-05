/** Size and offset that make an image cover a box around `focus` (0 to 1 across and down); React Native's `cover` can only centre. */
export function coverFrame(image, box, focus = { x: 0.5, y: 0.5 }) {
  const scale = Math.max(box.width / image.width, box.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  return {
    width,
    height,
    left: -(width - box.width) * focus.x,
    top: -(height - box.height) * focus.y,
  };
}
