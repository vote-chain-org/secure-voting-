package com.votechain.backend.util;

import javax.imageio.ImageIO;
import java.awt.image.*;
import java.io.*;
import java.util.Base64;

public class FingerprintImageUtil {

    /**
     * Convert raw grayscale base64 string to a temporary PNG file.
     * @param rawBase64  base64-encoded raw pixel bytes (1 byte per pixel, grayscale)
     * @param width      image width in pixels
     * @param height     image height in pixels
     * @return temp PNG file (caller must delete after use)
     */
    public static File rawToTempPng(String rawBase64, int width, int height) throws IOException {
        byte[] raw = Base64.getDecoder().decode(rawBase64);

        BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_BYTE_GRAY);
        byte[] raster = ((DataBufferByte) img.getRaster().getDataBuffer()).getData();
        System.arraycopy(raw, 0, raster, 0, Math.min(raw.length, raster.length));

        File tmp = File.createTempFile("fp_", ".png");
        ImageIO.write(img, "PNG", tmp);
        return tmp;
    }
}
