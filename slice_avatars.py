
import os
from PIL import Image

# Source image path
source_path = '/Users/stockfamily/.gemini/antigravity/brain/bfed1411-867a-483f-9949-1658a018bec6/uploaded_image_1767889320469.jpg'
output_dir = '/Users/stockfamily/Desktop/Home_Page/TalentEarthStudios/public/mocks'

# Ensure output directory exists
os.makedirs(output_dir, exist_ok=True)

# Open the image
img = Image.open(source_path)
width, height = img.size

# Grid dimensions
rows = 2
cols = 5

# Calculate cell size
cell_width = width // cols
cell_height = height // rows

print(f"Image size: {width}x{height}")
print(f"Cell size: {cell_width}x{cell_height}")

# Slice and save
count = 1
for r in range(rows):
    for c in range(cols):
        left = c * cell_width
        top = r * cell_height
        right = left + cell_width
        bottom = top + cell_height
        
        # Crop
        crop = img.crop((left, top, right, bottom))
        
        # Save
        filename = f"avatar-{count}.jpg"
        crop.save(os.path.join(output_dir, filename))
        print(f"Saved {filename}")
        count += 1
