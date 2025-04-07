const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputFile = path.join(__dirname, "../public/tour-guide-ai.png");
const outputDir = path.join(__dirname, "../public/icons");

const generateIcons = async () => {
  try {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const size of sizes) {
      await sharp(inputFile)
        .resize(size, size)
        .toFile(path.join(outputDir, `icon-${size}x${size}.png`));
      console.log(`Generated ${size}x${size} icon`);
    }
  } catch (error) {
    console.error("Error generating icons:", error);
  }
};

void generateIcons();
