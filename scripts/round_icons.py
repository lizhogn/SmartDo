#!/usr/bin/env python3
"""
Script to add rounded corners to all PNG icons in src-tauri/icons directory.
Requires Pillow: pip install Pillow
"""

import os
from pathlib import Path

try:
    from PIL import Image, ImageDraw
except ImportError:
    print("Error: Pillow is required. Install it with: pip install Pillow")
    exit(1)


def add_rounded_corners(image: Image.Image, radius_percent: float = 0.2) -> Image.Image:
    """
    Add rounded corners to an image.
    
    Args:
        image: PIL Image object
        radius_percent: Corner radius as percentage of the smaller dimension (0.0 to 0.5)
    
    Returns:
        Image with rounded corners and transparency
    """
    # Convert to RGBA if not already
    if image.mode != 'RGBA':
        image = image.convert('RGBA')
    
    width, height = image.size
    min_dim = min(width, height)
    radius = int(min_dim * radius_percent)
    
    # Create a mask with rounded corners
    mask = Image.new('L', (width, height), 0)
    draw = ImageDraw.Draw(mask)
    
    # Draw rounded rectangle on the mask
    draw.rounded_rectangle(
        [(0, 0), (width - 1, height - 1)],
        radius=radius,
        fill=255
    )
    
    # Create output image with transparency
    output = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    output.paste(image, mask=mask)
    
    return output


def process_icons(icons_dir: str, radius_percent: float = 0.2, backup: bool = True):
    """
    Process all PNG icons in the directory and add rounded corners.
    
    Args:
        icons_dir: Path to the icons directory
        radius_percent: Corner radius as percentage (0.0 to 0.5)
        backup: Whether to create backup of original files
    """
    icons_path = Path(icons_dir)
    
    if not icons_path.exists():
        print(f"Error: Directory not found: {icons_dir}")
        return
    
    # Find all PNG files (including in subdirectories)
    png_files = list(icons_path.rglob("*.png"))
    
    if not png_files:
        print("No PNG files found in the directory.")
        return
    
    print(f"Found {len(png_files)} PNG files to process...")
    
    # Create backup directory if needed
    if backup:
        backup_dir = icons_path / "_backup"
        backup_dir.mkdir(exist_ok=True)
    
    processed = 0
    skipped = 0
    
    for png_file in png_files:
        # Skip backup directory
        if "_backup" in str(png_file):
            continue
            
        try:
            # Open the image
            with Image.open(png_file) as img:
                # Skip if image is too small (< 16x16)
                if img.width < 16 or img.height < 16:
                    print(f"  Skipped (too small): {png_file.name}")
                    skipped += 1
                    continue
                
                # Backup original
                if backup:
                    relative_path = png_file.relative_to(icons_path)
                    backup_file = backup_dir / relative_path
                    backup_file.parent.mkdir(parents=True, exist_ok=True)
                    img.save(backup_file)
                
                # Add rounded corners
                rounded_img = add_rounded_corners(img, radius_percent)
                
                # Save the processed image
                rounded_img.save(png_file, 'PNG')
                
                print(f"  Processed: {png_file.name} ({img.width}x{img.height})")
                processed += 1
                
        except Exception as e:
            print(f"  Error processing {png_file.name}: {e}")
            skipped += 1
    
    print(f"\nDone! Processed: {processed}, Skipped: {skipped}")
    if backup:
        print(f"Backups saved in: {backup_dir}")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Add rounded corners to PNG icons"
    )
    parser.add_argument(
        "icons_dir",
        nargs="?",
        default="src-tauri/icons",
        help="Path to icons directory (default: src-tauri/icons)"
    )
    parser.add_argument(
        "-r", "--radius",
        type=float,
        default=0.2,
        help="Corner radius as percentage of image size (default: 0.2 = 20%%)"
    )
    parser.add_argument(
        "--no-backup",
        action="store_true",
        help="Don't create backup of original files"
    )
    
    args = parser.parse_args()
    
    print(f"Processing icons in: {args.icons_dir}")
    print(f"Corner radius: {args.radius * 100:.0f}%")
    print()
    
    process_icons(
        icons_dir=args.icons_dir,
        radius_percent=args.radius,
        backup=not args.no_backup
    )


if __name__ == "__main__":
    main()
