import { useState, useEffect, useRef } from 'react';

/* Inject crossfade keyframes once */
const STYLE = document.createElement('style');
STYLE.textContent = `
  @keyframes ssf-in  { from { opacity: 0 } to { opacity: 1 } }
  @keyframes ssf-out { from { opacity: 1 } to { opacity: 0 } }
`;
document.head.appendChild(STYLE);

/**
 * Slideshow — cycles through a list of image URLs with a crossfade transition.
 *
 * Props:
 *   images        string[]  — array of image URLs to cycle through (required)
 *   interval      number    — ms each slide is shown (default: 8000)
 *   fadeDuration  number    — ms for the fade-in animation (default: 800)
 *   top           number    — absolute top position in px (default: 0)
 *   left          number    — absolute left position in px (default: 0)
 *   size          number    — sets both width and height to the same value (overrides width/height)
 *   width         number    — container width in px (default: 824)
 *   height        number    — container height in px (default: 824)
 *   objectFit     string    — CSS object-fit for images (default: 'contain')
 */
export default function Slideshow({
  images = [],
  interval = 8000,
  fadeDuration = 800,
  top = 0,
  left = 0,
  size,
  width = 824,
  height = 824,
  objectFit = 'contain',
}) {
  const w = size ?? width;
  const h = size ?? height;
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState(null);
  const currentRef = useRef(0);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => {
      const next = (currentRef.current + 1) % images.length;
      setPrev(currentRef.current);
      currentRef.current = next;
      setCurrent(next);
      setAnimKey((k) => k + 1);
      setTimeout(() => setPrev(null), fadeDuration);
    }, interval);
    return () => clearInterval(id);
  }, [images, interval, fadeDuration]);

  if (!images.length) return null;

  const base = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit,
  };

  return (
    <div style={{ position: 'absolute', top, left, width: w, height: h }}>
      {prev !== null && (
        <img key={`prev-${prev}`} src={images[prev]} alt=""
          style={{ ...base, zIndex: 1, animation: `ssf-out ${fadeDuration}ms ease-in-out forwards` }} />
      )}
      <img key={`cur-${animKey}`} src={images[current]} alt=""
        style={{ ...base, zIndex: 2, animation: `ssf-in ${fadeDuration}ms ease-in-out forwards` }} />
    </div>
  );
}
