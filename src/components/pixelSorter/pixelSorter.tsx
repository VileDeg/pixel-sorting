import { useState, useRef, useEffect } from 'react'
import p5 from 'p5';
import './styles.ts'

export const PixelSorter: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);

  const p5ParentRef = useRef(document.createElement('div')); //new HTMLElement
  const p5Ref = useRef<p5 | null>(null);

  useEffect(() => {
    console.log("useEffect sketch");
    const sketch = (p: p5) => {
      let img: p5.Image | null = null;
      p.preload = () => {
        if (!imageFile) {
          return;
        }
        const imageUrl = URL.createObjectURL(imageFile!);
        img = p.loadImage(imageUrl, (loadedImg: p5.Image) => {
          URL.revokeObjectURL(imageUrl);

          console.log("Image loaded successfully");
        }, (p1: Event) => {
          console.log("Failed to load image");
        });
      }

      p.setup = () => {
        if (img) {
          p.createCanvas(img.width, img.height);
        } else {
          p.createCanvas(400, 400);
        }
      };

      p.draw = () => {

        if (img) {
          console.log("Displaying image");
          p.image(img!, 0, 0, p.width, p.height);
        } else {
          p.background(240);
          p.fill(255, 0, 100);
          p.ellipse(p.mouseX, p.mouseY, 50, 50);
        }
      };
    };

    // Create a new p5 instance and attach it to the sketchRef
    p5Ref.current = new p5(sketch, p5ParentRef.current);

    // Cleanup on unmount
    return () => {
      console.log("CLEANUP useEffect sketch");
      p5Ref.current?.remove();
    };
  }, [imageFile]);


  // Handle file input change
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      console.log("handleImageUpload: ", imageFile)
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ marginBottom: '10px' }}
      />
      <div ref={p5ParentRef}></div>
    </div>
  );
}

export default PixelSorter;
