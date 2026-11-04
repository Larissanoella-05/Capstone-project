/**
 * Size and offset that make an image cover a box, like CSS `object-fit: cover` with an `object-position`.
 * `focus` is the point of the picture (0 to 1 across and down) to keep in view, as the web's
 * `background-position` does for each landing photo. React Native's `cover` can only centre.
 */
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
