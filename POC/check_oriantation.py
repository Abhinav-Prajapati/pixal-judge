from PIL import Image, ExifTags

img_pot = "/home/titan/workspace/cluster-image/assets/images/46156354-d635-474a-a2fd-25a11c9f3d0e.jpg"
img_land = "/home/titan/workspace/cluster-image/assets/images/e84da338-2a17-446a-bc5b-b385538dcc65.jpg"

SCALE = 150
ASPECT_16x9 = 16 / 9

THUMB_SIZES = {
    "landscape": {
        "width": SCALE,
        "height": int(SCALE * ASPECT_16x9),
    },
    "portrait": {
        "width": int(SCALE * ASPECT_16x9),
        "height": SCALE,
    },
}

with Image.open(img_land) as img:
    try:
        exif = img._getexif()
        if exif:
            orientation_key = next(
                k for k, v in ExifTags.TAGS.items() if v == "Orientation"
            )
            orientation = exif.get(orientation_key)
    except Exception:
        pass 

    width, height = img.size

    if orientation == 1:
        new_height = THUMB_SIZES["landscape"]["width"]
        new_width = THUMB_SIZES["landscape"]["height"]
    else:
        new_width = THUMB_SIZES["portrait"]["width"]
        new_height = THUMB_SIZES["portrait"]["height"]

    thumb = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
    if thumb.mode in ('RGBA', 'LA', 'P'):
        thumb = thumb.convert('RGB')

    if orientation == 1:
        pass
    else:
        thumb = thumb.rotate(270, expand=True)

    thumb.save("h.jpg", "JPEG", quality=85, optimize=True)